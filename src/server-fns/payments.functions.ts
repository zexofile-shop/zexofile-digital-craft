import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac } from "node:crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getSecret } from "./app-secrets.server";

const keyId = async () => {
  const v = (await getSecret("RAZORPAY_KEY_ID")) ?? process.env.VITE_RAZORPAY_KEY_ID;
  if (!v) throw new Error("RAZORPAY_KEY_ID not configured");
  return v;
};
const keySecret = async () => {
  const v = (await getSecret("RAZORPAY_KEY_SECRET")) ?? process.env.RAZORPAY_SECRET_KEY;
  if (!v) throw new Error("RAZORPAY_KEY_SECRET not configured");
  return v;
};

async function rzpFetch(path: string, init: RequestInit) {
  const auth = "Basic " + Buffer.from(`${await keyId()}:${await keySecret()}`).toString("base64");
  const r = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: auth, "Content-Type": "application/json" },
  });
  const json = await r.json();
  if (!r.ok) throw new Error((json as any)?.error?.description || `Razorpay ${r.status}`);
  return json;
}

/** Public: expose key id to the browser for Razorpay checkout */
export const getRazorpayKeyId = createServerFn({ method: "GET" }).handler(async () => ({
  keyId: (await getSecret("RAZORPAY_KEY_ID")) ?? process.env.VITE_RAZORPAY_KEY_ID ?? null,
}));

/** Create a Razorpay order for either a product purchase or wallet top-up. */
export const createRzpOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      amountInr: z.number().int().min(1).max(500000),
      purpose: z.enum(["wallet_topup", "product"]),
      productId: z.string().uuid().optional(),
      walletUsed: z.number().min(0).optional(),
      couponId: z.string().uuid().optional(),
      couponDiscount: z.number().min(0).optional(),
      orderType: z.enum(["source_code", "customization"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const order = (await rzpFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: Math.round(data.amountInr * 100),
        currency: "INR",
        notes: { userId, purpose: data.purpose, productId: data.productId ?? "" },
      }),
    })) as any;

    if (data.purpose === "product" && data.productId) {
      await supabaseAdmin.from("orders").insert({
        user_id: userId,
        product_id: data.productId,
        order_type: data.orderType ?? "source_code",
        amount: data.amountInr,
        wallet_used: data.walletUsed ?? 0,
        coupon_id: data.couponId ?? null,
        coupon_discount: data.couponDiscount ?? 0,
        razorpay_order_id: order.id,
        status: "pending",
      });
    }
    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: await keyId() };
  });

/** Verify HMAC + credit wallet / mark order paid */
export const verifyRzpPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      razorpay_order_id: z.string().min(5),
      razorpay_payment_id: z.string().min(5),
      razorpay_signature: z.string().min(5),
      purpose: z.enum(["wallet_topup", "product"]),
      amountInr: z.number().int().min(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const expected = createHmac("sha256", await keySecret())
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    if (expected !== data.razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    if (data.purpose === "wallet_topup") {
      const { data: prof } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", userId).single();
      const newBal = Number(prof?.wallet_balance ?? 0) + data.amountInr;
      await supabaseAdmin.from("profiles").update({ wallet_balance: newBal }).eq("id", userId);
      await supabaseAdmin.from("wallet_transactions").insert({
        user_id: userId,
        amount: data.amountInr,
        balance_after: newBal,
        type: "credit_topup",
        razorpay_payment_id: data.razorpay_payment_id,
        note: `Wallet top-up: +${data.amountInr} Zexo Coins`,
      });
      return { ok: true, balance: newBal };
    }

    // product purchase
    const { data: ord } = await supabaseAdmin
      .from("orders").select("*, products(instant_delivery_url, instant_delivery_enabled)")
      .eq("razorpay_order_id", data.razorpay_order_id).maybeSingle();
    if (!ord) throw new Error("Order not found");

    const deliveryUrl = ord.order_type === "source_code" && (ord as any).products?.instant_delivery_enabled
      ? (ord as any).products?.instant_delivery_url ?? null : null;

    await supabaseAdmin.from("orders").update({
      status: deliveryUrl ? "delivered" : "paid",
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_signature: data.razorpay_signature,
      paid_at: new Date().toISOString(),
      delivered_at: deliveryUrl ? new Date().toISOString() : null,
      delivery_url: deliveryUrl,
    }).eq("id", ord.id);

    // increment user totals + deduct wallet if used
    if (Number(ord.wallet_used) > 0) {
      const { data: prof } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", userId).single();
      const newBal = Math.max(0, Number(prof?.wallet_balance ?? 0) - Number(ord.wallet_used));
      await supabaseAdmin.from("profiles").update({ wallet_balance: newBal }).eq("id", userId);
      await supabaseAdmin.from("wallet_transactions").insert({
        user_id: userId, amount: Number(ord.wallet_used), balance_after: newBal,
        type: "debit_purchase", order_id: ord.id, product_id: ord.product_id,
        note: "Coins used on purchase",
      });
      await supabaseAdmin.from("notifications").insert({
        user_id: userId, target: "user",
        title: `−${Number(ord.wallet_used)} Zexo Coins used`,
        message: `Used on order #${String(ord.id).slice(0, 8)}. New balance: ${newBal} coins.`,
      });
    }
    if (ord.coupon_id) {
      await supabaseAdmin.from("coupon_usage").insert({ coupon_id: ord.coupon_id, user_id: userId, order_id: ord.id });
    }
    await supabaseAdmin.from("notifications").insert({
      user_id: userId, target: "user",
      title: "Order successful 🎉",
      message: deliveryUrl ? `Your order is ready — check Orders for instant delivery link.` : `Payment received. We'll deliver shortly.`,
    });
    return { ok: true, deliveryUrl };
  });

