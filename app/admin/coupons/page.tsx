import { listCoupons } from "@/lib/data/admin";
import { CouponDelete, CouponForm } from "@/components/admin/admin-controls";
import { formatZAR } from "@/lib/utils";

export default async function AdminCoupons() {
  const coupons = await listCoupons();
  return (
    <div className="space-y-8">
      <h1 className="display-lg !text-4xl">Coupons</h1>
      <section className="rounded-[var(--radius-card)] bg-paper p-6"><h2 className="mb-4 font-display text-lg font-extrabold uppercase">New / update coupon</h2><CouponForm /></section>
      <div className="overflow-x-auto rounded-[var(--radius-card)] bg-paper">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ink/10 text-[11px] uppercase tracking-wider text-mist"><tr><th className="p-4">Code</th><th>Discount</th><th>Min spend</th><th>Used</th><th>Expires</th><th className="pr-4" /></tr></thead>
          <tbody>{coupons.map((c) => (
            <tr key={c.code} className="border-b border-ink/5">
              <td className="p-4 font-semibold">{c.code}</td><td>{c.type === "percent" ? `${c.value}%` : formatZAR(c.value)}</td>
              <td>{formatZAR(c.min_subtotal_cents)}</td><td>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
              <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-ZA") : "—"}</td><td className="pr-4"><CouponDelete code={c.code} /></td>
            </tr>))}</tbody>
        </table>
        {coupons.length === 0 && <p className="p-8 text-center text-mist">No coupons yet.</p>}
      </div>
    </div>
  );
}
