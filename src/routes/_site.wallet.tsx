import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowDownCircle, ArrowUpCircle, ShieldCheck, Sparkles, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ZexoCoin, ZexoBalance } from "@/components/ZexoCoin";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createRzpOrder, verifyRzpPayment } from "@/server-fns/payments.functions";
import { withAuthHeaders } from "@/lib/server-fn-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/wallet")({
  component: WalletPage,
});

declare global { interface Window { Razorpay: any } }

function loadRzp(): Promise<void> {
  return new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(); s.onerror = () => rej(new Error("Razorpay failed to load"));
    document.body.appendChild(s);
  });
}

function WalletPage() {
  const { user, profile, loading, refresh } = useAuth();
  const nav = useNavigate();
  const [tx, setTx] = useState<any[]>([]);
  const [amt, setAmt] = useState(500);
  const [paying, setPaying] = useState(false);
  const create = useServerFn(createRzpOrder);
  const verify = useServerFn(verifyRzpPayment);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);
  const loadTx = () => user && supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => setTx(data ?? []));
  useEffect(() => { loadTx(); /* eslint-disable-next-line */ }, [user]);

  const topup = async () => {
    if (!user || amt < 1 || paying) return;
    setPaying(true);
    try {
      await loadRzp();
      const { orderId, amount, currency, keyId } = await create(await withAuthHeaders({ amountInr: Math.round(amt), purpose: "wallet_topup" }));
      if (!keyId) throw new Error("Razorpay key missing. Payment is not ready yet.");
      const rzp = new window.Razorpay({
        key: keyId, amount, currency, order_id: orderId, name: "Zexofile Shop",
        description: `Add ${amt} Zexo Coins`,
        prefill: { email: user.email, name: profile?.first_name ?? "" },
        theme: { color: "#1e40af" },
        handler: async (resp: any) => {
          try {
            await verify(await withAuthHeaders({ ...resp, purpose: "wallet_topup", amountInr: amt }));
            toast.success(`+${amt} Zexo Coins added!`);
            await refresh(); loadTx();
          } catch (e: any) { toast.error(e.message); }
          finally { setPaying(false); }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (e: any) { toast.error(e.message); setPaying(false); }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold flex items-center gap-3"><ZexoCoin size={36} /> Zexo Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use Zexo Coins to instantly unlock products, get discounts and skip checkout.</p>

        <div className="mt-6 rounded-[2rem] bg-gradient-primary p-1 shadow-elegant relative overflow-hidden">
          <div className="rounded-[1.75rem] bg-card/10 p-5 sm:p-7 text-primary-foreground relative overflow-hidden">
            <div className="absolute -right-8 -top-8 opacity-15"><ZexoCoin size={190} /></div>
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest opacity-80">Current Balance</div>
                <div className="mt-2 flex items-center gap-3">
                  <ZexoCoin size={44} />
                  <span className="text-4xl font-extrabold tabular-nums">{Number(profile?.wallet_balance ?? 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-card/15 px-3 py-2 text-right ring-1 ring-primary-foreground/20">
                <div className="text-[10px] uppercase tracking-widest opacity-75">Value</div>
                <div className="text-sm font-bold">1 ZexoCoin = ₹1 INR</div>
              </div>
            </div>

            <div className="relative mt-6 rounded-2xl bg-card/15 p-3 ring-1 ring-primary-foreground/20 backdrop-blur">
              <div className="flex items-center gap-2 text-xs font-semibold opacity-85"><ShieldCheck className="h-3.5 w-3.5" /> Secure Razorpay top-up</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70" />
                  <Input type="number" min={1} value={amt} onChange={(e) => setAmt(Math.max(1, Number(e.target.value) || 1))}
                         className="h-12 rounded-2xl bg-card/20 pl-9 text-lg font-bold text-primary-foreground border-primary-foreground/25 placeholder:text-primary-foreground/60" />
                </div>
                <Button disabled={paying} onClick={topup} className="h-12 rounded-2xl bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold font-bold">
                  <Plus className="mr-2 h-4 w-4" /> {paying ? "Opening…" : "Add Coins"}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[100, 500, 1000, 2000].map((v) => (
                  <button key={v} onClick={() => setAmt(v)} className="rounded-full bg-card/15 px-4 py-2 text-xs font-bold ring-1 ring-primary-foreground/15 hover:bg-card/25 transition-smooth">+{v}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          {[
            { t: "Pay anywhere", d: "Use coins on any product to instantly reduce price." },
            { t: "Stack with coupons", d: "Combine coins with coupon discounts at checkout." },
            { t: "Earn cashback", d: "Refunds and bonuses are credited as Zexo Coins." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl bg-card ring-1 ring-border p-4">
              <div className="font-bold text-sm">{c.t}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-xl font-bold">Transaction history</h2>
        <div className="mt-3 space-y-2">
            {tx.length === 0 ? (
            <div className="rounded-2xl bg-gradient-card p-10 text-center text-sm text-muted-foreground ring-1 ring-border">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" /> No transactions yet.
            </div>
          ) : tx.map((t) => {
            const credit = String(t.type).startsWith("credit") || t.type === "refund";
            return (
              <div key={t.id} className="flex items-center justify-between rounded-2xl bg-card p-4 ring-1 ring-border">
                <div className="flex items-center gap-3">
                  {credit ? <ArrowDownCircle className="h-5 w-5 text-success" /> : <ArrowUpCircle className="h-5 w-5 text-destructive" />}
                  <div>
                    <div className="text-sm font-semibold">{t.note ?? t.type.replace("_", " ")}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className={`font-bold tabular-nums ${credit ? "text-success" : "text-destructive"}`}>
                  {credit ? "+" : "−"}{Number(t.amount).toLocaleString("en-IN")} Z
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
