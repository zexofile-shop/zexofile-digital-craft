import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_site/products/")({
  component: ProductsPage,
  head: () => ({ meta: [{ title: "All Products — Zexofile Shop" }] }),
});

function ProductsPage() {
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, slug, short_description, banner_image, category, regular_price, discount_price, is_best_selling, is_featured, instant_delivery_enabled")
      .eq("is_active", true)
      .order("is_best_selling", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []) as ProductCardData[]);
        setLoading(false);
      });
  }, []);

  const filtered = items.filter((p) =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.category ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">All Products</h1>
          <p className="mt-1 text-muted-foreground">Browse our full catalog of premium digital assets.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-full pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-gradient-card p-16 text-center ring-1 ring-border">
          <p className="text-muted-foreground">
            {items.length === 0 ? "No products yet — check back soon!" : "No products match your search."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </div>
      )}
    </section>
  );
}
