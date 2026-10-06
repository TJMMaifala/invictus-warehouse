import "server-only";
import type { CategorySlug, Product, ProductImage, Variant } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  SEED_CATEGORIES, SEED_PRODUCTS, SNEAKER_SIZES, CLOTHING_SIZES, seedSlug, placeholderStock,
} from "./seed-catalogue";

export interface Category { slug: CategorySlug; name: string; description: string }

export interface ProductFilters {
  category?: string;
  q?: string;
  brand?: string[];
  size?: string[];
  condition?: "new" | "pre_owned";
  minPrice?: number; // rand
  maxPrice?: number; // rand
  availability?: "in_stock";
  colour?: string;
  sort?: "featured" | "newest" | "price_asc" | "price_desc";
}

/* ----------------------------- pricing helpers ---------------------------- */
export const effectivePrice = (p: Product) => p.salePriceCents ?? p.priceCents;
export const totalStock = (p: Product) => p.variants.reduce((n, v) => n + v.stock, 0);
export const discountPercent = (p: Product) =>
  p.salePriceCents ? Math.round((1 - p.salePriceCents / p.priceCents) * 100) : 0;

/* --------------------------------- DEMO mode ------------------------------ */
// Used ONLY when Supabase env vars are missing. Built from the seed catalogue.
function iphoneDemoImages(model: string): ProductImage[] {
  const cleanModel = model.trim();
  if (!cleanModel) return [];

  const imageModel = cleanModel;

  return [{
    url: `/images/iphones/${imageModel.replace(/ /g, "%20")}.jpg`,
    alt: `${cleanModel} product image`,
    source: "own",
  }];
}

function demoProducts(): Product[] {
  const now = new Date("2026-10-01T00:00:00Z").toISOString();
  return SEED_PRODUCTS.map((s, i): Product => {
    const slug = seedSlug(s);
    const sizes = s.category === "sneakers" ? SNEAKER_SIZES : s.category === "clothing" ? CLOTHING_SIZES : [undefined];
    const variants: Variant[] = sizes.map((size, si) => ({
      id: `demo-${slug}${size ? "-" + size.replace(/\s+/g, "").toLowerCase() : ""}`,
      size,
      stock: s.category === "iphones" ? (i % 3 === 0 ? 0 : 1 + (i % 2)) : placeholderStock(i, si),
    }));
    return {
      id: `demo-${slug}`, slug, name: s.name, category: s.category, brand: s.brand, model: s.model,
      colour: s.colour, condition: s.condition, priceCents: s.priceRand * 100, salePriceCents: null,
      featured: !!s.featured, published: true, images: s.category === "iphones" ? iphoneDemoImages(s.model) : [], variants,
      description:
        s.category === "iphones"
          ? `${s.condition === "pre_owned" ? "Pre-owned" : "Brand new"} ${s.model}. Storage, colour and battery health are confirmed with you before purchase.`
          : `${s.name}. Authentic product, sizes and availability updated live.`,
      attributes: s.category === "iphones" ? { warranty: "[WARRANTY TERMS — confirm with store]" } : {},
      createdAt: now, updatedAt: now,
    };
  });
}

/* ------------------------------- Supabase mode ---------------------------- */
interface ProductRow {
  id: string; slug: string; name: string; description: string | null; brand: string | null;
  model: string | null; colour: string | null; condition: "new" | "pre_owned";
  price_cents: number; sale_price_cents: number | null; featured: boolean; published: boolean;
  attributes: Product["attributes"] | null; created_at: string; updated_at: string;
  categories: { slug: CategorySlug } | null;
  product_images: { url: string; alt: string | null; source: "own" | "reference"; sort_order: number }[];
  product_variants: { id: string; size: string | null; colour: string | null; storage: string | null;
    inventory: { quantity: number } | { quantity: number }[] | null }[];
}

