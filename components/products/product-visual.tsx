import Image from "next/image";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Renders a product image. If the product has no photo yet, shows a branded
 * typographic plate (NOT a stock photo) so we never show a wrong product.
 * Images flagged source:'reference' are labelled "Illustrative image".
 */
export function ProductVisual({
  product, index = 0, sizes = "(min-width:1024px) 25vw, 50vw", priority = false, className,
}: { product: Pick<Product, "name" | "brand" | "model" | "images" | "category" | "condition">;
  index?: number; sizes?: string; priority?: boolean; className?: string }) {
  const img = product.images[index];
  if (!img) {
    if (index > 0) return null;
    return (
      <div className={cn("relative flex h-full w-full flex-col justify-between bg-stone/70 p-4 sm:p-5", className)} role="img" aria-label={`${product.name} — photo coming soon`}>
        <span className="eyebrow">{product.brand}</span>
        <span className="font-display text-[clamp(1.1rem,2.2vw,1.9rem)] font-black uppercase leading-[0.95] tracking-tight text-ink/85">
          {product.model || product.name}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist">Photo coming soon</span>
      </div>
    );
  }
  return (
    <>
      <Image src={img.url} alt={img.alt} fill sizes={sizes} priority={priority}
        className={cn("object-cover", className)} />
      {img.source === "reference" && (
        <span className="absolute bottom-2 left-2 rounded bg-paper/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-mist">
          Illustrative image
        </span>
      )}
    </>
  );
}
