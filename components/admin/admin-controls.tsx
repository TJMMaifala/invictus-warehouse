"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCoupon, moderateReview, saveCoupon, saveOptionSet, saveSettings, setOrderStatus, setStock } from "@/app/admin/actions";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/types";
import type { SiteSettings } from "@/types";

type R = { ok: boolean; error?: string };
function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<R>, okText = "Saved.") => start(async () => {
    const r = await fn(); setMsg(r.ok ? { ok: true, text: okText } : { ok: false, text: r.error ?? "Something went wrong." }); router.refresh();
  });
  return { pending, msg, run };
}
const Msg = ({ m }: { m: { ok: boolean; text: string } | null }) => m ? <p role="status" className={`text-sm ${m.ok ? "text-ok" : "text-bad"}`}>{m.text}</p> : null;

export function StockEditor({ variantId, quantity }: { variantId: string; quantity: number }) {
  const [q, setQ] = useState(String(quantity));
  const { pending, msg, run } = useRun();
  return (
    <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); run(() => setStock(variantId, Number(q))); }}>
      <input aria-label="Stock quantity" inputMode="numeric" className="input !w-20 !py-2" value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="btn-secondary !px-3 !py-2" disabled={pending || Number(q) === quantity}>Save</button>
      {msg && !msg.ok && <span className="text-xs text-bad">{msg.text}</span>}
    </form>
  );
}

export function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  const { pending, msg, run } = useRun();
  return (
    <div>
      <select aria-label="Order status" className="input !py-2" defaultValue={status} disabled={pending}
        onChange={(e) => run(() => setOrderStatus(id, e.target.value as OrderStatus), "Status updated.")}>
        {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
      </select>
      <Msg m={msg} />
    </div>
  );
}

export function ReviewActions({ id, approved }: { id: string; approved: boolean }) {
  const { pending, msg, run } = useRun();
  return (
    <div className={`flex gap-3 text-[13px] ${pending ? "opacity-50" : ""}`}>
      {approved ? <button className="underline" onClick={() => run(() => moderateReview(id, "reject"))}>Unpublish</button>
        : <button className="underline" onClick={() => run(() => moderateReview(id, "approve"))}>Approve</button>}
      <button className="text-bad underline" onClick={() => { if (confirm("Delete this review?")) run(() => moderateReview(id, "delete")); }}>Delete</button>
      <Msg m={msg} />
    </div>
  );
}

export function CouponForm() {
  const { pending, msg, run } = useRun();
  const [f, setF] = useState({ code: "", type: "percent" as "percent" | "fixed", value: "10", min: "0", maxUses: "", expires: "" });
  return (
    <form className="grid gap-3 md:grid-cols-6" onSubmit={(e) => { e.preventDefault();
      run(() => saveCoupon({ code: f.code, type: f.type, value: Number(f.value), minSubtotalRand: Number(f.min) || 0, maxUses: f.maxUses ? Number(f.maxUses) : null,
        expiresAt: f.expires ? new Date(f.expires).toISOString() : null, active: true }), "Coupon saved."); }}>
      <input required aria-label="Code" placeholder="CODE" className="input uppercase" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
      <select aria-label="Type" className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as "percent" | "fixed" })}><option value="percent">Percent %</option><option value="fixed">Fixed (R)</option></select>
      <input required aria-label="Value" inputMode="numeric" placeholder="Value" className="input" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
      <input aria-label="Minimum spend (R)" inputMode="numeric" placeholder="Min spend R" className="input" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} />
      <input aria-label="Max uses" inputMode="numeric" placeholder="Max uses" className="input" value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} />
      <input aria-label="Expires" type="date" className="input" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} />
      <div className="md:col-span-6 flex items-center gap-4"><button className="btn-primary" disabled={pending}>Save coupon</button><Msg m={msg} /></div>
    </form>
  );
}
export function CouponDelete({ code }: { code: string }) {
  const { pending, run } = useRun();
  return <button disabled={pending} className="text-bad underline" onClick={() => { if (confirm(`Delete ${code}?`)) run(() => deleteCoupon(code)); }}>Delete</button>;
}

export function SettingsForm({ s }: { s: SiteSettings }) {
  const { pending, msg, run } = useRun();
  const [f, setF] = useState({ ...s, ship: String(s.shippingFeeCents / 100), free: String(s.freeShippingThresholdCents / 100), local: String(s.localDeliveryFeeCents / 100) });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const T = ({ k, label, type = "text" }: { k: keyof typeof f; label: string; type?: string }) => (
    <div><label className="label" htmlFor={k}>{label}</label><input id={k} type={type} className="input" value={String(f[k])} onChange={(e) => set(k, e.target.value)} /></div>);
  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault();
      run(() => saveSettings({ businessName: f.businessName, email: f.email, phone: f.phone, whatsapp: f.whatsapp, address: f.address, instagram: f.instagram, tiktok: f.tiktok,
        currency: "ZAR", shippingFeeCents: Math.round(Number(f.ship) * 100), freeShippingThresholdCents: Math.round(Number(f.free) * 100),
        localDeliveryFeeCents: Math.round(Number(f.local) * 100), paymentProvider: f.paymentProvider, businessHours: f.businessHours }), "Settings saved."); }}>
      <div className="grid gap-4 md:grid-cols-2">
        <T k="businessName" label="Business name" /><T k="email" label="Email" type="email" /><T k="phone" label="Phone" />
        <T k="whatsapp" label="WhatsApp (digits, with country code e.g. 27821234567)" /><T k="address" label="Address" />
        <T k="instagram" label="Instagram URL" /><T k="tiktok" label="TikTok URL" />
        <T k="ship" label="Delivery fee (R)" /><T k="local" label="Local delivery fee (R)" /><T k="free" label="Free shipping threshold (R, 0 = off)" />
        <div><label className="label" htmlFor="pp">Payment provider</label>
          <select id="pp" className="input" value={f.paymentProvider} onChange={(e) => set("paymentProvider", e.target.value)}><option value="paystack">Paystack</option><option value="payfast" disabled>PayFast (not implemented yet)</option></select></div>
        <div><label className="label" htmlFor="cur">Currency</label><input id="cur" className="input" value="ZAR" disabled /></div>
      </div>
      <div><label className="label" htmlFor="bh">Business hours</label><textarea id="bh" rows={3} className="input" value={f.businessHours} onChange={(e) => set("businessHours", e.target.value)} /></div>
      <p className="text-sm text-mist">Logo: the wordmark is text-based; add a logo file to <code>/public</code> and swap it in <code>components/layout/header.tsx</code>.</p>
      <div className="flex items-center gap-4"><button className="btn-primary" disabled={pending}>Save settings</button><Msg m={msg} /></div>
    </form>
  );
}

export function SizeSetForm({ category, label, initial }: { category: string; label: string; initial: string[] }) {
  const { pending, msg, run } = useRun();
  const [v, setV] = useState(initial.join(", "));
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); run(() => saveOptionSet(category, "size", v.split(",")), "Sizes saved."); }}>
      <label className="label" htmlFor={`sz-${category}`}>{label} sizes (comma-separated)</label>
      <input id={`sz-${category}`} className="input" value={v} onChange={(e) => setV(e.target.value)} />
      <div className="flex items-center gap-4"><button className="btn-secondary" disabled={pending}>Save sizes</button><Msg m={msg} /></div>
    </form>
  );
}
