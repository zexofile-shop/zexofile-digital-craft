import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({ component: CouponsAdmin });

function CouponsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const refresh = () => supabase.from("coupons").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Coupons</h1>
        <CouponDialog onSaved={refresh} trigger={<Button><Plus className="h-4 w-4 mr-1" />New coupon</Button>} />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-2xl bg-card ring-1 ring-border p-4 shadow-card">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-lg font-bold text-primary">{c.code}</div>
                <div className="text-xs text-muted-foreground">{c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}</div>
                {c.user_email && <div className="text-xs">Only for: {c.user_email}</div>}
                <div className="text-xs">Active: {String(c.is_active)} · Min ₹{c.min_order_amount}</div>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={async () => {
                if (confirm("Delete?")) { await supabase.from("coupons").delete().eq("id", c.id); refresh(); }
              }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {!items.length && <div className="col-span-full p-10 text-center text-muted-foreground">No coupons yet</div>}
      </div>
    </div>
  );
}

function CouponDialog({ trigger, onSaved }: { trigger: React.ReactNode; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ code: "", discount_type: "percentage", discount_value: 10, min_order_amount: 0, max_discount: null, total_usage_limit: null, per_user_limit: 1, user_email: "", is_active: true });
  const save = async () => {
    const { error } = await supabase.from("coupons").insert({ ...f, code: f.code.toUpperCase(), user_email: f.user_email || null });
    if (error) return toast.error(error.message);
    toast.success("Created"); setOpen(false); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New coupon</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Code</Label><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label>
              <select className="w-full h-9 rounded-md border bg-background px-2" value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value })}>
                <option value="percentage">Percentage</option><option value="fixed">Fixed ₹</option>
              </select>
            </div>
            <div><Label>Value</Label><Input type="number" value={f.discount_value} onChange={(e) => setF({ ...f, discount_value: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Min order ₹</Label><Input type="number" value={f.min_order_amount} onChange={(e) => setF({ ...f, min_order_amount: Number(e.target.value) })} /></div>
            <div><Label>Max discount ₹</Label><Input type="number" value={f.max_discount ?? ""} onChange={(e) => setF({ ...f, max_discount: e.target.value === "" ? null : Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Total usage limit</Label><Input type="number" value={f.total_usage_limit ?? ""} onChange={(e) => setF({ ...f, total_usage_limit: e.target.value === "" ? null : Number(e.target.value) })} /></div>
            <div><Label>Per-user limit</Label><Input type="number" value={f.per_user_limit ?? 1} onChange={(e) => setF({ ...f, per_user_limit: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Restrict to user email (optional)</Label><Input value={f.user_email} onChange={(e) => setF({ ...f, user_email: e.target.value })} /></div>
          <label className="flex items-center justify-between rounded-lg p-2 ring-1 ring-border"><span>Active</span><Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} /></label>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Create</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
