"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/data/seed-catalogue";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
// All admin writes run with the ADMIN'S OWN session, so Postgres RLS (is_admin()) is a second line of defence.
async function db() { await requireAdmin(); return createClient(); }
function refresh() { ["/", "/shop", "/admin"].forEach((p) => revalidatePath(p)); revalidatePath("/product/[slug]", "page"); revalidatePath("/shop/[category]", "page"); }

/* -------------------------------- products -------------------------------- */
const variantSchema = z.object({
  id: z.string().uuid().optional(), size: z.string().trim().max(20).optional().nullable(),
  colour: z.string().trim().max(40).optional().nullable(), storage: z.string().trim().max(20).optional().nullable(),
  stock: z.number().int().min(0).max(100000),
});
const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160), slug: z.string().trim().max(160).optional(),
  description: z.string().trim().max(5000).default(""), categorySlug: z.enum(["sneakers", "iphones", "clothing", "invictus-collection"]),
  brand: z.string().trim().max(60).default(""), model: z.string().trim().max(80).default(""), colour: z.string().trim().max(60).default(""),
  condition: z.enum(["new", "pre_owned"]), priceRand: z.number().min(0).max(1_000_000), salePriceRand: z.number().min(0).max(1_000_000).nullable(),
  featured: z.boolean(), published: z.boolean(), archived: z.boolean(),
  attributes: z.object({ storage: z.string().max(40).optional(), batteryHealth: z.string().max(40).optional(), warranty: z.string().max(300).optional(), grade: z.string().max(80).optional(), fit: z.string().max(80).optional() }),
  images: z.array(z.object({ url: z.string().url().max(1000), alt: z.string().max(200).default(""), source: z.enum(["own", "reference"]) })).max(12),
  variants: z.array(variantSchema).max(60),
});
export type ProductInput = z.infer<typeof productSchema>;

export async function saveProduct(raw: ProductInput): Promise<Result<{ id: string }>> {
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ? `Check the form: ${parsed.error.issues[0].path.join(".")} — ${parsed.error.issues[0].message}` : "Invalid product data.");
  const p = parsed.data;
  if (p.salePriceRand != null && p.salePriceRand >= p.priceRand) return fail("Sale price must be lower than the regular price.");
  const supabase = await db();
  const { data: cat } = await supabase.from("categories").select("id").eq("slug", p.categorySlug).single();
  if (!cat) return fail("Category not found.");

  const row = {
    name: p.name, slug: slugify(p.slug || p.name), description: p.description, category_id: cat.id, brand: p.brand || null, model: p.model || null,
    colour: p.colour || null, condition: p.condition, price_cents: Math.round(p.priceRand * 100),
    sale_price_cents: p.salePriceRand != null ? Math.round(p.salePriceRand * 100) : null,
    featured: p.featured, published: p.published, archived: p.archived, attributes: p.attributes,
  };
  let id = p.id;
  if (id) { const { error } = await supabase.from("products").update(row).eq("id", id); if (error) return fail(error.code === "23505" ? "That URL slug is already in use." : "Couldn’t save the product."); }
  else { const { data, error } = await supabase.from("products").insert(row).select("id").single(); if (error || !data) return fail(error?.code === "23505" ? "That URL slug is already in use." : "Couldn’t create the product."); id = data.id as string; }

  // images: replace set
  await supabase.from("product_images").delete().eq("product_id", id);
  if (p.images.length) await supabase.from("product_images").insert(p.images.map((i, k) => ({ product_id: id, url: i.url, alt: i.alt || p.name, source: i.source, sort_order: k })));

  // variants: sync (update existing, insert new, delete removed) + inventory
  const { data: existing } = await supabase.from("product_variants").select("id").eq("product_id", id);
  const keep = new Set(p.variants.filter((v) => v.id).map((v) => v.id!));
  const drop = (existing ?? []).map((v) => v.id as string).filter((x) => !keep.has(x));
  if (drop.length) await supabase.from("product_variants").delete().in("id", drop);
  for (const v of p.variants) {
    const vr = { product_id: id, size: v.size || null, colour: v.colour || null, storage: v.storage || null };
    let vid = v.id;
    if (vid) await supabase.from("product_variants").update(vr).eq("id", vid);
    else { const { data } = await supabase.from("product_variants").insert(vr).select("id").single(); vid = data?.id as string | undefined; }
    if (vid) await supabase.from("inventory").upsert({ variant_id: vid, quantity: v.stock });
  }
  refresh();
  return { ok: true, id: id! };
}

export async function setProductFlags(id: string, flags: { published?: boolean; archived?: boolean; featured?: boolean }): Promise<Result> {
  z.string().uuid().parse(id);
  const { error } = await (await db()).from("products").update(flags).eq("id", id);
  if (error) return fail("Couldn’t update the product."); refresh(); return { ok: true };
}
export async function deleteProduct(id: string): Promise<Result> {
  z.string().uuid().parse(id);
  const { error } = await (await db()).from("products").delete().eq("id", id);
  if (error) return fail("Couldn’t delete the product."); refresh(); return { ok: true };
}
export async function setStock(variantId: string, quantity: number): Promise<Result> {
  const v = z.object({ id: z.string().uuid(), q: z.number().int().min(0).max(100000) }).safeParse({ id: variantId, q: quantity });
  if (!v.success) return fail("Enter a whole number of 0 or more.");
  const { error } = await (await db()).from("inventory").upsert({ variant_id: v.data.id, quantity: v.data.q });
  if (error) return fail("Couldn’t update stock."); refresh(); return { ok: true };
}

