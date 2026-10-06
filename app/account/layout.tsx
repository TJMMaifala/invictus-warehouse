import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import type { ReactNode } from "react";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");
  return (
    <div className="container-x py-12 md:py-16">
      <h1 className="display-lg mb-8">My account</h1>
      <div className="grid gap-10 md:grid-cols-[200px_1fr]">
        <nav aria-label="Account" className="flex gap-4 overflow-x-auto md:flex-col md:gap-1">
          {[["Profile", "/account"], ["My orders", "/account/orders"], ["Addresses", "/account/addresses"], ["Wishlist", "/wishlist"]].map(([l, h]) => (
            <Link key={h} href={h} className="whitespace-nowrap py-2 text-[13px] font-semibold uppercase tracking-[0.14em] hover:underline">{l}</Link>
          ))}
          <form action="/auth/signout" method="post"><button className="py-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-mist hover:underline">Sign out</button></form>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
