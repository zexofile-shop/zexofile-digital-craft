import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SUPER_ADMIN_EMAILS = new Set(["niteshprakash555@gmail.com", "zexofile@gmail.com"]);
const DEFAULT_LEGAL_PAGES = [
  { slug: "terms", title: "Terms and Conditions", content: "Welcome to Zexofile Shop. By using our service, you agree to these terms." },
  { slug: "privacy", title: "Privacy Policy", content: "We respect your privacy. This policy explains how we collect and use your data." },
  { slug: "refund", title: "Refund Policy", content: "Digital products are non-refundable once delivered, except in specific cases." },
];
const DEFAULT_SECRET_ROWS = [
  { key: "RAZORPAY_KEY_ID", description: "Razorpay public Key ID" },
  { key: "RAZORPAY_KEY_SECRET", description: "Razorpay secret key" },
  { key: "IMGBB_API_KEY", description: "ImgBB image upload API key" },
  { key: "VAPID_PUBLIC_KEY", description: "Web Push VAPID public key" },
  { key: "VAPID_PRIVATE_KEY", description: "Web Push VAPID private key" },
  { key: "VAPID_SUBJECT", description: "Web Push subject (mailto:...)" },
];

const ProductInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(140),
  slug: z.string().min(1).max(180),
  category: z.string().max(80).nullable().optional(),
  short_description: z.string().max(500).nullable().optional(),
  full_description: z.string().max(12000).nullable().optional(),
  regular_price: z.number().min(0).max(10000000),
  discount_price: z.number().min(0).max(10000000).nullable().optional(),
  source_code_price: z.number().min(0).max(10000000).nullable().optional(),
  customization_price: z.number().min(0).max(10000000).nullable().optional(),
  banner_image: z.string().max(2000).nullable().optional(),
  youtube_url: z.string().max(2000).nullable().optional(),
  instant_delivery_url: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(60)).default([]),
  gallery_images: z.array(z.string().max(2000)).default([]),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_best_selling: z.boolean().default(false),
  instant_delivery_enabled: z.boolean().default(true),
  customizable_enabled: z.boolean().default(false),
  dual_button_mode: z.boolean().default(false),
  primary_button_label: z.string().max(80).nullable().optional(),
  secondary_button_label: z.string().max(80).nullable().optional(),
});

function normalizeEmail(email?: string | null) {
  return String(email ?? "").trim().toLowerCase();
}

function isSuperAdminEmail(email?: string | null) {
  return SUPER_ADMIN_EMAILS.has(normalizeEmail(email));
}

function splitFullName(fullName?: string | null) {
  const cleaned = String(fullName ?? "").trim();
  if (!cleaned) return { first_name: null, last_name: null };
  const [first, ...rest] = cleaned.split(/\s+/);
  return {
    first_name: first || null,
    last_name: rest.length ? rest.join(" ") : null,
  };
}

function emptyToNull(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function mapAuthUserToProfile(user: any) {
  const meta = user.user_metadata ?? user.raw_user_meta_data ?? {};
  const split = splitFullName(meta.full_name);
  return {
    id: user.id,
    email: user.email ?? "",
    first_name: meta.first_name ?? split.first_name,
    last_name: meta.last_name ?? split.last_name,
    avatar_url: meta.avatar_url ?? meta.picture ?? null,
  };
}

async function listAllAuthUsers() {
  const users: any[] = [];
  const perPage = 200;
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
  }
  return users;
}

