import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/_site/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);
  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*, products(name, slug, banner_image)").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">My Orders</h1>
      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-2xl bg-gradient-card p-12 text-center ring-1 ring-border">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
            <Link to="/products"><Button className="mt-4 rounded-full bg-gradient-primary">Browse Products</Button></Link>
          </div>
        ) : orders.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-border">
            {o.products?.banner_image && <img src={o.products.banner_image} className="h-16 w-16 rounded-lg object-cover" alt="" />}
            <div className="flex-1 min-w-[180px]">
              <div className="font-bold">{o.products?.name ?? "Product"}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.order_type}</div>
            </div>
            <Badge className={
              o.status === "delivered" ? "bg-success text-success-foreground" :
              o.status === "paid" ? "bg-primary text-primary-foreground" :
              o.status === "failed" ? "bg-destructive text-destructive-foreground" :
              "bg-muted text-muted-foreground"
            }>{o.status}</Badge>
            <div className="font-bold">₹{Number(o.amount).toLocaleString("en-IN")}</div>
            {o.delivery_url && (
              <a href={o.delivery_url} target="_blank" rel="noreferrer">
                <Button size="sm" className="rounded-full bg-gradient-primary">Get Access</Button>
              </a>
            )}
            {o.order_type === "customization" && (
              <Link to="/custom-order" search={{ orderId: o.id, productId: o.product_id }}>
                <Button size="sm" variant="outline" className="rounded-full">Fill brief</Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
