import Link from "next/link";
import { Suspense } from "react";
import { getFacets, getProducts, type ProductFilters } from "@/lib/data/catalogue";
import { ProductGrid } from "@/components/products/product-card";
import { FilterPanel } from "./filter-panel";
import { SNEAKER_SIZES, CLOTHING_SIZES } from "@/lib/data/seed-catalogue";

export type RawParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const many = (v: string | string[] | undefined) => (one(v) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const num = (v: string | string[] | undefined) => { const n = Number(one(v)); return Number.isFinite(n) && one(v) ? n : undefined; };

export function parseFilters(category: string | undefined, sp: RawParams): ProductFilters {
  const sort = one(sp.sort);
  const cond = one(sp.condition);
  return {
    category: category ?? one(sp.category),
    q: one(sp.q)?.slice(0, 80),
    brand: many(sp.brand), size: many(sp.size), colour: one(sp.colour),
    condition: cond === "new" || cond === "pre_owned" ? cond : undefined,
    minPrice: num(sp.min), maxPrice: num(sp.max),
    availability: one(sp.stock) === "1" ? "in_stock" : undefined,
    sort: sort === "newest" || sort === "price_asc" || sort === "price_desc" ? sort : "featured",
  };
}

const TITLES: Record<string, string> = { sneakers: "Sneakers", iphones: "iPhones", clothing: "Clothing", "invictus-collection": "Invictus Collection" };

export async function ShopView({ category, searchParams }: { category?: string; searchParams: RawParams }) {
  const filters = parseFilters(category, searchParams);
  const [products, facets] = await Promise.all([getProducts(filters), getFacets()]);
  const cat = filters.category;
  const sizeOptions = cat === "sneakers" ? SNEAKER_SIZES.map((s) => s.replace("UK ", "")) : cat === "clothing" ? CLOTHING_SIZES : [];
  const title = filters.q ? `Results for “${filters.q}”` : cat ? TITLES[cat] ?? "Shop" : "Shop all";

  return (
    <div className="container-x py-10 md:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-mist">
        <Link href="/" className="hover:text-ink">Home</Link> / <Link href="/shop" className="hover:text-ink">Shop</Link>{cat && <> / <span className="text-ink">{TITLES[cat]}</span></>}
      </nav>
      <div className="mb-8 flex items-end justify-between gap-4">
        <h1 className="display-lg">{title}</h1>
        <p className="text-sm text-mist" aria-live="polite">{products.length} {products.length === 1 ? "product" : "products"}</p>
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {[["All", "/shop"], ...Object.entries(TITLES).map(([s, n]) => [n, `/shop/${s}`])].map(([n, h]) => (
          <Link key={h} href={h} className={`chip shrink-0 !px-4 !py-2 ${(cat ? h === `/shop/${cat}` : h === "/shop") ? "border-ink bg-ink text-paper" : "hover:border-ink"}`}>{n}</Link>
        ))}
      </div>
      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={null}>
          <FilterPanel brands={facets.brands} colours={facets.colours} sizeOptions={sizeOptions} showCondition={!cat || cat === "iphones"} />
        </Suspense>
        <div>
          {products.length === 0 ? (
            <div className="grid place-items-center rounded-[var(--radius-card)] bg-stone/50 px-6 py-24 text-center">
              <div>
                <p className="font-display text-3xl font-black uppercase leading-none">Nothing found.</p>
                <p className="mx-auto mt-3 max-w-sm text-mist">{cat === "invictus-collection" ? "The Invictus Collection is coming soon." : "Try removing a filter or searching for something else."}</p>
                <Link href={cat ? `/shop/${cat}` : "/shop"} className="btn-primary mt-6">Clear filters</Link>
              </div>
            </div>
          ) : <ProductGrid products={products} cols={3} />}
        </div>
      </div>
    </div>
  );
}
