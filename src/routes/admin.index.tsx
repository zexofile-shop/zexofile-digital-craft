import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users, Package, ShoppingCart, IndianRupee, Bell, Activity, ArrowUpRight,
  CreditCard, Wallet, Coins, BellOff, BellRing, AlertCircle,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { adminDashboardStats } from "@/server-fns/admin.functions";
import { withAuthHeaders } from "@/lib/server-fn-auth";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

const PIE_COLORS = ["var(--primary)", "var(--success)", "var(--gold)"];
const NOTIF_COLORS = ["var(--success)", "var(--destructive)", "var(--muted-foreground)"];

function Dashboard() {
  const fn = useServerFn(adminDashboardStats);
  const [s, setS] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    withAuthHeaders(undefined as undefined).then((opts) => fn(opts)).then((stats) => {
      if (alive) setS(stats);
    }).catch(console.error);
    const id = setInterval(() => setRefreshKey((k) => k + 1), 30_000);
    return () => { alive = false; clearInterval(id); };
  }, [fn, refreshKey]);

  if (!s) return <div className="text-center py-20 text-muted-foreground">Loading dashboard…</div>;

  const cards = [
    { label: "Total Users", value: s.users, icon: Users },
    { label: "Orders", value: s.orders, icon: ShoppingCart },
    { label: "Products", value: s.products, icon: Package },
    { label: "Net Revenue (₹)", value: Number(s.revenue ?? 0).toLocaleString("en-IN"), icon: IndianRupee },
  ];

  const distData = [
    { name: "Razorpay (direct)", value: s.distribution?.razorpayDirect ?? 0 },
    { name: "Coins used", value: s.distribution?.coinsValue ?? 0 },
    { name: "Wallet top-ups (₹)", value: s.distribution?.walletTopups ?? 0 },
  ];
  const notifData = [
    { name: "Allowed", value: s.notifStats?.allowed ?? 0 },
    { name: "Declined", value: s.notifStats?.denied ?? 0 },
    { name: "Pending", value: s.notifStats?.pending ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">Command Center</h1>
          <p className="text-sm text-muted-foreground">Real-time overview · auto-refreshes every 30s.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-success">
          <Activity className="h-4 w-4 animate-pulse" /> Live
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</div>
              <c.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-extrabold">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue distribution */}
      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold">Revenue distribution</h2>
            <p className="text-sm text-muted-foreground">Where the money came from across all paid orders & top-ups.</p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-primary" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          <div className="grid gap-3">
            <DistRow icon={CreditCard} label="Razorpay (direct INR on orders)" value={s.distribution?.razorpayDirect ?? 0} />
            <DistRow icon={Coins} label="Zexo Coins used on orders (₹ value)" value={s.distribution?.coinsValue ?? 0} />
            <DistRow icon={Wallet} label="Wallet top-ups via Razorpay" value={s.distribution?.walletTopups ?? 0} />
            <div className="rounded-xl bg-primary/5 p-4 mt-1">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Gross order value</div>
              <div className="text-2xl font-extrabold">₹{Number(s.distribution?.grossOrderRevenue ?? 0).toLocaleString("en-IN")}</div>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {distData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `₹${Number(v).toLocaleString("en-IN")}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Time series */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="User signups (last 30 days)" subtitle="New profiles per day">
          <AreaChart data={s.series?.users ?? []}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" fontSize={10} tickFormatter={(d) => d.slice(5)} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} />
          </AreaChart>
        </ChartCard>
        <ChartCard title="Sales (last 30 days)" subtitle="Paid + delivered orders per day">
          <BarChart data={s.series?.sales ?? []}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" fontSize={10} tickFormatter={(d) => d.slice(5)} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--success)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="INR revenue (last 30 days)" subtitle="Direct Razorpay portion of orders">
          <AreaChart data={s.series?.revenue ?? []}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" fontSize={10} tickFormatter={(d) => d.slice(5)} />
            <YAxis fontSize={10} />
            <Tooltip formatter={(v: number) => `₹${Number(v).toLocaleString("en-IN")}`} />
            <Area type="monotone" dataKey="value" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.25} />
          </AreaChart>
        </ChartCard>
        <ChartCard
          title="Notification reach"
          subtitle={`${s.notifStats?.allowed ?? 0} subscribed · ${s.notifStats?.pending ?? 0} can be force-prompted`}
          right={<a href="/admin/notifications" className="text-xs font-bold text-primary hover:underline">Force re-prompt →</a>}
        >
          <PieChart>
            <Pie data={notifData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
              {notifData.map((_, i) => <Cell key={i} fill={NOTIF_COLORS[i % NOTIF_COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Mini icon={BellRing} label="Push allowed" value={s.notifStats?.allowed ?? 0} tone="success" />
        <Mini icon={BellOff} label="Push declined" value={s.notifStats?.denied ?? 0} tone="destructive" />
        <Mini icon={AlertCircle} label="Active 24h orders" value={s.active24h ?? 0} tone="primary" />
      </div>
    </div>
  );
}

function DistRow({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
        <span className="text-sm font-medium truncate">{label}</span>
      </div>
      <span className="font-extrabold tabular-nums">₹{Number(value).toLocaleString("en-IN")}</span>
    </div>
  );
}

function ChartCard({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactElement }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <h3 className="font-bold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </section>
  );
}

function Mini({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: string }) {
  const color = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-primary";
  return (
    <div className="rounded-2xl border bg-card p-4 flex items-center gap-3">
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-extrabold">{value}</div>
      </div>
    </div>
  );
}
