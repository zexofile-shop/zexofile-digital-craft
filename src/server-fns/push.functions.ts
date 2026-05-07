import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as webpush from "web-push";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getSecret } from "./app-secrets.server";

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => ({
  publicKey: (await getSecret("VAPID_PUBLIC_KEY")) ?? process.env.VAPID_PUBLIC_KEY ?? null,
}));

const SUPER_ADMIN_EMAILS = new Set(["niteshprakash555@gmail.com", "zexofile@gmail.com"]);

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (data) return;

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = authUser?.user?.email?.toLowerCase();
  if (email && SUPER_ADMIN_EMAILS.has(email)) return;

  throw new Error("Forbidden: admin only");
}

export const sendPushNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string().min(1).max(120),
    message: z.string().min(1).max(500),
    image_url: z.string().url().optional().or(z.literal("")),
    target: z.string().default("all"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: notification, error } = await supabaseAdmin.from("notifications").insert({
      title: data.title,
      message: data.message,
      image_url: data.image_url || null,
      target: data.target,
    }).select().single();
    if (error) throw error;

    const publicKey = (await getSecret("VAPID_PUBLIC_KEY")) ?? process.env.VAPID_PUBLIC_KEY;
    const privateKey = (await getSecret("VAPID_PRIVATE_KEY")) ?? process.env.VAPID_PRIVATE_KEY;
    const subject = (await getSecret("VAPID_SUBJECT")) ?? process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject) return { ok: true, sent: 0 };

    webpush.setVapidDetails(subject, publicKey, privateKey);
    const { data: subs } = await supabaseAdmin.from("push_subscriptions").select("id,endpoint,p256dh,auth").limit(1000);
    const payload = JSON.stringify({ ...notification, url: "/notifications" });
    let sent = 0;
    await Promise.all((subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent += 1;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
      }
    }));
    return { ok: true, sent };
  });
