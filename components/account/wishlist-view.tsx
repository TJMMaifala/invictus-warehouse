"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductGrid } from "@/components/products/product-card";

export function WishlistView() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const key = ids.join(",");

  useEffect(() => {
    if (!key) { setProducts([]); return; }
    setError(false);
    fetch(`/api/products/by-ids?ids=${encodeURIComponent(key)}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() as Promise<{ products: Product[] }>; })
      .then((d) => setProducts(d.products)).catch(() => setError(true));
  }, [key]);

  if (error) return <p role="alert" className="py-10">We couldn’t load your wishlist. Please check your connection and refresh.</p>;
  if (products === null) return <div aria-busy="true" className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] bg-stone/60" />)}</div>;
  if (!products.length)
    return <div className="py-16 text-center"><p className="font-display text-3xl font-black uppercase">Nothing saved yet.</p><p className="mt-3 text-mist">Tap the heart on any product to save it here.</p><Link href="/shop" className="btn-primary mt-6">Shop now</Link></div>;
  return <ProductGrid products={products} />;
}
