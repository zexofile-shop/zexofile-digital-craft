import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_site/products/$slug")({
  component: ProductDetailPage,
});

type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  banner_image: string | null;
  gallery_images: string[];
  youtube_url: string | null;
  category: string | null;
  regular_price: number;
  discount_price: number | null;
  source_code_price: number | null;
  customization_price: number | null;
  instant_delivery_enabled: boolean;
  customizable_enabled: boolean;
  dual_button_mode: boolean;
  primary_button_label: string;
  secondary_button_label: string;
};

function ytEmbed(url: string | null) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function ProductDetailPage() {
  const { slug } = useParams({ from: "/_site/products/$slug" });
  const { user, profileCompletion } = useAuth();
  const nav = useNavigate();
  const [p, setP] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        setP(data as any);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  if (!p) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link to="/products"><Button className="mt-6 rounded-full">Back to products</Button></Link>
      </div>
    );
  }

  const embed = ytEmbed(p.youtube_url);
  const slides: { type: "img" | "yt"; src: string }[] = [
    ...(p.banner_image ? [{ type: "img" as const, src: p.banner_image }] : []),
    ...(p.gallery_images || []).map((src) => ({ type: "img" as const, src })),
    ...(embed ? [{ type: "yt" as const, src: embed }] : []),
  ];

  const finalPrice = p.discount_price ?? p.regular_price;
  const sourcePrice = p.source_code_price ?? finalPrice;
  const customPrice = p.customization_price ?? finalPrice;

  const handleBuy = (type: "source" | "custom") => {
    if (!user) { toast.error("Please sign in to continue"); return; }
    if (profileCompletion < 80) {
      toast.error(`Complete your profile to purchase (${profileCompletion}% / 80% required)`);
      return;
    }
    nav({ to: "/checkout/$slug", params: { slug }, search: { type } });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        {/* Slider */}
        <div className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted ring-1 ring-border shadow-card">
            {slides[slide]?.type === "yt" ? (
              <iframe src={slides[slide].src} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen />
            ) : slides[slide]?.src ? (
              <img src={slides[slide].src} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
            )}

            {slides.length > 1 && (
              <>
                <button
                  onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full glass p-2 hover:bg-accent"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSlide((s) => (s + 1) % slides.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full glass p-2 hover:bg-accent"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {slides.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition-smooth ${i === slide ? "ring-primary" : "ring-border"}`}
                >
                  {s.type === "yt"
                    ? <div className="flex h-full w-full items-center justify-center bg-navy text-primary-foreground text-xs font-bold">▶ Demo</div>
                    : <img src={s.src} className="h-full w-full object-cover" alt="" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          {p.category && <Badge variant="secondary" className="rounded-full">{p.category}</Badge>}
          <h1 className="text-3xl font-extrabold sm:text-4xl">{p.name}</h1>
          {p.short_description && <p className="text-muted-foreground">{p.short_description}</p>}

          <div className="rounded-2xl bg-gradient-card p-5 ring-1 ring-border">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold">₹{Number(finalPrice).toLocaleString("en-IN")}</span>
              {p.discount_price != null && p.discount_price < p.regular_price && (
                <span className="text-base text-muted-foreground line-through">₹{Number(p.regular_price).toLocaleString("en-IN")}</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {p.instant_delivery_enabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                  <Zap className="h-3 w-3" /> Instant Delivery
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 font-semibold text-success">
                <ShieldCheck className="h-3 w-3" /> Secure Payment
              </span>
            </div>
          </div>

          <div className={cn(
            "grid gap-3",
            p.dual_button_mode && p.customizable_enabled ? "grid-cols-2" : "grid-cols-1",
          )}>
            <Button
              size="lg"
              onClick={() => handleBuy("source")}
              className="h-14 rounded-2xl text-base font-bold bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow hover:scale-[1.02] transition-all"
            >
              <span className="flex flex-col items-center leading-tight">
                <span className="text-[11px] uppercase tracking-wider opacity-80">{p.primary_button_label || "Buy Source Code"}</span>
                <span className="text-lg font-extrabold">₹{Number(sourcePrice).toLocaleString("en-IN")}</span>
              </span>
            </Button>
            {p.dual_button_mode && p.customizable_enabled && (
              <Button
                size="lg"
                onClick={() => handleBuy("custom")}
                className="h-14 rounded-2xl text-base font-bold bg-card border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-card hover:scale-[1.02] transition-all"
              >
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-[11px] uppercase tracking-wider opacity-80">{p.secondary_button_label || "Get Customized"}</span>
                  <span className="text-lg font-extrabold">₹{Number(customPrice).toLocaleString("en-IN")}</span>
                </span>
              </Button>
            )}
          </div>

          {p.full_description && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <h3 className="text-lg font-bold">Description</h3>
              <p className="whitespace-pre-line text-muted-foreground">{p.full_description}</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
