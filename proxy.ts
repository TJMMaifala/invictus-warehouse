import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Runs before every matched request: refreshes the Supabase session cookie and
 * gates /account and /admin behind sign-in. (Admin ROLE is enforced again, server-side,
 * in app/admin/layout.tsx and in every admin action — the proxy is not the only guard.)
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const protectedPath = pathname.startsWith("/account") && !pathname.startsWith("/account/reset") || pathname.startsWith("/admin");
  if (protectedPath && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login"; login.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
