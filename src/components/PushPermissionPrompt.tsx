import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getVapidPublicKey } from "@/server-fns/push.functions";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushPermissionPrompt() {
  const { user, profile, refresh } = useAuth();
  const getKey = useServerFn(getVapidPublicKey);
  const [show, setShow] = useState(false);
  const [vapidVersion, setVapidVersion] = useState<number>(1);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    (async () => {
      const { data: ws } = await supabase.from("website_settings").select("vapid_key_version").eq("id", 1).maybeSingle();
      const currentVersion = Number((ws as any)?.vapid_key_version ?? 1);
      setVapidVersion(currentVersion);
      const browserPerm = Notification.permission;
      const choice = (profile as any)?.notification_choice;

      // If browser already granted, ensure we have a record + active subscription, then never re-prompt
      if (browserPerm === "granted") {
        if (choice !== "granted") {
          await supabase.from("profiles").update({
            notification_choice: "granted",
            notification_choice_at: new Date().toISOString(),
            push_prompt_vapid_version: currentVersion,
          }).eq("id", user.id);
          await refresh();
        }
        return;
      }
      if (browserPerm === "denied") return;
      // Only show if default AND user hasn't declined yet
      if (choice !== "declined") setShow(true);
    })();
  }, [user, profile]);

  const recordChoice = async (choice: "granted" | "declined") => {
    if (!user) return;
    await supabase.from("profiles").update({
      notification_choice: choice,
      notification_choice_at: new Date().toISOString(),
      push_prompt_vapid_version: vapidVersion,
    }).eq("id", user.id);
    await refresh();
  };

  const enable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { await recordChoice("declined"); setShow(false); return; }
      // Persist the granted choice IMMEDIATELY so we never re-prompt even if subscription fails
      await recordChoice("granted");
      try {
        const { publicKey } = await getKey({ data: undefined as never });
        if (!publicKey) throw new Error("Push key missing — contact admin");
        const appKey = urlBase64ToUint8Array(publicKey);
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const existingKey = subscription.options?.applicationServerKey;
          const sameKey = existingKey && new Uint8Array(existingKey as ArrayBuffer).every((b, i) => b === appKey[i]);
          if (!sameKey) { try { await subscription.unsubscribe(); } catch {} subscription = null; }
        }
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
        }
        const json = subscription.toJSON();
        const { error } = await supabase.from("push_subscriptions").upsert({
          user_id: user!.id,
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        }, { onConflict: "endpoint" });
        if (error) throw error;
        toast.success("Notifications enabled");
      } catch (subErr: any) {
        console.warn("Push subscribe failed (browser permission already granted):", subErr);
        toast.success("Notifications allowed");
      }
    } catch (error: any) {
      toast.error(error.message || "Notifications could not be enabled");
    } finally {
      setShow(false);
    }
  };

  const decline = async () => {
    await recordChoice("declined");
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-4 z-[80] mx-auto max-w-md rounded-2xl bg-card p-4 shadow-elegant ring-1 ring-border">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary"><Bell className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="font-bold">Enable order notifications?</div>
          <p className="mt-1 text-sm text-muted-foreground">Get wallet, order and delivery updates instantly.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={enable}>Allow</Button>
            <Button size="sm" variant="outline" onClick={decline}>Not now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
