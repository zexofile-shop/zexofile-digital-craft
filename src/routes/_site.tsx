import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Wrench } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  const { isAdmin, loading } = useAuth();
  const [maintenance, setMaintenance] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.from("website_settings").select("maintenance_mode").eq("id", 1).maybeSingle()
      .then(({ data }) => setMaintenance(!!data?.maintenance_mode));
  }, []);

  if (loading || maintenance === null) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (maintenance && !isAdmin) {
    return <MaintenancePage />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-hero px-6 text-center">
      <Logo size={64} withText />
      <div className="mt-8 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-primary text-primary-foreground shadow-elegant">
        <Wrench className="h-9 w-9" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">We're under maintenance</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The site is temporarily offline for upgrades. Please check back shortly.
      </p>
      <Link to="/auth" className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
        Sign in
      </Link>
    </div>
  );
}
