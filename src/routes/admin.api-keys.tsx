import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Save, RefreshCw, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listAppSecrets, updateAppSecret } from "@/server-fns/app-secrets.functions";
import { withAuthHeaders } from "@/lib/server-fn-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/api-keys")({ component: ApiKeysAdmin });

type Row = { key: string; description: string | null; updated_at: string; value: string; hasValue: boolean };

function ApiKeysAdmin() {
  const list = useServerFn(listAppSecrets);
  const update = useServerFn(updateAppSecret);
  const [rows, setRows] = useState<Row[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = (await list(await withAuthHeaders(undefined as never))) as Row[];
      setRows(r);
      setDrafts(Object.fromEntries(r.map((x) => [x.key, x.value ?? ""])));
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (key: string) => {
    try {
      await update(await withAuthHeaders({ key, value: drafts[key] ?? "" }));
      toast.success(`${key} updated`);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">API Keys & Secrets</h1>
          <p className="text-sm text-muted-foreground">
            Razorpay, ImgBB, Push notifications — change keys anytime without redeploying.
          </p>
        </div>
        <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
      </div>

      {loading ? <div className="p-10 text-center text-muted-foreground">Loading…</div> : (
        <div className="grid gap-4">
          {rows.map((r) => {
            const isShown = !!shown[r.key];
            return (
              <div key={r.key} className="rounded-2xl bg-card ring-1 ring-border p-5 shadow-card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm font-bold">{r.key}</span>
                      {r.hasValue ? (
                        <span className="text-[10px] uppercase tracking-wider rounded-full bg-success/10 text-success px-2 py-0.5">Set</span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider rounded-full bg-destructive/10 text-destructive px-2 py-0.5">Empty</span>
                      )}
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                  </div>
                </div>
                <Label className="text-xs">Value</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      type={isShown ? "text" : "password"}
                      value={drafts[r.key] ?? ""}
                      onChange={(e) => setDrafts({ ...drafts, [r.key]: e.target.value })}
                      placeholder="Enter value…"
                      className="pr-10 font-mono text-sm"
                    />
                    <button type="button" onClick={() => setShown({ ...shown, [r.key]: !isShown })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {isShown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button onClick={() => save(r.key)}><Save className="h-4 w-4 mr-1" /> Save</Button>
                </div>
                <div className="text-[11px] text-muted-foreground mt-2">Last updated: {new Date(r.updated_at).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl bg-primary/5 ring-1 ring-primary/20 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Note:</strong> Updates take effect within ~30 seconds (cached). For VAPID
        push keys, generate a fresh pair from <a href="https://vapidkeys.com/" target="_blank" rel="noreferrer" className="text-primary underline">vapidkeys.com</a>.
        Existing subscribers will need to re-subscribe after a VAPID change.
      </div>
    </div>
  );
}
