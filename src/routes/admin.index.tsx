import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Package, ShoppingCart, IndianRupee, Bell, Activity, ArrowUpRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { adminDashboardStats } from "@/server-fns/admin.functions";
import { withAuthHeaders } from "@/lib/server-fn-auth";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(adminDashboardStats);
  const [s, setS] = useState({ users: 0, orders: 0, products: 0, notifications: 0, active24h: 0, revenue: 0 });
  useEffect(() => {
    withAuthHeaders(undefined as undefined).then((opts) => fn(opts)).then((stats) => {
      setS({
        users: Number(stats?.users ?? 0),
        orders: Number(stats?.orders ?? 0),
        products: Number(stats?.products ?? 0),
          notifications: Number(stats?.notifications ?? 0),
          active24h: Number(stats?.active24h ?? 0),
        revenue: Number(stats?.revenue ?? 0),
      });
    }).catch(console.error);
  }, [fn]);

  const cards = [
    { label: "Total Users", value: s.users, icon: Users },
    { label: "Orders", value: s.orders, icon: ShoppingCart },
    { label: "Products", value: s.products, icon: Package },
    { label: "Revenue (₹)", value: Number(s.revenue ?? 0).toLocaleString("en-IN"), icon: IndianRupee },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">Command Center</h1>
          <p className="text-sm text-muted-foreground">Real-time overview of your platform, APIs, and users.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 text-primary" /> Checking...
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
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Platform pulse</h2>
              <p className="text-sm text-muted-foreground">Quick snapshot for the last 24 hours.</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Active 24h</div>
              <div className="mt-2 text-2xl font-extrabold">{s.active24h}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Notifications</div>
              <div className="mt-2 text-2xl font-extrabold">{s.notifications}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Catalog status</div>
              <div className="mt-2 text-2xl font-extrabold">{s.products > 0 ? "Live" : "Empty"}</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-lg font-bold"><Bell className="h-5 w-5 text-primary" /> Recent system note</div>
          <p className="mt-4 text-sm text-muted-foreground">
            Product creation now runs through protected admin server actions, so catalog changes are no longer blocked by client-side row security.
          </p>
        </section>
      </div>
    </div>
  );
}
