import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, User as UserIcon, Wallet, LogOut, ShieldCheck, Package } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ZexoBalance } from "./ZexoCoin";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo withText />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent transition-smooth"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/wallet" aria-label="Zexo Wallet">
                <ZexoBalance amount={Number(profile?.wallet_balance ?? 0)} variant="pill" size={18} />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-primary/30 hover:ring-primary transition-smooth">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="me" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-primary-foreground text-sm font-bold">
                        {(profile?.first_name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => nav({ to: "/profile" })}><UserIcon className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => nav({ to: "/orders" })}><Package className="mr-2 h-4 w-4" />My Orders</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => nav({ to: "/wallet" })}><Wallet className="mr-2 h-4 w-4" />Zexo Wallet</DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => nav({ to: "/admin" })}>
                        <ShieldCheck className="mr-2 h-4 w-4 text-primary" />Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); nav({ to: "/" }); }}>
                    <LogOut className="mr-2 h-4 w-4" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth" className="hidden sm:inline-flex">
              <Button size="sm" className="rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
                <ShoppingBag className="mr-2 h-4 w-4" /> Sign in
              </Button>
            </Link>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full" aria-label="Profile menu">
                <UserIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-6 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium hover:bg-accent transition-smooth">
                    {n.label}
                  </Link>
                ))}
                {user && (
                  <>
                    <div className="my-2 border-t" />
                    <Link to="/profile" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-medium hover:bg-accent">Profile</Link>
                    <Link to="/orders" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-medium hover:bg-accent">My Orders</Link>
                    <Link to="/wallet" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-medium hover:bg-accent">Zexo Wallet</Link>
                    {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-medium text-primary hover:bg-accent">Admin Panel</Link>}
                    <button onClick={async () => { await signOut(); setOpen(false); nav({ to: "/" }); }} className="text-left rounded-xl px-4 py-3 text-base font-medium hover:bg-accent">Sign out</button>
                  </>
                )}
                {!user && (
                  <Link to="/auth" onClick={() => setOpen(false)}>
                    <Button className="mt-4 w-full rounded-full bg-gradient-primary">Sign in</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
