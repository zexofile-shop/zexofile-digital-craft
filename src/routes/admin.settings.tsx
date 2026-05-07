import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdmin });

function SettingsAdmin() {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    supabase.from("website_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setS(data ?? { id: 1 }));
  }, []);

  const save = async () => {
    const { error } = await supabase.from("website_settings").update(s).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  };

  if (!s) return <div>Loading…</div>;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-extrabold">Site Settings</h1>
      <div className="rounded-2xl bg-card ring-1 ring-border p-5 space-y-3">
        <div><Label>Site name</Label><Input value={s.site_name ?? ""} onChange={(e) => setS({ ...s, site_name: e.target.value })} /></div>
        <div><Label>Tagline</Label><Input value={s.tagline ?? ""} onChange={(e) => setS({ ...s, tagline: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea value={s.description ?? ""} onChange={(e) => setS({ ...s, description: e.target.value })} /></div>
        <div><Label>Support email</Label><Input value={s.support_email ?? ""} onChange={(e) => setS({ ...s, support_email: e.target.value })} /></div>
        <div><Label>Logo URL</Label><Input value={s.logo_url ?? ""} onChange={(e) => setS({ ...s, logo_url: e.target.value })} /></div>
        <div><Label>Default theme</Label>
          <select className="w-full h-9 rounded-md border bg-background px-2" value={s.default_theme} onChange={(e) => setS({ ...s, default_theme: e.target.value })}>
            <option value="dark">Dark</option><option value="light">Light</option>
          </select>
        </div>
        <label className="flex items-center justify-between rounded-lg p-2 ring-1 ring-border">
          <span>Maintenance mode (hides shop)</span>
          <Switch checked={!!s.maintenance_mode} onCheckedChange={(v) => setS({ ...s, maintenance_mode: v })} />
        </label>
        <Button onClick={save} className="w-full">Save settings</Button>
      </div>
    </div>
  );
}
