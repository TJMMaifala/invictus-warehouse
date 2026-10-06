import "server-only";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export interface AdminProductRow {
  id: string; slug: string; name: string; category: string; brand: string | null; condition: "new" | "pre_owned";
  price_cents: number; sale_price_cents: number | null; featured: boolean; published: boolean; archived: boolean; stock: number;
}

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  await requireAdmin();
  const { data } = await (await createClient()).from("products")
    .select("id,slug,name,brand,condition,price_cents,sale_price_cents,featured,published,archived,categories(slug),product_variants(inventory(quantity))")
    .order("created_at", { ascending: false });
  return (data ?? []).map((p) => {
    const cat = p.categories as unknown as { slug: string } | null;
    const variants = (p.product_variants ?? []) as unknown as { inventory: { quantity: number } | { quantity: number }[] | null }[];
    const stock = variants.reduce((n, v) => n + ((Array.isArray(v.inventory) ? v.inventory[0]?.quantity : v.inventory?.quantity) ?? 0), 0);
    return { id: p.id, slug: p.slug, name: p.name, category: cat?.slug ?? "", brand: p.brand, condition: p.condition, price_cents: p.price_cents,
      sale_price_cents: p.sale_price_cents, featured: p.featured, published: p.published, archived: p.archived, stock };
  });
}

export async function getAdminProduct(id: string) {
  await requireAdmin();
  const { data } = await (await createClient()).from("products")
    .select("*, categories(slug), product_images(url,alt,source,sort_order), product_variants(id,size,colour,storage,inventory(quantity))").eq("id", id).maybeSingle();
  return data;
}

export async function getSizeSets() {
  const { data } = await (await createClient()).from("option_sets").select("name,values,categories(slug)").eq("name", "size");
  const out: Record<string, string[]> = {};
  for (const r of data ?? []) { const c = r.categories as unknown as { slug: string } | null; if (c) out[c.slug] = r.values as string[]; }
  return out;
}

export async function dashboardStats() {
  await requireAdmin();
  const supabase = await createClient();
  const since = new Date(Date.now() - 29 * 86400_000); since.setHours(0, 0, 0, 0);
  const [orders, products, customers, inv, items] = await Promise.all([
    supabase.from("orders").select("created_at,total_cents,payment_status,status").gte("created_at", since.toISOString()),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("archived", false),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("inventory").select("quantity,low_stock_threshold"),
    supabase.from("order_items").select("name,quantity,orders!inner(payment_status)").eq("orders.payment_status", "PAID").limit(2000),
  ]);
  const days: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 0; i < 30; i++) { const d = new Date(since.getTime() + i * 86400_000); days.push({ date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 }); }
  let revenue = 0, paidOrders = 0;
  for (const o of orders.data ?? []) {
    if (o.payment_status !== "PAID") continue;
    const day = days.find((d) => d.date === String(o.created_at).slice(0, 10));
    if (day) { day.revenue += o.total_cents; day.orders += 1; }
    revenue += o.total_cents; paidOrders += 1;
  }
  const best = new Map<string, number>();
  for (const i of items.data ?? []) best.set(i.name as string, (best.get(i.name as string) ?? 0) + (i.quantity as number));
  return {
    revenue, paidOrders, products: products.count ?? 0, customers: customers.count ?? 0,
    lowStock: (inv.data ?? []).filter((r) => r.quantity <= r.low_stock_threshold).length, days,
    best: [...best.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, qty]) => ({ name, qty })),
  };
}

export interface InventoryRow { variantId: string; product: string; label: string; quantity: number; threshold: number }
export async function listInventory(): Promise<InventoryRow[]> {
  await requireAdmin();
  const { data } = await (await createClient()).from("product_variants")
    .select("id,size,colour,storage,products(name),inventory(quantity,low_stock_threshold)").limit(2000);
  return (data ?? []).map((v) => {
    const p = v.products as unknown as { name: string } | null;
    const inv = (Array.isArray(v.inventory) ? v.inventory[0] : v.inventory) as { quantity: number; low_stock_threshold: number } | null;
    return { variantId: v.id as string, product: p?.name ?? "Unknown", label: [v.size, v.colour, v.storage].filter(Boolean).join(" · ") || "Default",
      quantity: inv?.quantity ?? 0, threshold: inv?.low_stock_threshold ?? 2 };
  }).sort((a, b) => a.quantity - b.quantity || a.product.localeCompare(b.product));
}

export interface AdminOrder {
  id: string; orderNumber: string; createdAt: string; customer: string; email: string; phone: string; status: string; paymentStatus: string;
  deliveryMethod: string; address: string; totalCents: number; items: { name: string; variant: string | null; qty: number }[];
}
export async function listOrders(): Promise<AdminOrder[]> {
  await requireAdmin();
  const { data } = await (await createClient()).from("orders")
    .select("id,order_number,created_at,first_name,last_name,email,phone,status,payment_status,delivery_method,address_line,suburb,city,province,postal_code,total_cents,order_items(name,variant_label,quantity)")
    .order("created_at", { ascending: false }).limit(200);
  return (data ?? []).map((o) => ({
    id: o.id as string, orderNumber: o.order_number as string, createdAt: o.created_at as string, customer: `${o.first_name} ${o.last_name}`, email: o.email as string,
    phone: o.phone as string, status: o.status as string, paymentStatus: o.payment_status as string, deliveryMethod: o.delivery_method as string,
    address: [o.address_line, o.suburb, o.city, o.province, o.postal_code].filter(Boolean).join(", "), totalCents: o.total_cents as number,
    items: ((o.order_items ?? []) as unknown as { name: string; variant_label: string | null; quantity: number }[]).map((i) => ({ name: i.name, variant: i.variant_label, qty: i.quantity })),
  }));
}

export interface AdminReview { id: string; product: string; rating: number; body: string | null; verified: boolean; approved: boolean; createdAt: string }
export async function listAdminReviews(): Promise<AdminReview[]> {
  await requireAdmin();
  const { data } = await (await createClient()).from("reviews").select("id,rating,body,verified_purchase,approved,created_at,products(name)").order("created_at", { ascending: false }).limit(200);
  return (data ?? []).map((r) => ({ id: r.id as string, product: (r.products as unknown as { name: string } | null)?.name ?? "Deleted product", rating: r.rating as number,
    body: r.body as string | null, verified: r.verified_purchase as boolean, approved: r.approved as boolean, createdAt: r.created_at as string }));
}

export interface AdminCoupon { code: string; type: "percent" | "fixed"; value: number; min_subtotal_cents: number; max_uses: number | null; used_count: number; expires_at: string | null; active: boolean }
export async function listCoupons(): Promise<AdminCoupon[]> {
  await requireAdmin();
  const { data } = await (await createClient()).from("coupons").select("code,type,value,min_subtotal_cents,max_uses,used_count,expires_at,active").order("code");
  return (data ?? []) as AdminCoupon[];
}
