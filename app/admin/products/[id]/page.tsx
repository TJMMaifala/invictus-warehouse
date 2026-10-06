import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProduct, getSizeSets } from "@/lib/data/admin";
import type { ProductInput } from "@/app/admin/actions";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const p = await getAdminProduct(id);
  if (!p) notFound();
  const cat = (p.categories as { slug: ProductInput["categorySlug"] } | null)?.slug ?? "sneakers";
  const images = [...((p.product_images ?? []) as { url: string; alt: string | null; source: "own" | "reference"; sort_order: number }[])].sort((a, b) => a.sort_order - b.sort_order);
  const variants = (p.product_variants ?? []) as { id: string; size: string | null; colour: string | null; storage: string | null; inventory: { quantity: number } | { quantity: number }[] | null }[];
  const initial: ProductInput = {
    id: p.id, name: p.name, slug: p.slug, description: p.description ?? "", categorySlug: cat, brand: p.brand ?? "", model: p.model ?? "", colour: p.colour ?? "",
    condition: p.condition, priceRand: p.price_cents / 100, salePriceRand: p.sale_price_cents != null ? p.sale_price_cents / 100 : null,
    featured: p.featured, published: p.published, archived: p.archived, attributes: p.attributes ?? {},
    images: images.map((i) => ({ url: i.url, alt: i.alt ?? "", source: i.source })),
    variants: variants.map((v) => ({ id: v.id, size: v.size, colour: v.colour, storage: v.storage, stock: (Array.isArray(v.inventory) ? v.inventory[0]?.quantity : v.inventory?.quantity) ?? 0 })),
  };
  return <div><h1 className="display-lg mb-8 !text-4xl">Edit product</h1><ProductForm initial={initial} sizeSets={await getSizeSets()} /></div>;
}
