import { dashboardStats } from "@/lib/data/admin";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { formatZAR } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const s = await dashboardStats();
  const kpis = [["Revenue (30d)", formatZAR(s.revenue)], ["Paid orders (30d)", String(s.paidOrders)], ["Products", String(s.products)], ["Low stock", String(s.lowStock)], ["Customers", String(s.customers)]];
  const maxBest = Math.max(1, ...s.best.map((b) => b.qty));
  return (
    <div className="space-y-10">
      <h1 className="display-lg !text-4xl">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpis.map(([k, v]) => (
          <div key={k} className="rounded-[var(--radius-card)] bg-paper p-5"><p className="eyebrow">{k}</p><p className="mt-2 font-display text-2xl font-black">{v}</p></div>
        ))}
      </div>
      {s.lowStock > 0 && <p className="rounded-lg bg-paper p-4 text-sm"><strong>{s.lowStock}</strong> variants are at or below their low-stock threshold. <Link href="/admin/inventory" className="underline">Review inventory</Link></p>}
      <section className="rounded-[var(--radius-card)] bg-paper p-6"><h2 className="font-display text-lg font-extrabold uppercase">Sales over time</h2><div className="mt-4"><RevenueChart days={s.days} /></div></section>
      <section className="rounded-[var(--radius-card)] bg-paper p-6"><h2 className="font-display text-lg font-extrabold uppercase">Best-selling products</h2>
        {s.best.length === 0 ? <p className="mt-3 text-mist">No paid orders yet.</p> : (
          <ul className="mt-4 space-y-3">{s.best.map((b) => (
            <li key={b.name} className="text-sm"><div className="flex justify-between"><span>{b.name}</span><span className="font-semibold">{b.qty} sold</span></div>
              <div className="mt-1 h-2 rounded bg-stone/60"><div className="h-2 rounded bg-ink" style={{ width: `${(b.qty / maxBest) * 100}%` }} /></div></li>))}</ul>
        )}
      </section>
    </div>
  );
}
