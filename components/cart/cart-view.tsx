"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, AlertCircle } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useQuote } from "@/hooks/use-quote";
import { Totals } from "./order-summary";
import { formatZAR } from "@/lib/utils";
import type { DeliveryMethodId } from "@/types";

export function CartView() {
  const cart = useCart();
  const [method, setMethod] = useState<DeliveryMethodId>("collection");
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const { status, quote } = useQuote(cart.lines, method, applied, cart.hydrated);

  if (!cart.hydrated) return <div className="container-x py-24" aria-busy="true"><div className="h-8 w-48 animate-pulse rounded bg-stone" /></div>;

  if (cart.lines.length === 0)
    return (
      <div className="container-x grid place-items-center py-28 text-center">
        <div>
          <h1 className="display-lg">Your cart<br />is waiting.</h1>
          <p className="mt-4 text-mist">Discover something worth adding.</p>
          <Link href="/shop" className="btn-primary mt-8">Shop now</Link>
        </div>
      </div>
    );

  const qLine = (variantId: string) => quote?.lines.find((l) => l.variantId === variantId);
  const blocked = status === "error" || !quote || quote.lines.length === 0;

  return (
    <div className="container-x py-10 md:py-16">
      <h1 className="display-lg mb-8">Your cart</h1>
      {status === "error" && (
        <p role="alert" className="mb-6 flex items-center gap-2 rounded-lg bg-paper p-4 text-sm"><AlertCircle className="size-4 text-bad" /> We couldn’t refresh live prices. Check your connection and try again.</p>
      )}
      {quote?.issues.map((i) => <p key={i} role="status" className="mb-3 flex items-center gap-2 rounded-lg bg-paper p-4 text-sm"><AlertCircle className="size-4 text-warn" /> {i}</p>)}

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {cart.lines.map((l) => {
            const q = qLine(l.variantId);
            const unavailable = quote && !q;
            return (
              <li key={l.variantId} className="flex gap-4 py-6">
                <div className="grid size-24 shrink-0 place-items-center rounded-xl bg-stone/70 p-2 text-center text-[10px] font-bold uppercase leading-tight text-ink/60 sm:size-28">
                  {l.imageUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={l.imageUrl} alt="" className="size-full rounded-xl object-cover" /> : l.name.split(" ").slice(0, 3).join(" ")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-4">
                    <Link href={`/product/${l.slug}`} className="font-semibold">{l.name}</Link>
                    <span className="font-semibold">{formatZAR((q?.unitPriceCents ?? l.priceCents) * l.quantity)}</span>
                  </div>
                  {unavailable && <p className="mt-1 text-sm text-bad">No longer available — please remove.</p>}
                  {q && q.options.length > 1 && (
                    <label className="mt-2 flex items-center gap-2 text-[13px]">
                      <span className="text-mist">Size</span>
                      <select className="rounded-md border border-ink/25 bg-paper px-2 py-1" value={l.variantId}
                        onChange={(e) => {
                          const o = q.options.find((x) => x.variantId === e.target.value)!;
                          cart.swapVariant(l.variantId, { ...l, variantId: o.variantId, variantLabel: o.label, maxStock: o.stock, quantity: Math.min(l.quantity, o.stock) });
                        }}>
                        {q.options.map((o) => <option key={o.variantId} value={o.variantId} disabled={o.stock <= 0}>{o.label}{o.stock <= 0 ? " (sold out)" : ""}</option>)}
                      </select>
                    </label>
                  )}
                  {(!q || q.options.length <= 1) && <p className="mt-1 text-[13px] text-mist">{l.variantLabel}</p>}
                  <div className="mt-3 flex items-center gap-4">
                    <div className="inline-flex items-center rounded-md border border-ink/25">
                      <button aria-label="Decrease quantity" className="grid size-9 place-items-center" onClick={() => cart.setQuantity(l.variantId, l.quantity - 1)} disabled={l.quantity <= 1}><Minus className="size-3.5" /></button>
                      <span className="w-8 text-center text-sm font-semibold">{l.quantity}</span>
                      <button aria-label="Increase quantity" className="grid size-9 place-items-center" onClick={() => cart.setQuantity(l.variantId, l.quantity + 1)} disabled={l.quantity >= l.maxStock}><Plus className="size-3.5" /></button>
                    </div>
                    <button onClick={() => cart.remove(l.variantId)} className="text-[13px] text-mist underline underline-offset-2">Remove</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-[var(--radius-card)] bg-paper p-6 lg:sticky lg:top-24" aria-label="Order summary">
          <h2 className="font-display text-xl font-extrabold uppercase">Summary</h2>
          <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); setApplied(code.trim().toUpperCase()); }}>
            <label className="sr-only" htmlFor="coupon">Coupon code</label>
            <input id="coupon" className="input !py-2.5" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn-secondary !px-4">Apply</button>
          </form>
          {quote?.couponError && <p role="alert" className="mt-2 text-sm text-bad">{quote.couponError}</p>}

          <fieldset className="mt-5"><legend className="label">Delivery estimate</legend>
            <select className="input !py-2.5" value={method} onChange={(e) => setMethod(e.target.value as DeliveryMethodId)}>
              {(quote?.deliveryOptions ?? [{ id: "collection", label: "Collect in store", feeCents: 0 }]).map((o) => (
                <option key={o.id} value={o.id}>{o.label} — {o.feeCents ? formatZAR(o.feeCents) : "Free"}</option>
              ))}
            </select>
          </fieldset>

          <div className={`mt-6 ${status === "loading" ? "opacity-50" : ""}`}>{quote && <Totals quote={quote} />}</div>
          <Link href="/checkout" aria-disabled={blocked} className={`btn-primary mt-6 w-full ${blocked ? "pointer-events-none opacity-40" : ""}`}>Checkout</Link>
          <Link href="/shop" className="btn-ghost mt-2 w-full">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
