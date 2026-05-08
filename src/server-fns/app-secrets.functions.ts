import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { clearSecretCache } from "./app-secrets.server";

const SUPER_ADMIN_EMAILS = new Set(["niteshprakash555@gmail.com", "zexofile@gmail.com"]);
async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (data) return;
  const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = u?.user?.email?.toLowerCase();
  if (email && SUPER_ADMIN_EMAILS.has(email)) return;
  throw new Error("Forbidden: admin only");
}

export const listAppSecrets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin.from("app_secrets").select("key, value, description, updated_at").order("key");
    if (error) throw error;
    // mask secret-y values for display
    return (data ?? []).map((r) => ({
      key: r.key,
      description: r.description,
      updated_at: r.updated_at,
      value: r.value ?? "",
      hasValue: Boolean((r.value ?? "").trim()),
    }));
  });

export const updateAppSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ key: z.string().min(2).max(64), value: z.string().max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("app_secrets").upsert({
      key: data.key,
      value: data.value.trim(),
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) throw error;
    clearSecretCache();
    // If VAPID key changed, bump the version so users are re-prompted to re-subscribe
    if (data.key === "VAPID_PUBLIC_KEY" || data.key === "VAPID_PRIVATE_KEY") {
      const { data: ws } = await supabaseAdmin.from("website_settings").select("vapid_key_version").eq("id", 1).maybeSingle();
      const next = Number(ws?.vapid_key_version ?? 1) + 1;
      await supabaseAdmin.from("website_settings").upsert({ id: 1, vapid_key_version: next }, { onConflict: "id" });
      // Clear all push subscriptions since they're tied to old VAPID key
      await supabaseAdmin.from("push_subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    return { ok: true };
  });

/** Public: get just the keys safe for the browser (Razorpay key id, VAPID public). */
export const getPublicConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("app_secrets").select("key, value")
    .in("key", ["RAZORPAY_KEY_ID", "VAPID_PUBLIC_KEY"]);
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, (r.value ?? "").trim()]));
  return {
    razorpayKeyId: map.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
    vapidPublicKey: map.VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || null,
  };
});
