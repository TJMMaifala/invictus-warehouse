"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { formatZAR } from "@/lib/utils";

export function CartDrawer() {
  const { open, setOpen, lines, subtotalCents, remove, setQuantity } = useCart();

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) { document.body.style.overflow = "hidden"; window.addEventListener("keydown", esc); }
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-ink/40" onClick={() => setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside role="dialog" aria-modal="true" aria-label="Shopping cart"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-bone shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.28 }}>
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="font-display text-lg font-extrabold uppercase">Your cart</h2>
              <button onClick={() => setOpen(false)} aria-label="Close cart" className="grid size-9 place-items-center rounded-full hover:bg-ink/5"><X className="size-5" /></button>
            </div>

            {lines.length === 0 ? (
              <div className="grid flex-1 place-items-center px-8 text-center">
                <div>
                  <p className="font-display text-3xl font-black uppercase leading-none">Your cart<br />is waiting.</p>
                  <p className="mt-3 text-mist">Discover something worth adding.</p>
                  <Link href="/shop" onClick={() => setOpen(false)} className="btn-primary mt-6">Shop now</Link>
                </div>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
                  {lines.map((l) => (
                    <li key={l.variantId} className="flex gap-4 py-4">
                      <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-stone/70 p-2 text-center text-[9px] font-bold uppercase leading-tight text-ink/60">
                        {l.imageUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={l.imageUrl} alt="" className="size-full rounded-xl object-cover" /> : l.name.split(" ").slice(0, 3).join(" ")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/product/${l.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-[14px] font-semibold">{l.name}</Link>
                        <p className="mt-0.5 text-[12px] text-mist">{l.variantLabel}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-md border border-ink/25">
                            <button aria-label="Decrease quantity" className="grid size-8 place-items-center" onClick={() => setQuantity(l.variantId, l.quantity - 1)} disabled={l.quantity <= 1}><Minus className="size-3.5" /></button>
                            <span className="w-7 text-center text-sm font-semibold" aria-live="polite">{l.quantity}</span>
                            <button aria-label="Increase quantity" className="grid size-8 place-items-center" onClick={() => setQuantity(l.variantId, l.quantity + 1)} disabled={l.quantity >= l.maxStock}><Plus className="size-3.5" /></button>
                          </div>
                          <span className="text-sm font-semibold">{formatZAR(l.priceCents * l.quantity)}</span>
                        </div>
                        <button onClick={() => remove(l.variantId)} className="mt-2 text-[12px] text-mist underline underline-offset-2">Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-ink/10 px-5 py-5">
                  <div className="flex justify-between text-[15px]"><span>Subtotal</span><strong>{formatZAR(subtotalCents)}</strong></div>
                  <p className="mt-1 text-[12px] text-mist">Delivery and discounts are calculated at checkout.</p>
                  <div className="mt-4 grid gap-2">
                    <Link href="/checkout" onClick={() => setOpen(false)} className="btn-primary">Checkout</Link>
                    <Link href="/cart" onClick={() => setOpen(false)} className="btn-secondary">View full cart</Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
