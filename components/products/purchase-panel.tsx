"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Heart, Minus, Plus } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { stockState, variantLabel } from "./stock";
import { cn } from "@/lib/utils";

export function PurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const needsSize = product.variants.some((v) => v.size);
  const [variantId, setVariantId] = useState<string | null>(needsSize ? null : product.variants.find((v) => v.stock > 0)?.id ?? product.variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  const variant = useMemo(() => product.variants.find((v) => v.id === variantId) ?? null, [product.variants, variantId]);
  const totalStock = product.variants.reduce((n, v) => n + v.stock, 0);
  const state = stockState(variant ? variant.stock : totalStock);
  const liked = has(product.id);
  const soldOut = totalStock === 0;

  function line() {
    if (!variant) { setError(needsSize ? "Please select a size." : "This item is unavailable."); return null; }
    if (variant.stock <= 0) { setError("That option is out of stock."); return null; }
    setError("");
    return {
      productId: product.id, variantId: variant.id, quantity: qty, name: product.name, slug: product.slug,
      priceCents: product.salePriceCents ?? product.priceCents, variantLabel: variantLabel(variant),
      imageUrl: product.images[0]?.url, maxStock: variant.stock,
    };
  }

  return (
    <div className="mt-8 space-y-6">
      {needsSize && (
        <div>
          <div className="mb-2 flex items-center justify-between"><span className="label !mb-0">Size</span>
            {variant && <span className={cn("text-[12px]", state.kind === "low" ? "text-warn" : "text-mist")}>{state.label}</span>}</div>
          <div role="radiogroup" aria-label="Size" className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {product.variants.map((v) => {
              const out = v.stock <= 0;
              return (
                <button key={v.id} type="button" role="radio" aria-checked={variantId === v.id} disabled={out}
                  onClick={() => { setVariantId(v.id); setQty(1); setError(""); }}
                  className={cn("relative rounded-md border py-3 text-[13px] font-semibold transition-colors",
                    variantId === v.id ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink",
                    out && "text-mist line-through opacity-50")}>
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!soldOut && (
        <div>
          <span className="label">Quantity</span>
          <div className="inline-flex items-center rounded-md border border-ink/25">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center"><Minus className="size-4" /></button>
            <span className="w-10 text-center font-semibold" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(variant?.stock ?? 1, q + 1))} className="grid size-11 place-items-center"><Plus className="size-4" /></button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-sm font-semibold text-bad">{error}</p>}

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <button type="button" disabled={soldOut} className="btn-primary" onClick={() => { const l = line(); if (l) add(l); }}>
            {soldOut ? "Out of stock" : "Add to cart"}
          </button>
          <button type="button" disabled={soldOut} className="btn-secondary" onClick={() => { const l = line(); if (l) { add(l, { openDrawer: false }); router.push("/checkout"); } }}>Buy now</button>
        </div>
        <button type="button" onClick={() => toggle(product.id)} aria-pressed={liked} aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          className="btn-secondary sm:h-full sm:!px-5"><Heart className={cn("size-4", liked && "fill-ink")} /><span className="sm:hidden">Wishlist</span></button>
      </div>
    </div>
  );
}
