import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, BellRing } from "lucide-react";
import { sendPushNotification } from "@/server-fns/push.functions";
import { adminForceRePromptNotifications } from "@/server-fns/admin.functions";
import { withAuthHeaders } from "@/lib/server-fn-auth";

export const Route = createFileRoute("/admin/notifications")({ component: NotifAdmin });

function NotifAdmin() {
  const sendPush = useServerFn(sendPushNotification);
  const [list, setList] = useState<any[]>([]);
  const [f, setF] = useState({ title: "", message: "", image_url: "", target: "all" });
  const refresh = () => supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => setList(data ?? []));
  useEffect(() => { refresh(); }, []);

  const send = async () => {
    if (!f.title || !f.message) return toast.error("Title and message required");
    const res = await sendPush(await withAuthHeaders(f));
    toast.success(`Notification sent${res.sent ? ` to ${res.sent} device(s)` : ""}`);
    setF({ title: "", message: "", image_url: "", target: "all" }); refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl ring-1 ring-border bg-card p-5 space-y-3">
        <h2 className="text-xl font-bold">Send notification</h2>
        <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><Label>Message</Label><Textarea rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
        <div><Label>Image URL (optional)</Label><Input value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} /></div>
        <Button onClick={send} className="w-full"><Send className="h-4 w-4 mr-2" />Broadcast to all users</Button>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-3">Recent</h2>
        <div className="space-y-2">
          {list.map((n) => (
            <div key={n.id} className="rounded-xl bg-card ring-1 ring-border p-3">
              <div className="font-semibold text-sm">{n.title}</div>
              <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              <p className="text-sm mt-1">{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
