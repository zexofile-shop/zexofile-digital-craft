import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Package, ShoppingCart, Tags, Star, Bell, Settings,
  FileText, MessageSquare, Wallet, ArrowLeft, ShieldCheck, KeyRound, ChevronLeft,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

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

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="flex">
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r bg-card/95 min-h-screen sticky top-0 shadow-card">
          <div className="px-5 py-5 border-b">
            <Link to="/"><Logo withText size={36} /></Link>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-widest text-primary font-bold">
              <ShieldCheck className="h-3 w-3" /> Admin Panel
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
            {SECTIONS.map((sec) => (
              <div key={sec.title}>
                <div className="px-3 mb-1 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{sec.title}</div>
                <div className="space-y-1">
                  {sec.items.map((n) => (
                    <Link key={n.to} to={n.to} className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-smooth",
                      isActive(n) ? "bg-primary text-primary-foreground shadow-elegant" : "hover:bg-accent text-foreground/80",
                    )}>
                      <n.icon className="h-4 w-4" />{n.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="p-3 border-t text-xs text-muted-foreground">
            <div className="truncate">{profile?.email}</div>
            <Link to="/" className="mt-2 inline-flex items-center gap-1 text-primary hover:underline">
              <ArrowLeft className="h-3 w-3" /> Back to site
            </Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {/* Mobile header with back-to-site + scrollable nav */}
          <div className="lg:hidden sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
            <div className="flex items-center gap-2 p-2">
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link to="/"><ChevronLeft className="h-4 w-4" /> Back</Link>
              </Button>
              <div className="text-sm font-bold truncate">Admin Panel</div>
            </div>
            <div className="flex gap-2 overflow-x-auto px-2 pb-2">
              {SECTIONS.flatMap((s) => s.items).map((n) => (
                <Link key={n.to} to={n.to} className={cn(
                  "shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs whitespace-nowrap ring-1 ring-border",
                  isActive(n) ? "bg-primary text-primary-foreground" : "bg-background",
                )}>
                  <n.icon className="h-3 w-3" />{n.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
