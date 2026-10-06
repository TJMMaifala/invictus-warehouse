import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server client bound to the visitor's session (respects RLS). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* called from a Server Component — session refresh is handled in proxy.ts */
          }
        },
      },
    },
  );
}