/** Pay entirely with wallet (no Razorpay). */
export const payWithWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      productId: z.string().uuid(),
      amountInr: z.number().int().min(1),
      orderType: z.enum(["source_code", "customization"]),
      couponId: z.string().uuid().optional(),
      couponDiscount: z.number().min(0).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: prof } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", userId).single();
    const bal = Number(prof?.wallet_balance ?? 0);
    if (bal < data.amountInr) throw new Error("Insufficient Zexo Coins");

    const { data: prod } = await supabaseAdmin
      .from("products").select("instant_delivery_url, instant_delivery_enabled").eq("id", data.productId).single();
    const deliveryUrl = data.orderType === "source_code" && prod?.instant_delivery_enabled ? prod.instant_delivery_url : null;

    const { data: order } = await supabaseAdmin.from("orders").insert({
      user_id: userId, product_id: data.productId, order_type: data.orderType,
      amount: data.amountInr, wallet_used: data.amountInr,
      coupon_id: data.couponId ?? null, coupon_discount: data.couponDiscount ?? 0,
      status: deliveryUrl ? "delivered" : "paid",
      paid_at: new Date().toISOString(),
      delivered_at: deliveryUrl ? new Date().toISOString() : null,
      delivery_url: deliveryUrl,
    }).select().single();

    const newBal = bal - data.amountInr;
    await supabaseAdmin.from("profiles").update({ wallet_balance: newBal }).eq("id", userId);
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: userId, amount: data.amountInr, balance_after: newBal,
      type: "debit_purchase", order_id: order!.id, product_id: data.productId,
      note: "Paid fully with Zexo Coins",
    });
    if (data.couponId) {
      await supabaseAdmin.from("coupon_usage").insert({ coupon_id: data.couponId, user_id: userId, order_id: order!.id });
    }
    await supabaseAdmin.from("notifications").insert({
      user_id: userId, target: "user",
      title: `−${data.amountInr} Zexo Coins used`,
      message: `Paid fully with coins. New balance: ${newBal} coins.`,
    });
    return { ok: true, deliveryUrl, orderId: order!.id };
  });

/** Validate a coupon code against a product+amount for the current user. */
export const validateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      code: z.string().min(1).max(64),
      productId: z.string().uuid(),
      amountInr: z.number().min(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const code = data.code.trim().toUpperCase();
    const { data: c } = await supabaseAdmin
      .from("coupons").select("*").eq("code", code).eq("is_active", true).maybeSingle();
    if (!c) throw new Error("Invalid coupon code");

    const now = new Date();
    if (c.valid_from && new Date(c.valid_from) > now) throw new Error("Coupon not active yet");
    if (c.expires_at && new Date(c.expires_at) < now) throw new Error("Coupon has expired");
    if (c.user_email) {
      const { data: prof } = await supabaseAdmin.from("profiles").select("email").eq("id", userId).single();
      if ((prof?.email ?? "").toLowerCase() !== c.user_email.toLowerCase()) throw new Error("Coupon not valid for your account");
    }
    if (Number(c.min_order_amount ?? 0) > data.amountInr) {
      throw new Error(`Minimum order ₹${c.min_order_amount} required`);
    }
    if (Array.isArray(c.product_ids) && c.product_ids.length > 0 && !c.product_ids.includes(data.productId)) {
      throw new Error("Coupon not applicable on this product");
    }
    // usage limits
    const { count: userUses } = await supabaseAdmin.from("coupon_usage")
      .select("id", { count: "exact", head: true }).eq("coupon_id", c.id).eq("user_id", userId);
    if (c.per_user_limit && (userUses ?? 0) >= c.per_user_limit) throw new Error("You've already used this coupon");
    if (c.total_usage_limit) {
      const { count: total } = await supabaseAdmin.from("coupon_usage")
        .select("id", { count: "exact", head: true }).eq("coupon_id", c.id);
      if ((total ?? 0) >= c.total_usage_limit) throw new Error("Coupon usage limit reached");
    }

    let discount = 0;
    if (c.discount_type === "percentage") {
      discount = (data.amountInr * Number(c.discount_value)) / 100;
      if (c.max_discount) discount = Math.min(discount, Number(c.max_discount));
    } else {
      discount = Number(c.discount_value);
    }
    discount = Math.min(Math.round(discount), data.amountInr);
    return { couponId: c.id, code: c.code, discount, discountType: c.discount_type };
  });
