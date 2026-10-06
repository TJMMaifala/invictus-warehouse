import type { OrderView } from "@/lib/orders";
import { ORDER_STATUS_LABEL } from "@/types";
import { formatZAR } from "@/lib/utils";

const FLOW = ["PAYMENT_CONFIRMED", "PROCESSING", "READY_FOR_COLLECTION", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export function OrderDetail({ o }: { o: OrderView }) {
  const collection = o.deliveryMethod === "collection";
  const steps = FLOW.filter((s) => (collection ? s !== "OUT_FOR_DELIVERY" : s !== "READY_FOR_COLLECTION"));
  const idx = steps.indexOf(o.status as (typeof FLOW)[number]);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="chip">{ORDER_STATUS_LABEL[o.status]}</span>
        <span className="chip">Payment: {o.paymentStatus.toLowerCase()}</span>
        <span className="text-sm text-mist">{new Date(o.createdAt).toLocaleDateString("en-ZA", { dateStyle: "long" })}</span>
      </div>
      {o.status !== "CANCELLED" && o.status !== "PENDING" && (
        <ol className="grid gap-3 sm:grid-cols-4" aria-label="Order progress">
          {steps.map((s, i) => (
            <li key={s} className={`border-t-4 pt-2 text-[12px] font-semibold uppercase tracking-wider ${i <= idx ? "border-ink" : "border-ink/15 text-mist"}`}>{ORDER_STATUS_LABEL[s]}</li>
          ))}
        </ol>
      )}
      <section>
        <h2 className="font-display text-lg font-extrabold uppercase">Items</h2>
        <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
          {o.items.map((i, k) => (
            <li key={k} className="flex justify-between gap-4 py-3 text-sm"><span><strong>{i.name}</strong>{i.variantLabel && i.variantLabel !== "Standard" ? ` · ${i.variantLabel}` : ""} × {i.quantity}</span><span>{formatZAR(i.unitPriceCents * i.quantity)}</span></li>
          ))}
        </ul>
        <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatZAR(o.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{o.deliveryCents ? formatZAR(o.deliveryCents) : "Free"}</dd></div>
          {o.discountCents > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>-{formatZAR(o.discountCents)}</dd></div>}
          <div className="flex justify-between border-t border-ink/15 pt-2 text-base font-bold"><dt>Total</dt><dd>{formatZAR(o.totalCents)}</dd></div>
        </dl>
      </section>
      <section>
        <h2 className="font-display text-lg font-extrabold uppercase">Delivery</h2>
        <p className="mt-2 text-sm">{collection ? "Collect in store" : o.address || "—"}</p>
      </section>
    </div>
  );
}
