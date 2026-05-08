import { supabaseAdmin } from "@/integrations/supabase/client.server";

const cache = new Map<string, { v: string; exp: number }>();
const TTL = 5_000;

/** Read a secret from app_secrets table, falling back to process.env. */
export async function getSecret(key: string): Promise<string | null> {
  const now = Date.now();
  const c = cache.get(key);
  if (c && c.exp > now) return c.v || null;
  const { data } = await supabaseAdmin.from("app_secrets").select("value").eq("key", key).maybeSingle();
  const dbVal = (data?.value ?? "").trim();
  const val = dbVal || process.env[key] || "";
  cache.set(key, { v: val, exp: now + TTL });
  return val || null;
}

export function clearSecretCache() { cache.clear(); }
