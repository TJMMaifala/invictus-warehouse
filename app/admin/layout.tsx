import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getAdminUser, getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const NAV = [["Dashboard", "/admin"], ["Products", "/admin/products"], ["Inventory", "/admin/inventory"], ["Orders", "/admin/orders"], ["Reviews", "/admin/reviews"], ["Coupons", "/admin/coupons"], ["Settings", "/admin/settings"]];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured())
    return <Blocked title="Admin needs Supabase" body="Configure your Supabase environment variables to use the admin dashboard." />;
  const user = await getUser();
  if (!user) return <Blocked title="Sign in required" body="Please sign in with an admin account." cta={{ href: "/login?next=/admin", label: "Sign in" }} />;
  if (!(await getAdminUser())) return <Blocked title="Not authorised" body="Your account doesn’t have admin access. If you think this is a mistake, contact the site owner." cta={{ href: "/", label: "Back to store" }} />;
  return (
    <div className="container-x py-8">
      <nav aria-label="Admin" className="mb-8 flex gap-5 overflow-x-auto border-b border-ink/10 pb-3">
        {NAV.map(([l, h]) => <Link key={h} href={h} className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.14em] hover:underline">{l}</Link>)}
      </nav>
      {children}
    </div>
  );
}

function Blocked({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center text-center"><div>
      <h1 className="display-lg">{title}</h1><p className="mt-3 max-w-md text-mist">{body}</p>
      {cta && <Link href={cta.href} className="btn-primary mt-6">{cta.label}</Link>}
    </div></div>
  );
}
