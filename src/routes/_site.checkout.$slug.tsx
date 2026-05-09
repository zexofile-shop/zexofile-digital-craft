import { createFileRoute, Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Tag, Wallet, CheckCircle2, Loader2, Zap } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ZexoCoin, ZexoBalance } from "@/components/ZexoCoin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { withAuthHeaders } from "@/lib/server-fn-auth";
import { createRzpOrder, verifyRzpPayment, payWithWallet, validateCoupon } from "@/server-fns/payments.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ type: z.enum(["source", "custom"]).default("source") });

export const Route = createFileRoute("/_site/checkout/$slug")({
  component: CheckoutPage,
  validateSearch: (s) => searchSchema.parse(s),
});

declare global { interface Window { Razorpay: any } }
function loadRzp(): Promise<void> {
  return new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(); s.onerror = () => rej(new Error("Razorpay failed to load"));
    document.body.appendChild(s);
  });
}

const TAX_RATE = 0.18; // 18% GST shown for transparency (already included in display price)

function CheckoutPage() {
  const { slug } = useParams({ from: "/_site/checkout/$slug" });
  const { type } = useSearch({ from: "/_site/checkout/$slug" });
  const { user, profile, profileCompletion, refresh, loading } = useAuth();
  const nav = useNavigate();
  const [p, setP] = useState<any>(null);
  const [loadingP, setLoadingP] = useState(true);
  const [useCoins, setUseCoins] = useState(true);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ couponId: string; code: string; discount: number } | null>(null);
  const [applying, setApplying] = useState(false);
  const [paying, setPaying] = useState(false);

  const create = useServerFn(createRzpOrder);
  const verify = useServerFn(verifyRzpPayment);
  const wallet = useServerFn(payWithWallet);
  const apply  = useServerFn(validateCoupon);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle()
      .then(({ data }) => { setP(data); setLoadingP(false); });
  }, [slug]);

  const orderType: "source_code" | "customization" = type === "custom" ? "customization" : "source_code";

  const basePrice = useMemo(() => {
    if (!p) return 0;
    const fallback = p.discount_price ?? p.regular_price;
    return Math.round(orderType === "customization"
      ? Number(p.customization_price ?? fallback)
      : Number(p.source_code_price ?? fallback));
  }, [p, orderType]);

  // Treat displayed price as GST-inclusive: subtotal = price/1.18, tax = price - subtotal
  const subtotal = Math.round(basePrice / (1 + TAX_RATE));
  const tax = basePrice - subtotal;

  const couponDiscount = coupon?.discount ?? 0;
  const afterCoupon = Math.max(0, basePrice - couponDiscount);

  const balance = Math.floor(Number(profile?.wallet_balance ?? 0));
  const coinsToUse = useCoins ? Math.min(balance, afterCoupon) : 0;
  const payable = Math.max(0, afterCoupon - coinsToUse);

  const applyCoupon = async () => {
    if (!code.trim() || !p) return;
    setApplying(true);
    try {
      const res = await apply(await withAuthHeaders({ code: code.trim(), productId: p.id, amountInr: basePrice }));
      setCoupon(res);
      toast.success(`Coupon applied — saved ₹${res.discount}`);
    } catch (e: any) { toast.error(e.message); setCoupon(null); }
    finally { setApplying(false); }
  };

  const placeOrder = async () => {
    if (!user || !p || paying) return;
    if (profileCompletion < 80) { toast.error(`Complete profile first (${profileCompletion}% / 80%)`); return; }
    setPaying(true);

    try {
      // 100% coins → no Razorpay
      if (payable === 0) {
        const res = await wallet(await withAuthHeaders({
          productId: p.id, amountInr: afterCoupon, orderType,
          couponId: coupon?.couponId, couponDiscount,
        }));
        toast.success("Payment complete with Zexo Coins!");
        await refresh();
        if (orderType === "customization") {
          nav({ to: "/custom-order", search: { orderId: res.orderId, productId: p.id } });
        } else {
          nav({ to: "/orders" });
        }
        return;
      }

      // Razorpay path
      await loadRzp();
      const { orderId, amount, currency, keyId } = await create(await withAuthHeaders({
        amountInr: payable, purpose: "product", productId: p.id, orderType,
        walletUsed: coinsToUse, couponId: coupon?.couponId, couponDiscount,
      }));
      if (!keyId) throw new Error("Razorpay key not configured");

      const rzp = new window.Razorpay({
        key: keyId, amount, currency, order_id: orderId,
        name: "Zexofile Shop", description: p.name,
        prefill: { email: user.email, name: profile?.first_name ?? "" },
        theme: { color: "#1e40af" },
        handler: async (resp: any) => {
          try {
            await verify(await withAuthHeaders({ ...resp, purpose: "product", amountInr: payable }));
            toast.success("Payment successful!");
            await refresh();
            if (orderType === "customization") {
              nav({ to: "/custom-order", search: { productId: p.id } });
            } else {
              nav({ to: "/orders" });
            }
          } catch (e: any) { toast.error(e.message); }
          finally { setPaying(false); }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message);
      setPaying(false);
    }
  };

  if (loadingP) return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  if (!p) return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Product not found</h1>
      <Link to="/products"><Button className="mt-6 rounded-full">Back to products</Button></Link>
    </div>
  );

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/products/$slug" params={{ slug }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to product
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">Checkout</h1>
      <p className="text-sm text-muted-foreground">Review your order, apply coupons & coins, then pay securely.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* LEFT — product + coupon + coins */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card">
            <div className="flex items-start gap-4">
              {p.banner_image && <img src={p.banner_image} alt={p.name} className="h-20 w-28 rounded-xl object-cover ring-1 ring-border" />}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{orderType === "customization" ? "Customization" : "Source Code"}</div>
                <div className="font-bold truncate">{p.name}</div>
                {p.short_description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>}
              </div>
              <div className="text-right shrink-0">
                <div className="font-extrabold text-lg">₹{basePrice.toLocaleString("en-IN")}</div>
                {p.instant_delivery_enabled && orderType === "source_code" && (
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <Zap className="h-3 w-3" /> Instant
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coupon */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card">
            <div className="flex items-center gap-2 font-bold"><Tag className="h-4 w-4 text-primary" /> Coupon code</div>
            <p className="text-xs text-muted-foreground mt-1">Have a promo code? Apply it to save more.</p>
            <div className="mt-3 flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" disabled={!!coupon} className="font-mono uppercase" />
              {coupon ? (
                <Button variant="outline" onClick={() => { setCoupon(null); setCode(""); }}>Remove</Button>
              ) : (
                <Button onClick={applyCoupon} disabled={applying || !code.trim()}>
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              )}
            </div>
            {coupon && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-success text-sm">
                <CheckCircle2 className="h-4 w-4" /> <span className="font-bold">{coupon.code}</span> applied — saved ₹{coupon.discount}
              </div>
            )}
          </div>

          {/* Zexo Coins */}
          <div className="rounded-2xl bg-gradient-card p-5 ring-1 ring-border shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-bold"><Wallet className="h-4 w-4 text-primary" /> Pay with Zexo Coins</div>
                <p className="text-xs text-muted-foreground mt-1">1 ZexoCoin = ₹1. Use your balance to reduce payable amount.</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 ring-1 ring-amber-300/40">
                  <ZexoCoin size={18} /> <span className="text-sm font-bold tabular-nums">Balance: {balance.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <Switch checked={useCoins && balance > 0} disabled={balance === 0} onCheckedChange={setUseCoins} />
            </div>
            {useCoins && coinsToUse > 0 && (
              <div className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-sm text-primary">
                Will use <span className="font-bold">{coinsToUse.toLocaleString("en-IN")}</span> coins (≈ ₹{coinsToUse})
              </div>
            )}
            {balance === 0 && (
              <Link to="/wallet" className="mt-2 inline-block text-xs text-primary underline">Top up your wallet →</Link>
            )}
          </div>
        </motion.div>

        {/* RIGHT — sticky summary */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="lg:sticky lg:top-24 rounded-2xl bg-card p-5 ring-1 ring-border shadow-elegant">
            <div className="font-extrabold text-lg">Order Summary</div>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={`₹${subtotal.toLocaleString("en-IN")}`} />
              <Row label="Tax (GST 18%)" value={`₹${tax.toLocaleString("en-IN")}`} muted />
              <Row label="Total price" value={`₹${basePrice.toLocaleString("en-IN")}`} bold />
              {coupon && <Row label={`Coupon (${coupon.code})`} value={`− ₹${couponDiscount.toLocaleString("en-IN")}`} className="text-success" />}
              {coinsToUse > 0 && <Row label="Zexo Coins" value={`− ₹${coinsToUse.toLocaleString("en-IN")}`} className="text-amber-600 dark:text-amber-400" />}
              <Separator className="my-2" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">Payable now</span>
                <span className="text-2xl font-extrabold tabular-nums">₹{payable.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <Button
              size="lg" disabled={paying} onClick={placeOrder}
              className={cn(
                "mt-5 w-full h-14 rounded-2xl text-base font-bold shadow-elegant transition-all hover:scale-[1.01]",
                payable === 0 ? "bg-gold text-gold-foreground hover:bg-gold/90" : "bg-gradient-primary text-primary-foreground hover:shadow-glow",
              )}
            >
              {paying ? <Loader2 className="h-5 w-5 animate-spin" />
                : payable === 0
                  ? <>Pay {afterCoupon.toLocaleString("en-IN")} <ZexoCoin size={20} className="ml-1.5" /></>
                  : <>Pay ₹{payable.toLocaleString("en-IN")} via Razorpay</>}
            </Button>

            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> 256-bit secure checkout · Razorpay
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Row({ label, value, muted, bold, className }: { label: string; value: string; muted?: boolean; bold?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className={cn(muted && "text-muted-foreground text-xs", bold && "font-bold")}>{label}</span>
      <span className={cn("tabular-nums", bold ? "font-extrabold" : "font-semibold", muted && "text-muted-foreground")}>{value}</span>
    </div>
  );
}