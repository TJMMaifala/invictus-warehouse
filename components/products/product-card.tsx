"use client";

import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductVisual } from "./product-visual";
import { Price } from "./price";
import { productStock, variantLabel } from "./stock";
import { cn } from "@/lib/utils";

const CAT_LABEL: Record<string, string> = {
  sneakers: "Sneakers", iphones: "iPhone", clothing: "Clothing", "invictus-collection": "Invictus Collection",
};

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const stock = productStock(product);
  const liked = has(product.id);
  const discount = product.salePriceCents ? Math.round((1 - product.salePriceCents / product.priceCents) * 100) : 0;
  const hasSecond = product.images.length > 1;
  // Quick add is only offered when there's exactly one purchasable variant (e.g. phones).
  // Sized products go to the page so the customer picks a size — never guess a size.
  const purchasable = product.variants.filter((v) => v.stock > 0);
  const quickVariant = purchasable.length === 1 && product.variants.length === 1 ? purchasable[0] : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-stone/60">
        <Link href={`/product/${product.slug}`} className="absolute inset-0" aria-label={product.name}>
          <ProductVisual product={product} priority={priority} />
          {hasSecond && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <ProductVisual product={product} index={1} />
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.category === "iphones" && (
            <span className={cn("chip bg-paper/90", product.condition === "pre_owned" ? "border-ink" : "border-transparent")}>
              {product.condition === "pre_owned" ? "Pre-owned" : "New"}
            </span>
          )}
          {discount > 0 && <span className="chip border-transparent bg-ink text-paper">-{discount}%</span>}
        </div>

        <button
          type="button" onClick={() => toggle(product.id)} aria-pressed={liked}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-paper/90 transition-transform hover:scale-105"
        >
          <Heart className={cn("size-4", liked && "fill-ink")} />
        </button>

        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
          {quickVariant ? (
            <button type="button" className="btn-primary w-full !py-2.5"
              onClick={() => add({
                productId: product.id, variantId: quickVariant.id, quantity: 1, name: product.name,
                slug: product.slug, priceCents: product.salePriceCents ?? product.priceCents,
                variantLabel: variantLabel(quickVariant), imageUrl: product.images[0]?.url, maxStock: quickVariant.stock,
              })}>
              <Plus className="size-4" /> Quick add
            </button>
          ) : (
            <Link href={`/product/${product.slug}`} className={cn("btn-secondary w-full !bg-paper/95 !py-2.5 hover:!bg-ink", stock.kind === "out" && "pointer-events-none opacity-60")}>
              {stock.kind === "out" ? "Sold out" : "Select size"}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="eyebrow">{CAT_LABEL[product.category]}</p>
          <h3 className="mt-1 line-clamp-2 font-sans text-[15px] font-semibold normal-case leading-snug tracking-normal">
            <Link href={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className={cn("mt-1 text-[12px]", stock.kind === "out" ? "text-bad" : stock.kind === "low" ? "text-warn" : "text-ok")}>
            {stock.label}
          </p>
        </div>
        <Price priceCents={product.priceCents} salePriceCents={product.salePriceCents} className="shrink-0 flex-col !items-end gap-0" />
      </div>
    </motion.article>
  );
}

export function ProductGrid({ products, cols = 4 }: { products: Product[]; cols?: 3 | 4 }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3", cols === 4 && "lg:grid-cols-4")}>
      {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
    </div>
  );
}
