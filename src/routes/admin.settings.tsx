import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Phone, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdmin });

type Contact = {
  id: string;
  type: string;
  label: string;
  value: string;
  url: string | null;
  is_active: boolean;
  sort_order: number;
};

function SettingsAdmin() {
  const [s, setS] = useState<any>(null);
  const [phones, setPhones] = useState<Contact[]>([]);

  const loadPhones = async () => {
    const { data } = await supabase.from("contacts").select("*").eq("type", "phone").order("sort_order");
    setPhones((data ?? []) as Contact[]);
  };

  useEffect(() => {
    supabase.from("website_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setS(data ?? { id: 1 }));
    loadPhones();
  }, []);

  const save = async () => {
    const { error } = await supabase.from("website_settings").update(s).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  };

  const addPhone = async () => {
    if (phones.length >= 5) return toast.error("Maximum 5 numbers");
    const { error } = await supabase.from("contacts").insert({
      type: "phone",
      label: "Support",
      value: "+91 ",
      url: "tel:+91",
      sort_order: phones.length,
      is_active: true,
    });
    if (error) return toast.error(error.message);
    loadPhones();
  };

  const updatePhone = async (id: string, patch: Partial<Contact>) => {
    setPhones((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const savePhone = async (p: Contact) => {
    const { error } = await supabase.from("contacts").update({
      label: p.label,
      value: p.value,
      url: p.value.startsWith("tel:") ? p.value : `tel:${p.value.replace(/\s+/g, "")}`,
      is_active: p.is_active,
    }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Number saved");
    loadPhones();
  };

  const deletePhone = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadPhones();
  };

  if (!s) return <div>Loading…</div>;

  return (
    <div className="max-w-2xl space-y-6">
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

      <div className="rounded-2xl bg-card ring-1 ring-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <h2 className="font-bold">Support Numbers</h2>
          </div>
          <Button size="sm" variant="outline" onClick={addPhone}>
            <Plus className="h-4 w-4 mr-1" /> Add number
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Up to 5 numbers. Shown on the contact page.</p>

        {phones.length === 0 && (
          <div className="text-sm text-muted-foreground py-6 text-center">No numbers added yet.</div>
        )}

        {phones.map((p) => (
          <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto_auto] gap-2 items-end rounded-lg ring-1 ring-border p-3">
            <div>
              <Label className="text-xs">Label</Label>
              <Input value={p.label} onChange={(e) => updatePhone(p.id, { label: e.target.value })} placeholder="Support" />
            </div>
            <div>
              <Label className="text-xs">Number</Label>
              <Input value={p.value} onChange={(e) => updatePhone(p.id, { value: e.target.value })} placeholder="+91 9876543210" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={p.is_active} onCheckedChange={(v) => updatePhone(p.id, { is_active: v })} />
            </div>
            <div className="flex gap-1">
              <Button size="sm" onClick={() => savePhone(p)}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => deletePhone(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
