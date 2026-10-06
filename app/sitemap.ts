import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data/catalogue";
import { SITE_URL } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts().catch(() => []);
  const statics = ["", "/shop", "/shop/sneakers", "/shop/iphones", "/shop/clothing", "/shop/invictus-collection", "/about", "/contact", "/shipping", "/returns", "/faq", "/privacy", "/terms", "/refunds"];
  return [
    ...statics.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