async function ensureAdminBootstrap() {
  const authUsers = await listAllAuthUsers();

  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id"),
    supabaseAdmin.from("user_roles").select("user_id,role"),
  ]);
  if (profilesError) throw profilesError;
  if (rolesError) throw rolesError;

  const profileIds = new Set((profiles ?? []).map((row) => row.id));
  const roleKeys = new Set((roles ?? []).map((row) => `${row.user_id}:${row.role}`));

  const missingProfiles = authUsers
    .filter((user) => !profileIds.has(user.id))
    .map(mapAuthUserToProfile);

  if (missingProfiles.length) {
    const { error } = await supabaseAdmin.from("profiles").upsert(missingProfiles, { onConflict: "id" });
    if (error) throw error;
  }

  const missingRoles = authUsers.flatMap((user) => {
    const role: "admin" | "user" = isSuperAdminEmail(user.email) ? "admin" : "user";
    const key = `${user.id}:${role}`;
    if (roleKeys.has(key)) return [];
    return [{ user_id: user.id, role, permissions: role === "admin" ? { all: true } : {} }];
  });

  if (missingRoles.length) {
    const { error } = await supabaseAdmin.from("user_roles").upsert(missingRoles, { onConflict: "user_id,role" });
    if (error) throw error;
  }

  const superAdminRoles = authUsers
    .filter((user) => isSuperAdminEmail(user.email))
    .map((user) => ({ user_id: user.id, role: "admin" as const, permissions: { all: true } }));
  if (superAdminRoles.length) {
    const { error } = await supabaseAdmin.from("user_roles").upsert(superAdminRoles, { onConflict: "user_id,role" });
    if (error) throw error;
  }

  const { error: settingsError } = await supabaseAdmin.from("website_settings").upsert({ id: 1 }, { onConflict: "id" });
  if (settingsError) throw settingsError;

  const { error: legalError } = await supabaseAdmin.from("legal_pages").upsert(DEFAULT_LEGAL_PAGES, { onConflict: "slug" });
  if (legalError) throw legalError;

  const { error: secretsError } = await supabaseAdmin.from("app_secrets").upsert(DEFAULT_SECRET_ROWS, { onConflict: "key" });
  if (secretsError) throw secretsError;

  return { authUsers };
}

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role,permissions").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (data) return data;

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = authUser?.user?.email?.toLowerCase();
  if (email && SUPER_ADMIN_EMAILS.has(email)) {
    return { role: "admin", permissions: { all: true } };
  }

  throw new Error("Forbidden: admin only");
}

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().max(120).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { authUsers } = await ensureAdminBootstrap();

    const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*"),
      supabaseAdmin.from("user_roles").select("user_id,role,permissions"),
    ]);
    if (profilesError) throw profilesError;
    if (rolesError) throw rolesError;

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const rolesMap = new Map<string, Array<{ user_id: string; role: string; permissions: Record<string, boolean> }>>();
    for (const role of roles ?? []) {
      const arr = rolesMap.get(role.user_id) ?? [];
      arr.push({
        user_id: role.user_id,
        role: role.role,
        permissions: (role.permissions ?? {}) as Record<string, boolean>,
      });
      rolesMap.set(role.user_id, arr);
    }

    const query = normalizeEmail(data.q);
    const users = authUsers
      .map((user) => {
        const profile = profileMap.get(user.id);
        const fallback = mapAuthUserToProfile(user);
        const firstName = profile?.first_name ?? fallback.first_name;
        const lastName = profile?.last_name ?? fallback.last_name;
        const email = profile?.email ?? user.email ?? "";
        return {
          id: user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          avatar_url: profile?.avatar_url ?? fallback.avatar_url,
          wallet_balance: Number(profile?.wallet_balance ?? 0),
          total_spent: Number(profile?.total_spent ?? 0),
          total_orders: Number(profile?.total_orders ?? 0),
          signup_at: profile?.signup_at ?? user.created_at,
          roles: rolesMap.get(user.id) ?? [],
        };
      })
      .filter((user) => {
        if (!query) return true;
        const haystack = `${normalizeEmail(user.email)} ${normalizeEmail(user.first_name)} ${normalizeEmail(user.last_name)}`;
        return haystack.includes(query);
      })
      .sort((a, b) => String(b.signup_at ?? "").localeCompare(String(a.signup_at ?? "")));

    return { users };
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      userId: z.string().uuid(),
      makeAdmin: z.boolean(),
      permissions: z.record(z.string(), z.boolean()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await ensureAdminBootstrap();
    if (data.makeAdmin) {
      const { data: existing } = await supabaseAdmin
        .from("user_roles").select("id").eq("user_id", data.userId).eq("role", "admin").maybeSingle();
      if (existing) {
        await supabaseAdmin.from("user_roles").update({ permissions: data.permissions ?? {} }).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("user_roles").insert({
          user_id: data.userId, role: "admin", permissions: data.permissions ?? {},
        });
      }
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    }
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: context.userId, action: data.makeAdmin ? "grant_admin" : "revoke_admin",
      target_table: "user_roles", target_id: data.userId, meta: data.permissions ?? {},
    });
    return { ok: true };
  });

