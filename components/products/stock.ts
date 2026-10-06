import type { Product, Variant } from "@/types";

export type StockState = { kind: "in" | "low" | "out"; label: string };

export function stockState(units: number): StockState {
  if (units <= 0) return { kind: "out", label: "Out of stock" };
  if (units <= 3) return { kind: "low", label: `Only ${units} left` };
  return { kind: "in", label: "In stock" };
}
export const productStock = (p: Pick<Product, "variants">) => stockState(p.variants.reduce((n, v) => n + v.stock, 0));
export const variantLabel = (v: Variant) => [v.size, v.colour, v.storage].filter(Boolean).join(" / ") || "Standard";
