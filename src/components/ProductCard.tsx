import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Zap, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  banner_image: string | null;
  category: string | null;
  regular_price: number;
  discount_price: number | null;
  is_best_selling?: boolean;
  is_featured?: boolean;
  instant_delivery_enabled?: boolean;
};

export const ProductCard = memo(function ProductCard({ p, index = 0 }: { p: ProductCardData; index?: number }) {
  const finalPrice = p.discount_price ?? p.regular_price;
  const hasDiscount = p.discount_price != null && p.discount_price < p.regular_price;
  const off = hasDiscount ? Math.round((1 - finalPrice / p.regular_price) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        to="/products/$slug"
        params={{ slug: p.slug }}
        className="group relative block overflow-hidden rounded-2xl bg-gradient-card shadow-card ring-1 ring-border hover:ring-primary/40 hover:shadow-elegant transition-smooth"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {p.banner_image ? (
            <img
              src={p.banner_image}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-primary-foreground">
              <Tag className="h-10 w-10 opacity-70" />
            </div>
          )}

          <div className="absolute inset-x-2 top-2 flex flex-wrap gap-1.5">
            {p.is_best_selling && (
              <Badge className="bg-gradient-gold text-gold-foreground border-0 shadow-gold">
                <Sparkles className="mr-1 h-3 w-3" />
                Best Seller
              </Badge>
            )}
            {p.is_featured && !p.is_best_selling && (
              <Badge className="bg-primary text-primary-foreground border-0">Featured</Badge>
            )}
            {hasDiscount && (
              <Badge className="ml-auto bg-destructive text-destructive-foreground border-0">
                -{off}%
              </Badge>
            )}
          </div>

          {p.instant_delivery_enabled && (
            <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full glass px-2.5 py-1 text-[11px] font-semibold">
              <Zap className="h-3 w-3 text-primary" /> Instant
            </div>
          )}
        </div>

        <div className="p-4">
          {p.category && (
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              {p.category}
            </div>
          )}
          <h3 className="line-clamp-1 text-base font-bold text-foreground group-hover:text-primary transition-smooth">
            {p.name}
          </h3>
          {p.short_description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.short_description}</p>
          )}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-foreground">
              ₹{Number(finalPrice).toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{Number(p.regular_price).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
