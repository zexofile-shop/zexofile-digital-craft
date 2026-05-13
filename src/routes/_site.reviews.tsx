import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/_site/reviews")({
  component: ReviewsPage,
  head: () => ({ meta: [{ title: "Customer Reviews — Zexofile Shop" }] }),
});

function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("reviews").select("*, products(name)").eq("is_approved", true).order("created_at", { ascending: false })
      .then(({ data }) => setReviews(data ?? []));
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Customer Reviews</h1>
      <p className="mt-1 text-muted-foreground">What our customers say about Zexofile Shop.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {reviews.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl bg-gradient-card p-12 text-center ring-1 ring-border text-sm text-muted-foreground">
            No reviews yet — be the first!
          </div>
        ) : reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-card">
            <div className="flex items-center gap-3">
              {r.user_avatar
                ? <img src={r.user_avatar} className="h-10 w-10 rounded-full object-cover" alt="" />
                : <div className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center font-bold">{(r.user_name?.[0] ?? "U").toUpperCase()}</div>}
              <div>
                <div className="font-bold text-sm">{r.user_name ?? "Customer"}</div>
                {r.products?.name && <div className="text-xs text-muted-foreground">on {r.products.name}</div>}
              </div>
              <div className="ml-auto flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/90">{r.review_text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
