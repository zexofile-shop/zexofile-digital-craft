import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/legal")({ component: LegalAdmin });

function LegalAdmin() {
  const [pages, setPages] = useState<any[]>([]);
  const refresh = () => supabase.from("legal_pages").select("*").order("slug").then(({ data }) => setPages(data ?? []));
  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Legal Pages</h1>
      {pages.map((p, i) => (
        <div key={p.slug} className="rounded-2xl bg-card ring-1 ring-border p-4 space-y-2">
          <div className="flex gap-2">
            <Input value={p.title} onChange={(e) => setPages((arr) => arr.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
            <Input value={p.slug} disabled className="w-40" />
          </div>
          <Textarea rows={10} value={p.content} onChange={(e) => setPages((arr) => arr.map((x, j) => j === i ? { ...x, content: e.target.value } : x))} />
          <Button size="sm" onClick={async () => {
            const { error } = await supabase.from("legal_pages").update({ title: p.title, content: p.content }).eq("slug", p.slug);
            if (error) return toast.error(error.message);
            toast.success("Saved");
          }}>Save {p.title}</Button>
        </div>
      ))}
    </div>
  );
}
