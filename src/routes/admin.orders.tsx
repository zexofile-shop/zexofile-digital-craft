import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/orders")({ component: OrdersAdmin });

function OrdersAdmin() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("orders").select("*, products(name), profiles(email)").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setOrders(data ?? []));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Orders</h1>
      <div className="rounded-2xl ring-1 ring-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr><th className="p-3">Date</th><th className="p-3">User</th><th className="p-3">Product</th><th className="p-3">Type</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 whitespace-nowrap">{new Date(o.created_at).toLocaleString()}</td>
                <td className="p-3">{o.profiles?.email}</td>
                <td className="p-3">{o.products?.name}</td>
                <td className="p-3">{o.order_type}</td>
                <td className="p-3">₹{Number(o.amount).toLocaleString("en-IN")}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${o.status === "delivered" ? "bg-success/15 text-success" : o.status === "paid" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{o.status}</span></td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No orders yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
