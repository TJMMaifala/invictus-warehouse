import { listOrders } from "@/lib/data/admin";
import { OrderStatusSelect } from "@/components/admin/admin-controls";
import { formatZAR } from "@/lib/utils";

export default async function AdminOrders() {
  const orders = await listOrders();
  return (
    <div>
      <h1 className="display-lg !text-4xl mb-6">Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <article key={o.id} className="rounded-[var(--radius-card)] bg-paper p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-extrabold">#{o.orderNumber}</h2>
                <p className="text-sm text-mist">{new Date(o.createdAt).toLocaleString("en-ZA")} · {o.paymentStatus}</p>
                <p className="mt-2 text-sm">{o.customer} · <a className="underline" href={`mailto:${o.email}`}>{o.email}</a> · {o.phone}</p>
                <p className="text-sm capitalize">{o.deliveryMethod}{o.address ? ` — ${o.address}` : ""}</p>
              </div>
              <div className="min-w-[220px] space-y-2 text-right"><p className="font-display text-xl font-black">{formatZAR(o.totalCents)}</p><OrderStatusSelect id={o.id} status={o.status} /></div>
            </div>
            <ul className="mt-3 border-t border-ink/10 pt-3 text-sm">{o.items.map((i, k) => <li key={k}>{i.qty} × {i.name}{i.variant ? ` (${i.variant})` : ""}</li>)}</ul>
          </article>))}
        {orders.length === 0 && <p className="rounded-[var(--radius-card)] bg-paper p-8 text-center text-mist">No orders yet.</p>}
      </div>
    </div>
  );
}