/* --------------------------------- orders --------------------------------- */
const STATUSES = ["PENDING", "PAYMENT_CONFIRMED", "PROCESSING", "READY_FOR_COLLECTION", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;
export async function setOrderStatus(orderId: string, status: (typeof STATUSES)[number]): Promise<Result> {
  const v = z.object({ id: z.string().uuid(), s: z.enum(STATUSES) }).safeParse({ id: orderId, s: status });
  if (!v.success) return fail("Invalid status.");
  const { error } = await (await db()).from("orders").update({ status: v.data.s }).eq("id", v.data.id);
  if (error) return fail("Couldn’t update the order.");
  // TODO(notifications): email / WhatsApp the customer on status change (lib/notifications.ts)
  revalidatePath("/admin/orders"); return { ok: true };
}

/* --------------------------------- reviews -------------------------------- */
export async function moderateReview(id: string, action: "approve" | "reject" | "delete"): Promise<Result> {
  z.string().uuid().parse(id);
  const supabase = await db();
  const { error } = action === "delete" ? await supabase.from("reviews").delete().eq("id", id) : await supabase.from("reviews").update({ approved: action === "approve" }).eq("id", id);
  if (error) return fail("Couldn’t update the review."); revalidatePath("/admin/reviews"); revalidatePath("/product/[slug]", "page"); return { ok: true };
}

/* --------------------------------- coupons -------------------------------- */
const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/), type: z.enum(["percent", "fixed"]), value: z.number().int().min(1),
  minSubtotalRand: z.number().min(0).default(0), maxUses: z.number().int().min(1).nullable(), expiresAt: z.string().nullable(), active: z.boolean(),
}).refine((c) => c.type === "fixed" || c.value <= 100, { message: "Percent must be 1–100" });
export async function saveCoupon(raw: z.input<typeof couponSchema>): Promise<Result> {
  const p = couponSchema.safeParse(raw);
  if (!p.success) return fail("Check the coupon: code (3–30 letters/numbers), value and limits.");
  const c = p.data;
  const { error } = await (await db()).from("coupons").upsert({
    code: c.code, type: c.type, value: c.type === "fixed" ? c.value * 100 : c.value, min_subtotal_cents: Math.round(c.minSubtotalRand * 100),
    max_uses: c.maxUses, expires_at: c.expiresAt || null, active: c.active }, { onConflict: "code" });
  if (error) return fail("Couldn’t save the coupon."); revalidatePath("/admin/coupons"); return { ok: true };
}
export async function deleteCoupon(code: string): Promise<Result> {
  const { error } = await (await db()).from("coupons").delete().eq("code", z.string().max(40).parse(code));
  if (error) return fail("Couldn’t delete the coupon."); revalidatePath("/admin/coupons"); return { ok: true };
}

/* -------------------------------- settings -------------------------------- */
const settingsSchema = z.object({
  businessName: z.string().trim().min(1).max(80), email: z.string().trim().max(254), phone: z.string().trim().max(40),
  whatsapp: z.string().trim().regex(/^\+?\d{0,15}$/, "WhatsApp number: digits only, with country code, e.g. 27821234567").or(z.literal("")),
  address: z.string().trim().max(300), instagram: z.string().trim().url().or(z.literal("")), tiktok: z.string().trim().url().or(z.literal("")),
  currency: z.literal("ZAR"), shippingFeeCents: z.number().int().min(0), freeShippingThresholdCents: z.number().int().min(0), localDeliveryFeeCents: z.number().int().min(0),
  paymentProvider: z.enum(["paystack", "payfast"]), businessHours: z.string().trim().max(500),
});
export async function saveSettings(raw: z.input<typeof settingsSchema>): Promise<Result> {
  const p = settingsSchema.safeParse(raw);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Check the settings form.");
  const { error } = await (await db()).from("settings").upsert({ key: "site", value: p.data });
  if (error) return fail("Couldn’t save settings."); revalidatePath("/", "layout"); return { ok: true };
}
export async function saveOptionSet(categorySlug: string, name: "size", values: string[]): Promise<Result> {
  const clean = [...new Set(values.map((v) => v.trim()).filter(Boolean))].slice(0, 40);
  const supabase = await db();
  const { data: cat } = await supabase.from("categories").select("id").eq("slug", categorySlug).single();
  if (!cat) return fail("Category not found.");
  const { error } = await supabase.from("option_sets").upsert({ category_id: cat.id, name, values: clean }, { onConflict: "category_id,name" });
  if (error) return fail("Couldn’t save sizes."); revalidatePath("/admin/settings"); return { ok: true };
}
