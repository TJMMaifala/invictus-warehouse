"use client";
import { useState } from "react";
import type { Product } from "@/types";
import { ProductVisual } from "./product-visual";
import { cn } from "@/lib/utils";

export function Gallery({ product }: { product: Product }) {
  const [i, setI] = useState(0);
  const n = Math.max(product.images.length, 1);
  return (
    <div className="grid gap-3 lg:grid-cols-[88px_1fr]">
      <div className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:flex-col">
        {Array.from({ length: n }).map((_, k) => (
          <button key={k} type="button" onClick={() => setI(k)} aria-label={`Show image ${k + 1}`} aria-current={i === k}
            className={cn("relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-stone/60 lg:w-full", i === k ? "border-ink" : "border-transparent")}>
            <ProductVisual product={product} index={k} sizes="88px" />
          </button>
        ))}
      </div>
      <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-[22px] bg-stone/60 lg:order-2">
        <ProductVisual product={product} index={i} sizes="(min-width:1024px) 50vw, 100vw" priority />
      </div>
    </div>
  );
}
