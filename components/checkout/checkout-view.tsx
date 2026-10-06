"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useQuote } from "@/hooks/use-quote";
import { Totals } from "@/components/cart/order-summary";
import { cn, formatZAR } from "@/lib/utils";
import type { DeliveryMethodId } from "@/types";

export interface CheckoutDefaults {
  email?: string; firstName?: string; lastName?: string; phone?: string;
  address?: { line?: string; suburb?: string; city?: string; province?: string; postalCode?: string };
}
const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"];
const STEPS = ["Cart", "Information", "Delivery", "Payment", "Confirmation"];

export function CheckoutView({ defaults, paymentFailed, demo }: { defaults: CheckoutDefaults; paymentFailed: boolean; demo: boolean }) {
  const cart = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [c, setC] = useState({ firstName: defaults.firstName ?? "", lastName: defaults.lastName ?? "", email: defaults.email ?? "", phone: defaults.phone ?? "" });
  const [a, setA] = useState({ line: defaults.address?.line ?? "", suburb: defaults.address?.suburb ?? "", city: defaults.address?.city ?? "", province: defaults.address?.province ?? "", postalCode: defaults.address?.postalCode ?? "" });
  const [method, setMethod] = useState<DeliveryMethodId>("collection");
  const [coupon, setCoupon] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [fail, setFail] = useState<string>(paymentFailed ? "Your payment wasn’t completed, so you haven’t been charged. You can try again below." : "");
  const { status, quote, refresh } = useQuote(cart.lines, method, coupon, cart.hydrated);

  if (!cart.hydrated) return <div className="container-x py-24" aria-busy="true"><div className="h-8 w-48 animate-pulse rounded bg-stone" /></div>;
  if (cart.lines.length === 0)
    return (
      <div className="container-x grid place-items-center py-28 text-center"><div>
        <h1 className="display-lg">Your cart<br />is waiting.</h1><p className="mt-4 text-mist">Discover something worth adding.</p>
        <Link href="/shop" className="btn-primary mt-8">Shop now</Link></div></div>
    );

  const needsAddress = quote?.deliveryOptions.find((o) => o.id === method)?.requiresAddress ?? false;

  function validateInfo() {
    const e: Record<string, string> = {};
    if (!c.firstName.trim()) e.firstName = "Enter your first name";
    if (!c.lastName.trim()) e.lastName = "Enter your last name";
    if (!/^\S+@\S+\.\S+$/.test(c.email)) e.email = "Enter a valid email address";
    if (!/^[+\d][\d\s()-]{7,19}$/.test(c.phone)) e.phone = "Enter a valid phone number";
    setErrors(e); return Object.keys(e).length === 0;
  }
  function validateDelivery() {
    const e: Record<string, string> = {};
    if (needsAddress) {
      if (!a.line.trim()) e.line = "Enter your street address";
      if (!a.city.trim()) e.city = "Enter your city";
      if (!a.province) e.province = "Select your province";
      if (!/^\d{4}$/.test(a.postalCode)) e.postalCode = "Enter a 4-digit postal code";
    }
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function pay() {
    if (!quote) return;
    setSubmitting(true); setFail("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), method, coupon: coupon || undefined,
          customer: c, address: needsAddress ? a : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.redirectUrl) { window.location.href = data.redirectUrl; return; }
      if (data.error === "cart_changed") { setFail("Stock or prices changed while you were checking out. Please review your updated order and try again."); refresh(); }
      else if (data.error === "not_configured" || data.error === "payments_not_configured") setFail("Online payment isn’t available yet. Please contact us on WhatsApp to place your order.");
      else if (data.error === "coupon") setFail(data.message);
      else if (data.error === "invalid") { setFail("Some details look incorrect. Please check the form."); setStep(1); }
      else if (res.status === 429) setFail("Too many attempts. Please wait a minute and try again.");
      else setFail("We couldn’t start your payment. You haven’t been charged. Please try again.");
    } catch { setFail("Network error. Please check your connection and try again."); }
    finally { setSubmitting(false); }
  }

  const Field = ({ id, label, error, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) => (
    <div><label htmlFor={id} className="label">{label}</label>
      <input id={id} className={cn("input", error && "!border-bad")} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} {...p} />
      {error && <p id={`${id}-e`} role="alert" className="mt-1 text-[13px] text-bad">{error}</p>}</div>
  );

  const current = step + 1; // index into STEPS (Cart = 0 done)
  return (
    <div className="container-x py-10 md:py-16">
      <ol aria-label="Checkout progress" className="mb-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === current ? "step" : undefined} className={cn("flex items-center gap-2", i > current && "text-mist")}>
            <span className={cn("grid size-5 place-items-center rounded-full border text-[10px]", i < current ? "border-ink bg-ink text-paper" : i === current ? "border-ink" : "border-ink/25")}>{i < current ? <Check className="size-3" /> : i + 1}</span>
            {s}{i < STEPS.length - 1 && <span className="mx-1 hidden text-mist sm:inline">—</span>}
          </li>
        ))}
      </ol>

      {demo && <p role="status" className="mb-6 rounded-lg bg-paper p-4 text-sm">Demo mode: payment is disabled until Supabase and Paystack are configured.</p>}
      {fail && <p role="alert" className="mb-6 flex items-start gap-2 rounded-lg border border-bad/30 bg-paper p-4 text-sm"><AlertCircle className="mt-0.5 size-4 shrink-0 text-bad" /> {fail}</p>}
      {quote?.issues.map((i) => <p key={i} role="status" className="mb-3 rounded-lg bg-paper p-4 text-sm">{i}</p>)}

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          {step === 1 && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); if (validateInfo()) setStep(2); }} className="space-y-5">
              <h1 className="display-lg !text-3xl">Your details</h1>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="fn" label="First name" autoComplete="given-name" value={c.firstName} onChange={(e) => setC({ ...c, firstName: e.target.value })} error={errors.firstName} />
                <Field id="ln" label="Last name" autoComplete="family-name" value={c.lastName} onChange={(e) => setC({ ...c, lastName: e.target.value })} error={errors.lastName} />
              </div>
              <Field id="em" type="email" inputMode="email" label="Email" autoComplete="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} error={errors.email} />
              <Field id="ph" type="tel" inputMode="tel" label="Phone number" autoComplete="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} error={errors.phone} />
              <p className="text-sm text-mist">Checking out as a guest. <Link href="/login?next=/checkout" className="underline">Sign in</Link> to save your details.</p>
              <button className="btn-primary w-full sm:w-auto">Continue to delivery</button>
            </form>
          )}

          {step === 2 && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); if (validateDelivery()) setStep(3); }} className="space-y-5">
              <h1 className="display-lg !text-3xl">Delivery</h1>
              <div role="radiogroup" aria-label="Delivery method" className="grid gap-3">
                {(quote?.deliveryOptions ?? []).map((o) => (
                  <label key={o.id} className={cn("flex cursor-pointer items-start justify-between gap-4 rounded-xl border-2 p-4", method === o.id ? "border-ink bg-paper" : "border-ink/15")}>
                    <span className="flex items-start gap-3"><input type="radio" name="method" className="mt-1 accent-black" checked={method === o.id} onChange={() => setMethod(o.id)} />
                      <span><span className="block font-semibold">{o.label}</span>{o.note && <span className="text-[13px] text-mist">{o.note}</span>}</span></span>
                    <span className="font-semibold">{o.feeCents ? formatZAR(o.feeCents) : "Free"}</span>
                  </label>
                ))}
              </div>
              {needsAddress && (
                <div className="space-y-4">
                  <Field id="ad" label="Street address" autoComplete="address-line1" value={a.line} onChange={(e) => setA({ ...a, line: e.target.value })} error={errors.line} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="su" label="Suburb" autoComplete="address-level3" value={a.suburb} onChange={(e) => setA({ ...a, suburb: e.target.value })} />
                    <Field id="ci" label="City" autoComplete="address-level2" value={a.city} onChange={(e) => setA({ ...a, city: e.target.value })} error={errors.city} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label htmlFor="pr" className="label">Province</label>
                      <select id="pr" className={cn("input", errors.province && "!border-bad")} value={a.province} onChange={(e) => setA({ ...a, province: e.target.value })}>
                        <option value="">Select…</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
                      {errors.province && <p role="alert" className="mt-1 text-[13px] text-bad">{errors.province}</p>}</div>
                    <Field id="pc" label="Postal code" inputMode="numeric" maxLength={4} autoComplete="postal-code" value={a.postalCode} onChange={(e) => setA({ ...a, postalCode: e.target.value.replace(/\D/g, "") })} error={errors.postalCode} />
                  </div>
                </div>
              )}
              <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="btn-secondary">Back</button><button className="btn-primary">Continue to payment</button></div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h1 className="display-lg !text-3xl">Review &amp; pay</h1>
              <div className="rounded-xl bg-paper p-5 text-sm leading-relaxed">
                <p className="font-semibold">{c.firstName} {c.lastName}</p><p>{c.email} · {c.phone}</p>
                <p className="mt-2 text-mist">{needsAddress ? [a.line, a.suburb, a.city, a.province, a.postalCode].filter(Boolean).join(", ") : "Collect in store"}</p>
                <button onClick={() => setStep(1)} className="mt-2 underline">Edit</button>
              </div>
              <div>
                <label htmlFor="cc" className="label">Coupon code</label>
                <input id="cc" className="input max-w-xs" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Optional" />
                {quote?.couponError && <p role="alert" className="mt-1 text-sm text-bad">{quote.couponError}</p>}
              </div>
              <p className="text-[13px] text-mist">You’ll be taken to our secure payment partner to pay by card or EFT. Invictus never sees or stores your card details.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary">Back</button>
                <button onClick={pay} disabled={submitting || status === "loading" || !quote || quote.lines.length === 0 || !!quote.couponError || demo} className="btn-primary flex-1 sm:flex-none">
                  {submitting ? "Redirecting…" : `Pay ${quote ? formatZAR(quote.totalCents) : ""}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-[var(--radius-card)] bg-paper p-6 lg:sticky lg:top-24" aria-label="Order summary">
          <h2 className="font-display text-xl font-extrabold uppercase">Order summary</h2>
          <ul className="mt-4 divide-y divide-ink/10">
            {cart.lines.map((l) => (
              <li key={l.variantId} className="flex justify-between gap-3 py-3 text-sm">
                <span><span className="font-semibold">{l.name}</span><br /><span className="text-mist">{l.variantLabel} × {l.quantity}</span></span>
                <span className="font-semibold">{formatZAR((quote?.lines.find((q) => q.variantId === l.variantId)?.unitPriceCents ?? l.priceCents) * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className={cn("mt-4", status === "loading" && "opacity-50")}>{quote && <Totals quote={quote} />}</div>
          {status === "error" && <p role="alert" className="mt-3 text-sm text-bad">Couldn’t refresh prices. Check your connection.</p>}
        </aside>
      </div>
    </div>
  );
}
