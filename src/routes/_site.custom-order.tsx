import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/custom-order")({
  component: CustomOrder,
});

function CustomOrder() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", whatsapp_number: "", calling_number: "", project_details: "", extra_notes: "" });

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);
  useEffect(() => {
    if (profile) setF((s) => ({ ...s,
      name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
      email: profile.email,
      whatsapp_number: profile.whatsapp_number ?? "",
      calling_number: profile.calling_number ?? "",
    }));
  }, [profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!f.project_details.trim()) return toast.error("Project details required");
    const { error } = await supabase.from("custom_orders").insert({ user_id: user.id, ...f });
    if (error) return toast.error(error.message);
    toast.success("Request submitted! We'll contact you within 24 hours.");
    nav({ to: "/orders" });
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Get Customized</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tell us what you need — we'll send a quote and timeline.</p>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl bg-card ring-1 ring-border p-5">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
          <div><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
          <div><Label>WhatsApp</Label><Input value={f.whatsapp_number} onChange={(e) => setF({ ...f, whatsapp_number: e.target.value })} /></div>
          <div><Label>Calling number</Label><Input value={f.calling_number} onChange={(e) => setF({ ...f, calling_number: e.target.value })} /></div>
        </div>
        <div><Label>Project details *</Label><Textarea rows={6} value={f.project_details} onChange={(e) => setF({ ...f, project_details: e.target.value })} required placeholder="Describe what you want built — features, references, deadline…" /></div>
        <div><Label>Extra notes</Label><Textarea rows={2} value={f.extra_notes} onChange={(e) => setF({ ...f, extra_notes: e.target.value })} /></div>
        <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">Submit request</Button>
      </form>
    </section>
  );
}
