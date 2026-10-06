import type { Metadata } from "next";
import { ShopView, type RawParams } from "@/components/shop/shop-view";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Shop sneakers, iPhones (new and pre-owned) and clothing at Invictus Warehouse.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  return <ShopView searchParams={await searchParams} />;
}
