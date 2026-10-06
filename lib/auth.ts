import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Authoritative admin check — queries admin_users under the caller's own RLS context. */
export async function getAdminUser() {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? user : null;
}
