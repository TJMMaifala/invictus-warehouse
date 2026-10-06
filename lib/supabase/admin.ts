import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. BYPASSES RLS. Import only from server code
 * (route handlers / server actions). `server-only` fails the build if it
 * is ever imported into a client component.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
