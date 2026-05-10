import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, ShieldCheck, Plus, Minus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { adminListUsers, adminSetUserRole, adminCreditWallet, adminUserDetails } from "@/server-fns/admin.functions";
import { ZexoBalance } from "@/components/ZexoCoin";
import { withAuthHeaders } from "@/lib/server-fn-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: UsersAdmin,
});

const PERMS = [
  { key: "all", label: "Full access (Super Admin)" },
  { key: "products", label: "Manage Products" },
  { key: "orders", label: "Manage Orders" },
  { key: "custom_orders", label: "Manage Custom Orders" },
  { key: "users", label: "Manage Users & Admins" },
  { key: "coupons", label: "Manage Coupons" },
  { key: "reviews", label: "Moderate Reviews" },
  { key: "wallet", label: "Adjust Wallets" },
  { key: "notifications", label: "Send Notifications" },
  { key: "legal", label: "Edit Legal Pages" },
  { key: "settings", label: "Edit Site Settings" },
];

function UsersAdmin() {
  const list = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetUserRole);
  const credit = useServerFn(adminCreditWallet);
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const refresh = () =>
    withAuthHeaders({ q }).then((opts) => list(opts))
      .then((r) => setUsers(Array.isArray(r?.users) ? r.users : []))
      .catch((error) => {
        console.error(error);
        setUsers([]);
        toast.error(error instanceof Error ? error.message : "Unable to load users");
      });
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-extrabold">Users & Admins</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-64" placeholder="Search by email…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && refresh()} />
          </div>
          <Button onClick={refresh}>Search</Button>
        </div>
      </div>

      <div className="rounded-2xl ring-1 ring-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3">User</th><th className="p-3">Wallet</th><th className="p-3">Spent</th><th className="p-3">Role</th><th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeUsers.map((u) => {
              const adminRow = Array.isArray(u.roles) ? u.roles.find((r: any) => r.role === "admin") : undefined;
              return (
                <tr key={u.id} className="border-t">
                  <td className="p-3">
                    <div className="font-semibold">{u.first_name} {u.last_name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="p-3"><ZexoBalance amount={Number(u.wallet_balance)} size={14} /></td>
                  <td className="p-3">₹{Number(u.total_spent || 0).toLocaleString("en-IN")}</td>
                  <td className="p-3">
                    {adminRow ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </span>
                    ) : <span className="text-xs text-muted-foreground">User</span>}
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <WalletDialog user={u} onSave={async (amt, note) => {
                      await credit(await withAuthHeaders({ userId: u.id, amount: amt, note }));
                      toast.success("Wallet updated"); refresh();
                    }} />
                    <RoleDialog user={u} adminRow={adminRow} onSave={async (makeAdmin, perms) => {
                      await setRole(await withAuthHeaders({ userId: u.id, makeAdmin, permissions: perms }));
                      toast.success("Role updated"); refresh();
                    }} />
                  </td>
                </tr>
              );
            })}
            {!safeUsers.length && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleDialog({ user, adminRow, onSave }: { user: any; adminRow: any; onSave: (makeAdmin: boolean, p: Record<string, boolean>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState<Record<string, boolean>>(adminRow?.permissions ?? {});
  const [makeAdmin, setMakeAdmin] = useState(!!adminRow);
  useEffect(() => { setPerms(adminRow?.permissions ?? {}); setMakeAdmin(!!adminRow); }, [adminRow, open]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><ShieldCheck className="h-3.5 w-3.5 mr-1" />Role</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Manage role — {user.email}</DialogTitle></DialogHeader>
        <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
          <Label htmlFor="ma">Grant Admin access</Label>
          <Switch id="ma" checked={makeAdmin} onCheckedChange={setMakeAdmin} />
        </div>
        {makeAdmin && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase text-muted-foreground">Permissions</div>
            {PERMS.map((p) => (
              <label key={p.key} className="flex items-center gap-2 rounded-lg p-2 hover:bg-accent cursor-pointer">
                <Checkbox checked={!!perms[p.key]} onCheckedChange={(v) => setPerms((s) => ({ ...s, [p.key]: !!v }))} />
                <span className="text-sm">{p.label}</span>
              </label>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={async () => { await onSave(makeAdmin, perms); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WalletDialog({ user, onSave }: { user: any; onSave: (amt: number, note: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState(0);
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="ghost">Wallet</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adjust wallet — {user.email}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label>Amount (positive credits, negative debits)</Label>
          <Input type="number" value={amt} onChange={(e) => setAmt(Number(e.target.value))} />
          <Label>Note</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason / reference" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAmt((a) => a + 100)}><Plus className="h-4 w-4" />100</Button>
            <Button variant="outline" onClick={() => setAmt((a) => a - 100)}><Minus className="h-4 w-4" />100</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={async () => { await onSave(amt, note); setOpen(false); }}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
