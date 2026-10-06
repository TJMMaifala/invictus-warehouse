import Link from "next/link";
import { listAdminProducts } from "@/lib/data/admin";
import { ProductRowActions } from "@/components/admin/product-actions";
import { formatZAR } from "@/lib/utils";

export default async function AdminProducts() {
  const products = await listAdminProducts();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between"><h1 className="display-lg !text-4xl">Products</h1><Link href="/admin/products/new" className="btn-primary">New product</Link></div>
      <div className="overflow-x-auto rounded-[var(--radius-card)] bg-paper">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-ink/10 text-[11px] uppercase tracking-wider text-mist"><tr><th className="p-4">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th className="pr-4">Actions</th></tr></thead>
          <tbody>{products.map((p) => (
            <tr key={p.id} className="border-b border-ink/5 align-top">
              <td className="p-4"><Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>{p.featured && <span className="chip ml-2">Featured</span>}</td>
              <td className="capitalize">{p.category.replace("-", " ")}</td>
              <td>{p.sale_price_cents ? <><s className="text-mist">{formatZAR(p.price_cents)}</s> {formatZAR(p.sale_price_cents)}</> : formatZAR(p.price_cents)}</td>
              <td className={p.stock === 0 ? "text-bad" : ""}>{p.stock}</td>
              <td>{p.archived ? "Archived" : p.published ? "Published" : "Draft"}</td>
              <td className="py-4 pr-4"><ProductRowActions id={p.id} published={p.published} archived={p.archived} /></td>
            </tr>))}</tbody>
        </table>
        {products.length === 0 && <p className="p-8 text-center text-mist">No products yet.</p>}
      </div>
    </div>
  );
}
