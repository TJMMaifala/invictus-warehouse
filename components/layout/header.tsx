"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { SearchOverlay } from "./search-overlay";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop/sneakers", label: "Sneakers" },
  { href: "/shop/iphones", label: "iPhones" },
  { href: "/shop/clothing", label: "Clothing" },
  { href: "/about", label: "About" },
];

export function Header({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const { count, setOpen, hydrated } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const home = pathname === "/";

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setMenu(false), [pathname]);

  const solid = scrolled || !home || menu;

  return (
    <>
      <header className={cn(home ? "fixed inset-x-0 top-0" : "sticky top-0", "z-40 transition-colors duration-300",
        solid ? "border-b border-ink/10 bg-bone/95 backdrop-blur-sm" : "bg-transparent")}>
        <div className="container-x flex h-16 items-center justify-between gap-6 md:h-[72px]">
          <Link href="/" className="font-display text-xl font-black tracking-[0.04em] md:text-2xl" aria-label="Invictus Warehouse home">
            INVICTUS
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href) && (n.href !== "/shop" || pathname === "/shop");
              return (
                <Link key={n.href} href={n.href}
                  className={cn("text-[12px] font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-60", active && "underline underline-offset-[10px] decoration-2")}>
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button type="button" onClick={() => setSearch(true)} aria-label="Search" className="grid size-10 place-items-center rounded-full hover:bg-ink/5">
              <Search className="size-[18px]" />
            </button>
            <Link href={signedIn ? "/account" : "/login"} aria-label={signedIn ? "My account" : "Sign in"} className="hidden size-10 place-items-center rounded-full hover:bg-ink/5 sm:grid">
              <User className="size-[18px]" />
            </Link>
            <button type="button" onClick={() => setOpen(true)} aria-label={`Open cart${hydrated ? `, ${count} items` : ""}`} className="relative grid size-10 place-items-center rounded-full hover:bg-ink/5">
              <ShoppingBag className="size-[18px]" />
              {hydrated && count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10px] font-bold leading-[18px] text-paper">{count}</span>
              )}
            </button>
            <button type="button" onClick={() => setMenu((m) => !m)} aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} className="grid size-10 place-items-center rounded-full hover:bg-ink/5 lg:hidden">
              {menu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menu && (
            <motion.nav aria-label="Mobile" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }} className="overflow-hidden border-t border-ink/10 bg-bone lg:hidden">
              <ul className="container-x flex flex-col py-4">
                {[...NAV, { href: signedIn ? "/account" : "/login", label: signedIn ? "My account" : "Sign in" }, { href: "/wishlist", label: "Wishlist" }, { href: "/track", label: "Track order" }].map((n) => (
                  <li key={n.href + n.label}>
                    <Link href={n.href} className="block border-b border-ink/10 py-4 font-display text-2xl font-extrabold uppercase tracking-tight">{n.label}</Link>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}