function mapRow(r: ProductRow): Product {
  const images: ProductImage[] = [...r.product_images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({ url: i.url, alt: i.alt ?? r.name, source: i.source }));
  const variants: Variant[] = r.product_variants.map((v) => {
    const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
    return { id: v.id, size: v.size ?? undefined, colour: v.colour ?? undefined,
      storage: v.storage ?? undefined, stock: inv?.quantity ?? 0 };
  });
  return {
    id: r.id, slug: r.slug, name: r.name, description: r.description ?? "",
    category: r.categories?.slug ?? "invictus-collection", brand: r.brand ?? "", model: r.model ?? "",
    colour: r.colour ?? undefined, condition: r.condition, priceCents: r.price_cents,
    salePriceCents: r.sale_price_cents, featured: r.featured, published: r.published,
    images, variants, attributes: r.attributes ?? {}, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

const SELECT = `id,slug,name,description,brand,model,colour,condition,price_cents,sale_price_cents,
  featured,published,attributes,created_at,updated_at,
  categories(slug),
  product_images(url,alt,source,sort_order),
  product_variants(id,size,colour,storage,inventory(quantity))`;

async function loadAll(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return demoProducts();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products").select(SELECT).eq("published", true).eq("archived", false);
  if (error) throw new Error(`Catalogue query failed: ${error.message}`);
  return (data as unknown as ProductRow[]).map(mapRow);
}

/* -------------------------------- public API ------------------------------ */
export async function getCategories(): Promise<Category[]> {
  return SEED_CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, description: c.description }));
}

export function applyFilters(all: Product[], f: ProductFilters): Product[] {
  let list = all;
  if (f.category) list = list.filter((p) => p.category === f.category);
  if (f.q) {
    const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter((p) => {
      const hay = `${p.name} ${p.brand} ${p.model} ${p.colour ?? ""} ${p.category}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  if (f.brand?.length) list = list.filter((p) => f.brand!.some((b) => b.toLowerCase() === p.brand.toLowerCase()));
  if (f.condition) list = list.filter((p) => p.condition === f.condition);
  if (f.colour) list = list.filter((p) => (p.colour ?? "").toLowerCase().includes(f.colour!.toLowerCase()));
  if (f.size?.length)
    list = list.filter((p) => p.variants.some((v) => v.stock > 0 && v.size && f.size!.includes(v.size.replace(/^UK\s*/, "")) ));
  if (f.minPrice != null) list = list.filter((p) => effectivePrice(p) >= f.minPrice! * 100);
  if (f.maxPrice != null) list = list.filter((p) => effectivePrice(p) <= f.maxPrice! * 100);
  if (f.availability === "in_stock") list = list.filter((p) => totalStock(p) > 0);

  const sorted = [...list];
  switch (f.sort) {
    case "price_asc": sorted.sort((a, b) => effectivePrice(a) - effectivePrice(b)); break;
    case "price_desc": sorted.sort((a, b) => effectivePrice(b) - effectivePrice(a)); break;
    case "newest": sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    default: sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
  return sorted;
}

export async function getProducts(f: ProductFilters = {}): Promise<Product[]> {
  return applyFilters(await loadAll(), f);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await loadAll()).find((p) => p.slug === slug) ?? null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const set = new Set(ids);
  return (await loadAll()).filter((p) => set.has(p.id));
}

export async function getRelated(p: Product, n = 4): Promise<Product[]> {
  return (await loadAll()).filter((x) => x.category === p.category && x.id !== p.id).slice(0, n);
}

export async function getFacets() {
  const all = await loadAll();
  const brands = [...new Set(all.map((p) => p.brand).filter(Boolean))].sort();
  const colours = [...new Set(all.map((p) => p.colour).filter((c): c is string => !!c))].sort();
  return { brands, colours };
}

export const isDemoMode = () => !isSupabaseConfigured();

export async function getVariantIndex(): Promise<Map<string, { product: Product; variant: Variant }>> {
  const m = new Map<string, { product: Product; variant: Variant }>();
  for (const product of await loadAll()) for (const variant of product.variants) m.set(variant.id, { product, variant });
  return m;
}