export const adminCreditWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      userId: z.string().uuid(),
      amount: z.number().int().min(-1000000).max(1000000),
      note: z.string().max(255).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await ensureAdminBootstrap();
    const { data: prof } = await supabaseAdmin.from("profiles").select("wallet_balance").eq("id", data.userId).single();
    const newBal = Math.max(0, Number(prof?.wallet_balance ?? 0) + data.amount);
    await supabaseAdmin.from("profiles").update({ wallet_balance: newBal }).eq("id", data.userId);
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: data.userId, amount: Math.abs(data.amount), balance_after: newBal,
      type: data.amount >= 0 ? "credit_admin" : "debit_admin",
      note: data.note ?? (data.amount >= 0 ? "Admin credit" : "Admin debit"),
    });
    return { ok: true, balance: newBal };
  });

export const adminListProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    await ensureAdminBootstrap();
    const { data, error } = await supabaseAdmin.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return { items: data ?? [] };
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ProductInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await ensureAdminBootstrap();

    const payload = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      category: emptyToNull(data.category),
      short_description: emptyToNull(data.short_description),
      full_description: emptyToNull(data.full_description),
      regular_price: Number(data.regular_price) || 0,
      discount_price: data.discount_price ?? null,
      source_code_price: data.source_code_price ?? null,
      customization_price: data.customization_price ?? null,
      banner_image: emptyToNull(data.banner_image),
      youtube_url: emptyToNull(data.youtube_url),
      instant_delivery_url: emptyToNull(data.instant_delivery_url),
      tags: data.tags ?? [],
      gallery_images: data.gallery_images ?? [],
      is_active: data.is_active,
      is_featured: data.is_featured,
      is_best_selling: data.is_best_selling,
      instant_delivery_enabled: data.instant_delivery_enabled,
      customizable_enabled: data.customizable_enabled,
      dual_button_mode: data.dual_button_mode,
      primary_button_label: emptyToNull(data.primary_button_label) ?? "Buy Source Code",
      secondary_button_label: emptyToNull(data.secondary_button_label) ?? "Get Customized",
    };

    const query = data.id
      ? supabaseAdmin.from("products").update(payload).eq("id", data.id)
      : supabaseAdmin.from("products").insert(payload);

    const { error } = await query;
    if (error) throw error;

    await supabaseAdmin.from("admin_logs").insert({
      admin_id: context.userId,
      action: data.id ? "update_product" : "create_product",
      target_table: "products",
      target_id: data.id ?? payload.slug,
      meta: { slug: payload.slug },
    });
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await ensureAdminBootstrap();
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw error;
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: context.userId,
      action: "delete_product",
      target_table: "products",
      target_id: data.id,
      meta: {},
    });
    return { ok: true };
  });

function bucketByDay(rows: Array<{ created_at: string; value?: number }>, days: number) {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const key = String(r.created_at).slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + (r.value ?? 1));
  }
  return Array.from(map.entries()).map(([date, value]) => ({ date, value }));
}

