import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/custom-orders")({ component: CustomOrdersAdmin });

const STATUSES = ["submitted", "reviewed", "in_progress", "completed", "delivered"] as const;

function CustomOrdersAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const refresh = () => supabase.from("custom_orders").select("*, products(name)").order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Custom Orders</h1>
      <div className="grid gap-3">
        {items.map((o) => (
          <div key={o.id} className="rounded-2xl bg-card ring-1 ring-border p-4">
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div>
                <div className="font-bold">{o.name} <span className="text-xs text-muted-foreground">· {o.email}</span></div>
                <div className="text-xs text-muted-foreground">📞 {o.calling_number} · WA: {o.whatsapp_number}</div>
                <div className="text-xs text-muted-foreground">Product: {o.products?.name ?? "—"}</div>
              </div>
              <select value={o.status} onChange={async (e) => {
                await supabase.from("custom_orders").update({ status: e.target.value as typeof STATUSES[number] }).eq("id", o.id);
                toast.success("Status updated"); refresh();
              }} className="h-9 rounded-md border bg-background px-2 text-sm">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap"><strong>Project:</strong> {o.project_details}</p>
            {o.purpose && <p className="mt-2 text-sm whitespace-pre-wrap"><strong>Purpose:</strong> {o.purpose}</p>}
            {o.address && <p className="mt-1 text-xs text-muted-foreground"><strong>Address:</strong> {o.address}</p>}
            {o.social_accounts && Object.values(o.social_accounts).some(Boolean) && (
              <p className="mt-1 text-xs text-muted-foreground"><strong>Social:</strong> {Object.entries(o.social_accounts).filter(([_,v]) => v).map(([k,v]) => `${k}: ${v}`).join(" · ")}</p>
            )}
            {Array.isArray(o.sample_images) && o.sample_images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {o.sample_images.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded ring-1 ring-border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
            {o.extra_notes && <p className="mt-2 text-xs text-muted-foreground">Notes: {o.extra_notes}</p>}
          </div>
        ))}
        {!items.length && <div className="p-10 text-center text-muted-foreground">No custom orders yet.</div>}
      </div>
    </div>
  );
}
