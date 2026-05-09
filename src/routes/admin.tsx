import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Package, ShoppingCart, Tags, Star, Bell, Settings,
  FileText, MessageSquare, Wallet, KeyRound, LogOut,
  Search, Menu, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: any; exact?: boolean };
const SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [
    { to: "/admin", label: "Command Center", icon: LayoutDashboard, exact: true },
  ]},
  { title: "Catalog", items: [
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { to: "/admin/custom-orders", label: "Custom Orders", icon: MessageSquare },
    { to: "/admin/coupons", label: "Coupons", icon: Tags },
    { to: "/admin/reviews", label: "Reviews", icon: Star },
  ]},
  { title: "Users", items: [
    { to: "/admin/users", label: "Users & Admins", icon: Users },
    { to: "/admin/wallet", label: "Wallet Tools", icon: Wallet },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
  ]},
  { title: "System", items: [
    { to: "/admin/api-keys", label: "API Keys", icon: KeyRound },
    { to: "/admin/legal", label: "Legal Pages", icon: FileText },
    { to: "/admin/settings", label: "Site Settings", icon: Settings },
  ]},
];

function AdminLayout() {
  const { user, isAdmin, loading, profile } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading admin…</div>;
  if (!user) return <div className="p-10 text-center text-muted-foreground">Opening sign in…</div>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don't have admin access.</p>
        <Link to="/" className="mt-6 inline-block text-primary underline">Back home</Link>
      </div>
    );
  }

  const isActive = (n: NavItem) => n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
  const initials = (profile?.first_name?.[0] ?? profile?.email?.[0] ?? "A").toUpperCase();

  const SidebarInner = (
    <>
      <div className="px-5 py-5 border-b border-border/60 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-extrabold text-lg tracking-tight">Zexofile</span>
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">
          Admin
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {SECTIONS.map((sec) => (
          <div key={sec.title}>
            <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold">
              {sec.title}
            </div>
            <div className="space-y-0.5">
              {sec.items.map((n) => (
                <Link key={n.to} to={n.to} className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(n)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground",
                )}>
                  <n.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{n.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-border/60 flex items-center gap-2 text-xs text-success">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        System Online
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-card sticky top-0 h-screen">
        {SidebarInner}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] flex flex-col bg-card shadow-elegant">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-lg hover:bg-accent z-10"
            >
              <X className="h-4 w-4" />
            </button>
            {SidebarInner}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative flex-1 max-w-xl hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search across the admin panel…" className="pl-9 h-9 bg-muted/50 border-0" />
            </div>
            <div className="flex-1 sm:hidden text-sm font-bold">Admin Panel</div>
            <Link to="/admin/notifications" className="relative p-2 rounded-lg hover:bg-accent">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </Link>
            <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-border/60">
              <div className="text-right hidden sm:block leading-tight">
                <div className="text-sm font-bold">{profile?.first_name || profile?.email?.split("@")[0] || "Admin"}</div>
                <div className="text-[10px] text-muted-foreground">Super Admin</div>
              </div>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="h-9 w-9 rounded-full object-cover ring-1 ring-border" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {initials}
                </div>
              )}
              <button
                onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/" }))}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