export const adminDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { authUsers } = await ensureAdminBootstrap();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [
      { count: ordersCount },
      { count: productsCount },
      { data: paidOrders },
      { count: notificationsCount },
      { data: walletTx },
      { data: subs },
      { data: profilesAll },
      { data: orders30 },
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("amount,wallet_used,status,created_at,order_type").in("status", ["paid", "delivered"]),
      supabaseAdmin.from("notifications").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("wallet_transactions").select("amount,type,created_at").eq("type", "credit_topup"),
      supabaseAdmin.from("push_subscriptions").select("user_id"),
      supabaseAdmin.from("profiles").select("id,notification_choice,signup_at"),
      supabaseAdmin.from("orders").select("amount,wallet_used,created_at,status").in("status", ["paid", "delivered"]).gte("created_at", since),
    ]);

    const paidRows = paidOrders ?? [];
    const totalRevenueInr = paidRows.reduce((sum, r: any) => sum + Number(r.amount || 0), 0);
    const coinsValue = paidRows.reduce((sum, r: any) => sum + Number(r.wallet_used || 0), 0);
    const razorpayDirect = paidRows.reduce((sum, r: any) => sum + Math.max(0, Number(r.amount || 0) - Number(r.wallet_used || 0)), 0);
    const walletTopups = (walletTx ?? []).reduce((sum, r: any) => sum + Number(r.amount || 0), 0);
    const totalRevenue = razorpayDirect + walletTopups; // real INR coming in (purchases minus coins + topups)

    const active24h = paidRows.filter((row: any) => {
      const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0;
      return createdAt >= Date.now() - 24 * 60 * 60 * 1000;
    }).length;

    const subscribedUserIds = new Set((subs ?? []).map((s: any) => s.user_id).filter(Boolean));
    const notifAllowed = subscribedUserIds.size;
    const notifDenied = (profilesAll ?? []).filter((p: any) => p.notification_choice === "declined").length;
    const notifPending = Math.max(0, authUsers.length - notifAllowed - notifDenied);

    const usersSeries = bucketByDay(
      (profilesAll ?? []).filter((p: any) => p.signup_at).map((p: any) => ({ created_at: p.signup_at })),
      30,
    );
    const salesSeries = bucketByDay((orders30 ?? []).map((r: any) => ({ created_at: r.created_at })), 30);
    const revenueSeries = bucketByDay(
      (orders30 ?? []).map((r: any) => ({
        created_at: r.created_at,
        value: Math.max(0, Number(r.amount || 0) - Number(r.wallet_used || 0)),
      })),
      30,
    );

    return {
      users: authUsers.length,
      orders: ordersCount ?? 0,
      products: productsCount ?? 0,
      notifications: notificationsCount ?? 0,
      active24h,
      revenue: totalRevenue,
      distribution: {
        razorpayDirect,
        coinsValue,
        walletTopups,
        grossOrderRevenue: totalRevenueInr,
      },
      notifStats: { allowed: notifAllowed, denied: notifDenied, pending: notifPending },
      series: { users: usersSeries, sales: salesSeries, revenue: revenueSeries },
    };
  });

export const adminUserDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const [{ data: profile }, { data: orders }, { data: wallet }, { data: roles }, { data: authUser }, { data: pushSub }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", data.userId).maybeSingle(),
      supabaseAdmin.from("orders").select("*, products(name, slug)").eq("user_id", data.userId).order("created_at", { ascending: false }),
      supabaseAdmin.from("wallet_transactions").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("user_roles").select("role,permissions").eq("user_id", data.userId),
      supabaseAdmin.auth.admin.getUserById(data.userId),
      supabaseAdmin.from("push_subscriptions").select("id,endpoint,created_at").eq("user_id", data.userId),
    ]);
    return {
      profile,
      orders: orders ?? [],
      wallet: wallet ?? [],
      roles: roles ?? [],
      authUser: authUser?.user ?? null,
      pushSubscriptions: pushSub ?? [],
    };
  });

export const adminForceRePromptNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userIds: z.array(z.string().uuid()).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: ws } = await supabaseAdmin.from("website_settings").select("vapid_key_version").eq("id", 1).maybeSingle();
    const next = Number((ws as any)?.vapid_key_version ?? 1) + 1;
    await supabaseAdmin.from("website_settings").update({ vapid_key_version: next }).eq("id", 1);
    if (data.userIds && data.userIds.length) {
      await supabaseAdmin.from("profiles").update({ push_prompt_vapid_version: 0, notification_choice: null }).in("id", data.userIds);
      await supabaseAdmin.from("push_subscriptions").delete().in("user_id", data.userIds);
    } else {
      await supabaseAdmin.from("profiles").update({ push_prompt_vapid_version: 0, notification_choice: null }).neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("push_subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    return { ok: true, version: next };
  });
