import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  whatsapp_number: string | null;
  calling_number: string | null;
  optional_number: string | null;
  telegram_username: string | null;
  instagram_username: string | null;
  bio: string | null;
  found_from: string | null;
  wallet_balance: number;
  total_spent: number;
  total_orders: number;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  profileCompletion: number;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

const PROFILE_FIELDS = [
  "first_name", "last_name", "whatsapp_number", "calling_number",
  "telegram_username", "instagram_username", "bio", "found_from", "avatar_url",
] as const;

function calcCompletion(p: Profile | null): number {
  if (!p) return 0;
  const filled = PROFILE_FIELDS.filter((k) => {
    const v = (p as any)[k];
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
  // email always counts
  return Math.round(((filled + 1) / (PROFILE_FIELDS.length + 1)) * 100);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string, email?: string | null) => {
    const [{ data: p }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    const normalizedEmail = String(email ?? p?.email ?? "").toLowerCase();
    const isSuperAdminEmail = normalizedEmail === "niteshprakash555@gmail.com" || normalizedEmail === "zexofile@gmail.com";
    setProfile(p as Profile | null);
    setIsAdmin(isSuperAdminEmail || !!roles?.some((r: any) => r.role === "admin"));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === "INITIAL_SESSION") return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setLoading(true);
        setTimeout(async () => {
          await loadProfile(sess.user.id, sess.user.email);
          supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", sess.user.id);
          setLoading(false);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await loadProfile(s.user.id, s.user.email);
      setLoading(false);
    })();

    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (user) await loadProfile(user.id, user.email);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <Ctx.Provider value={{
      user, session, profile, isAdmin, loading,
      profileCompletion: calcCompletion(profile),
      refresh, signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
