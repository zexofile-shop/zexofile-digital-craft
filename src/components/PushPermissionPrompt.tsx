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
  const { user } = useAuth();
  const getKey = useServerFn(getVapidPublicKey);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setShow(Notification.permission === "default" && !localStorage.getItem("zexo_push_prompt_done"));
  }, [user]);

  const enable = async () => {
    try {
      localStorage.setItem("zexo_push_prompt_done", "1");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setShow(false); return; }
      const { publicKey } = await getKey({ data: undefined as never });
      if (!publicKey) throw new Error("Push key missing");
      const appKey = urlBase64ToUint8Array(publicKey);
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      // If an old subscription exists with a different key, drop it first
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
    } catch (error: any) {
      toast.error(error.message || "Notifications could not be enabled");
    } finally {
      setShow(false);
    }
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
            <Button size="sm" variant="outline" onClick={() => { localStorage.setItem("zexo_push_prompt_done", "1"); setShow(false); }}>Not now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
