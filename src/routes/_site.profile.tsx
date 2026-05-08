import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/server-fns/uploads.functions";
import { withAuthHeaders } from "@/lib/server-fn-auth";
import { toast } from "sonner";

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/_site/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refresh, profileCompletion, loading } = useAuth();
  const nav = useNavigate();
  const upload = useServerFn(uploadImage);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState({
    first_name: "", last_name: "", whatsapp_number: "", calling_number: "",
    optional_number: "", telegram_username: "", instagram_username: "",
    bio: "", found_from: "", avatar_url: "",
  });

  const handleAvatarUpload = async (file: File | undefined) => {
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be < 5MB");
    setUploading(true);
    try {
      const b64 = await fileToBase64(file);
      const { url } = await upload(await withAuthHeaders({ imageBase64: b64, filename: file.name }));
      setF((s) => ({ ...s, avatar_url: url }));
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      await refresh();
      toast.success("Profile image updated");
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);
  useEffect(() => {
    if (profile) {
      setF({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        whatsapp_number: profile.whatsapp_number ?? "",
        calling_number: profile.calling_number ?? "",
        optional_number: profile.optional_number ?? "",
        telegram_username: profile.telegram_username ?? "",
        instagram_username: profile.instagram_username ?? "",
        bio: profile.bio ?? "",
        found_from: profile.found_from ?? "",
        avatar_url: profile.avatar_url ?? "",
      });
    }
  }, [profile]);

  const validatePhone = (v: string) => !v || /^\+?\d{10,15}$/.test(v.replace(/\s/g, ""));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validatePhone(f.whatsapp_number) || !validatePhone(f.calling_number)) {
      toast.error("Phone number must be at least 10 digits"); return;
    }
    setBusy(true);
    const { error } = await supabase.from("profiles").update(f).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated"); await refresh(); }
    setBusy(false);
  };

  if (loading || !profile) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Complete your profile to start purchasing.</p>

        <div className="mt-6 rounded-2xl bg-gradient-card p-5 ring-1 ring-border shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Profile completion</span>
            <span className={`text-sm font-bold ${profileCompletion >= 80 ? "text-success" : "text-destructive"}`}>
              {profileCompletion}%
            </span>
          </div>
          <Progress value={profileCompletion} className="mt-2 h-2" />
          {profileCompletion < 80 && (
            <p className="mt-2 text-xs text-muted-foreground">Reach 80% to unlock purchases.</p>
          )}
        </div>

        <form onSubmit={save} className="mt-6 space-y-5 rounded-2xl bg-card p-6 ring-1 ring-border shadow-card">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-primary/30">
              {f.avatar_url ? (
                <img src={f.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-primary-foreground text-2xl font-bold">
                  {(f.first_name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Camera className="h-3.5 w-3.5" /></span>
            </div>
            <div className="flex-1">
              <Label htmlFor="avatar">Profile image URL</Label>
              <Input id="avatar" placeholder="https://…" value={f.avatar_url} onChange={(e) => setF({ ...f, avatar_url: e.target.value })} className="rounded-xl" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>First name</Label><Input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Last name</Label><Input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} className="rounded-xl" /></div>
          </div>

          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} readOnly disabled className="rounded-xl bg-muted" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>WhatsApp number (+91…)</Label><Input placeholder="+91…" value={f.whatsapp_number} onChange={(e) => setF({ ...f, whatsapp_number: e.target.value || "+91" })} className="rounded-xl" /></div>
            <div><Label>Calling number</Label><Input placeholder="+91…" value={f.calling_number} onChange={(e) => setF({ ...f, calling_number: e.target.value || "+91" })} className="rounded-xl" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Optional number</Label><Input value={f.optional_number} onChange={(e) => setF({ ...f, optional_number: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Telegram username</Label><Input placeholder="@you" value={f.telegram_username} onChange={(e) => setF({ ...f, telegram_username: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Instagram username</Label><Input placeholder="@you" value={f.instagram_username} onChange={(e) => setF({ ...f, instagram_username: e.target.value })} className="rounded-xl" /></div>
          </div>

          <div><Label>Bio</Label><Textarea rows={3} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} className="rounded-xl" /></div>
          <div><Label>Where did you find us?</Label><Input value={f.found_from} onChange={(e) => setF({ ...f, found_from: e.target.value })} className="rounded-xl" /></div>

          <div className="flex gap-3">
            <Button type="submit" disabled={busy} className="rounded-full bg-gradient-primary shadow-elegant">{busy ? "Saving…" : "Save changes"}</Button>
            <Link to="/orders"><Button type="button" variant="outline" className="rounded-full">My Orders</Button></Link>
          </div>
        </form>
      </motion.div>
    </section>
  );
}
