import { supabase } from "@/lib/supabase/client";

export async function withAuthHeaders<const T>(data: T) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    data,
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : undefined,
  };
}