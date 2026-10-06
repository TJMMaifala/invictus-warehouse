import { listInventory } from "@/lib/data/admin";
import { StockEditor } from "@/components/admin/admin-controls";

export default async function AdminInventory() {
  const rows = await listInventory();
  return (
    <div>
      <h1 className="display-lg !text-4xl mb-2">Inventory</h1>
      <p className="mb-6 text-sm text-mist">Lowest stock first. Stock is deducted automatically after payment is verified.</p>
      <div className="overflow-x-auto rounded-[var(--radius-card)] bg-paper">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ink/10 text-[11px] uppercase tracking-wider text-mist"><tr><th className="p-4">Product</th><th>Variant</th><th>Status</th><th className="pr-4">Quantity</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.variantId} className="border-b border-ink/5">
              <td className="p-4 font-semibold">{r.product}</td><td>{r.label}</td>
              <td className={r.quantity === 0 ? "text-bad" : r.quantity <= r.threshold ? "text-warn" : "text-ok"}>{r.quantity === 0 ? "Out of stock" : r.quantity <= r.threshold ? "Low" : "In stock"}</td>
              <td className="py-3 pr-4"><StockEditor variantId={r.variantId} quantity={r.quantity} /></td>
            </tr>))}</tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-mist">No variants yet.</p>}
      </div>
    </div>
  );
}
