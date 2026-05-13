import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, Trash2, Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/reviews")({ component: ReviewsAdmin });

function ReviewsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const refresh = () => supabase.from("reviews").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Reviews</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((r) => (
          <div key={r.id} className="rounded-2xl bg-card ring-1 ring-border p-4 shadow-card">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold">{r.user_name || r.user_email}</div>
                <div className="flex gap-0.5 text-amber-500">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</div>
              </div>
              <span className={`text-xs rounded-full px-2 py-0.5 ${r.is_approved ? "bg-success/15 text-success" : "bg-muted"}`}>{r.is_approved ? "Approved" : "Pending"}</span>
            </div>
            <p className="mt-2 text-sm">{r.review_text}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={async () => {
                await supabase.from("reviews").update({ is_approved: !r.is_approved }).eq("id", r.id);
                toast.success("Updated"); refresh();
              }}>{r.is_approved ? <><X className="h-3.5 w-3.5 mr-1" />Unapprove</> : <><Check className="h-3.5 w-3.5 mr-1" />Approve</>}</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                if (confirm("Delete?")) { await supabase.from("reviews").delete().eq("id", r.id); refresh(); }
              }}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {!items.length && <div className="col-span-full p-10 text-center text-muted-foreground">No reviews yet</div>}
      </div>
    </div>
  );
}
