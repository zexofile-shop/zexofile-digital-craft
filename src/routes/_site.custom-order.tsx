import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/server-fns/uploads.functions";
import { withAuthHeaders } from "@/lib/server-fn-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/custom-order")({
  component: CustomOrder,
  validateSearch: (s: Record<string, unknown>) => ({
    orderId: typeof s.orderId === "string" ? s.orderId : undefined,
    productId: typeof s.productId === "string" ? s.productId : undefined,
  }),
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function CustomOrder() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const upload = useServerFn(uploadImage);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState({
    first_name: "", last_name: "", email: "",
    whatsapp_number: "", calling_number: "",
    address: "", purpose: "", project_details: "", extra_notes: "",
    instagram: "", telegram: "", twitter: "",
    sample_images: [] as string[],
  });

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);
  useEffect(() => {
    if (profile) setF((s) => ({ ...s,
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      email: profile.email,
      whatsapp_number: profile.whatsapp_number ?? "",
      calling_number: profile.calling_number ?? "",
      instagram: profile.instagram_username ?? "",
      telegram: profile.telegram_username ?? "",
    }));
  }, [profile]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 5)) {
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} > 5MB`); continue; }
        const b64 = await fileToBase64(file);
        const { url } = await upload(await withAuthHeaders({ imageBase64: b64, filename: file.name }));
        setF((s) => ({ ...s, sample_images: [...s.sample_images, url].slice(0, 5) }));
      }
      toast.success("Images uploaded");
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!f.project_details.trim()) return toast.error("Project details required");
    if (!f.purpose.trim()) return toast.error("Purpose required");
    setBusy(true);
    const payload = {
      user_id: user.id,
      name: `${f.first_name} ${f.last_name}`.trim(),
      email: f.email,
      whatsapp_number: f.whatsapp_number,
      calling_number: f.calling_number,
      address: f.address,
      purpose: f.purpose,
      project_details: f.project_details,
      extra_notes: f.extra_notes,
      social_accounts: { instagram: f.instagram, telegram: f.telegram, twitter: f.twitter },
      sample_images: f.sample_images,
    };
    const { error } = await supabase.from("custom_orders").insert(payload as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Request submitted! We'll contact you within 24 hours.");
    nav({ to: "/orders" });
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Get Customized</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tell us what you need — we'll send a quote and timeline within 24 hours.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-card ring-1 ring-border p-5 shadow-card">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>First name *</Label><Input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} required /></div>
          <div><Label>Last name</Label><Input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></div>
        </div>
        <div><Label>Email *</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>WhatsApp number *</Label><Input value={f.whatsapp_number} onChange={(e) => setF({ ...f, whatsapp_number: e.target.value })} placeholder="+91…" required /></div>
          <div><Label>Calling number</Label><Input value={f.calling_number} onChange={(e) => setF({ ...f, calling_number: e.target.value })} placeholder="+91…" /></div>
        </div>
        <div><Label>Address *</Label><Textarea rows={2} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} required placeholder="City, State, Country" /></div>
        <div><Label>Purpose for customizing this project *</Label><Textarea rows={2} value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} required placeholder="Why do you need customization?" /></div>
        <div><Label>Project details *</Label><Textarea rows={5} value={f.project_details} onChange={(e) => setF({ ...f, project_details: e.target.value })} required placeholder="Features, references, deadline…" /></div>

        <div>
          <Label>Social accounts (optional)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
            <Input placeholder="Instagram @" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} />
            <Input placeholder="Telegram @" value={f.telegram} onChange={(e) => setF({ ...f, telegram: e.target.value })} />
            <Input placeholder="Twitter / X @" value={f.twitter} onChange={(e) => setF({ ...f, twitter: e.target.value })} />
          </div>
        </div>

        <div>
          <Label>Sample images (up to 5)</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {f.sample_images.map((url, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg ring-1 ring-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setF((s) => ({ ...s, sample_images: s.sample_images.filter((_, j) => j !== i) }))}
                  className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"><X className="h-3 w-3" /></button>
              </div>
            ))}
            {f.sample_images.length < 5 && (
              <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-smooth">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              </label>
            )}
          </div>
        </div>

        <div><Label>Extra notes</Label><Textarea rows={2} value={f.extra_notes} onChange={(e) => setF({ ...f, extra_notes: e.target.value })} /></div>
        <Button type="submit" disabled={busy || uploading} className="w-full bg-gradient-primary text-primary-foreground">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit request"}
        </Button>
      </form>
    </section>
  );
}
