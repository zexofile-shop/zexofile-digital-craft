import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, ShieldCheck, Sparkles, Code2, Rocket, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_site/")({
  component: Landing,
});

function Landing() {
  const [products, setProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, slug, short_description, banner_image, category, regular_price, discount_price, is_best_selling, is_featured, instant_delivery_enabled")
      .eq("is_active", true)
      .or("is_best_selling.eq.true,is_featured.eq.true")
      .order("is_best_selling", { ascending: false })
      .limit(6)
      .then(({ data }) => setProducts((data ?? []) as ProductCardData[]));
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Premium Digital Marketplace
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Digital Files,{" "}
              <span className="text-gradient-primary">Delivered.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:mx-0 md:text-lg">
              Source codes, websites, apps and fully customized digital services — built premium, delivered instantly.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link to="/products">
                <Button size="lg" className="rounded-full bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow transition-smooth">
                  Browse Products <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="rounded-full">Contact Us</Button>
              </Link>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {[
                { icon: Zap, label: "Instant Delivery" },
                { icon: ShieldCheck, label: "Secure Payments" },
                { icon: Star, label: "Premium Quality" },
              ].map((f, i) => (
                <div key={i} className="rounded-2xl glass p-3 text-center">
                  <f.icon className="mx-auto h-5 w-5 text-primary" />
                  <div className="mt-1 text-[11px] font-semibold">{f.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mx-auto"
          >
            <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-3xl animate-float" />
            <div className="relative rounded-3xl glass p-8 shadow-elegant">
              <Logo size={160} />
              <div className="mt-6 text-center">
                <div className="text-2xl font-extrabold">Zexofile Shop</div>
                <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Digital Files, Delivered
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Why Zexofile Shop</h2>
          <p className="mt-2 text-muted-foreground">Built for creators who demand quality and speed.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Code2, title: "Premium Source Codes", desc: "Production-ready codebases for apps, websites, and more." },
            { icon: Rocket, title: "Custom Builds", desc: "Tell us what you need — we craft it to your spec." },
            { icon: Sparkles, title: "Zexo Wallet", desc: "Save with golden Zexo Coins on every purchase." },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl bg-gradient-card p-6 ring-1 ring-border shadow-card hover:shadow-elegant transition-smooth"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">Best Sellers</h2>
              <p className="mt-1 text-muted-foreground">Hand-picked premium picks from our shop.</p>
            </div>
            <Link to="/products">
              <Button variant="outline" className="rounded-full">View all <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto my-16 max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 text-primary-foreground shadow-elegant md:p-14">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-glow/40 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Need something custom?</h2>
            <p className="mt-3 opacity-90">
              Get a tailored build for your idea. We respond within 30 minutes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/contact">
                <Button size="lg" variant="secondary" className="rounded-full">Talk to us</Button>
              </Link>
              <Link to="/products">
                <Button size="lg" variant="outline" className="rounded-full bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                  Explore products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
