import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView, type RawParams } from "@/components/shop/shop-view";

const CATS: Record<string, { title: string; description: string }> = {
  sneakers: { title: "Sneakers", description: "Nike Shox, Air Max Plus, Air Max Portal and more. Shop sneakers in every size at Invictus Warehouse." },
  iphones: { title: "iPhones", description: "Brand new and carefully selected pre-owned iPhones, from iPhone 7 Plus to iPhone 15 Pro." },
  clothing: { title: "Clothing", description: "Nike Tech Fleece sets, Nike x Nocta outerwear and everyday staples." },
  "invictus-collection": { title: "Invictus Collection", description: "House pieces from Invictus Warehouse." },
};

export async function generateStaticParams() {
  return Object.keys(CATS).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const c = CATS[(await params).category];
  if (!c) return {};
  const slug = (await params).category;
  return { title: c.title, description: c.description, alternates: { canonical: `/shop/${slug}` }, openGraph: { title: c.title, description: c.description } };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<RawParams> }) {
  const { category } = await params;
  if (!CATS[category]) notFound();
  return <ShopView category={category} searchParams={await searchParams} />;
}
