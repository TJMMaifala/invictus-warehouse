import "server-only";
import { z } from "zod";
import type { DeliveryMethodId } from "@/types";
import { effectivePrice, getVariantIndex } from "@/lib/data/catalogue";
import { getSettings } from "@/lib/settings";
import { getDeliveryProvider, availableDeliveryProviders } from "@/lib/delivery";
import { isServiceRoleConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/admin";
import { variantLabel } from "@/components/products/stock";

export const quoteInput = z.object({
  lines: z.array(z.object({ variantId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(20) })).max(50),
  method: z.enum(["collection", "manual", "local"]).default("collection"),
  coupon: z.string().trim().toUpperCase().max(40).optional(),
});
export type QuoteInput = z.infer<typeof quoteInput>;

export interface QuotedLine {
  variantId: string; productId: string; name: string; slug: string; variantLabel: string;
  unitPriceCents: number; quantity: number; stock: number; imageUrl?: string;
  options: { variantId: string; label: string; stock: number }[];
}
export interface Quote {
  lines: QuotedLine[]; subtotalCents: number; deliveryCents: number; discountCents: number; totalCents: number;
  deliveryOptions: { id: DeliveryMethodId; label: string; requiresAddress: boolean; feeCents: number; note?: string }[];
  issues: string[]; couponError?: string; couponCode?: string;
}

/** Re-prices a cart from the database. The browser's prices are NEVER trusted. */
export async function buildQuote(input: QuoteInput): Promise<Quote> {
  const [index, settings] = await Promise.all([getVariantIndex(), getSettings()]);
  const issues: string[] = [];
  const lines: QuotedLine[] = [];

  for (const l of input.lines) {
    const hit = index.get(l.variantId);
    if (!hit) { issues.push("An item in your cart is no longer available and was removed."); continue; }
    const { product, variant } = hit;
    if (variant.stock <= 0) { issues.push(`${product.name} (${variantLabel(variant)}) is out of stock.`); continue; }
    let quantity = l.quantity;
    if (quantity > variant.stock) { quantity = variant.stock; issues.push(`Only ${variant.stock} of ${product.name} (${variantLabel(variant)}) left — quantity adjusted.`); }
    lines.push({
      variantId: variant.id, productId: product.id, name: product.name, slug: product.slug, variantLabel: variantLabel(variant),
      unitPriceCents: effectivePrice(product), quantity, stock: variant.stock, imageUrl: product.images[0]?.url,
      options: product.variants.map((v) => ({ variantId: v.id, label: variantLabel(v), stock: v.stock })),
    });
  }

  const subtotalCents = lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);

  const deliveryOptions = await Promise.all(availableDeliveryProviders().map(async (p) => {
    const q = await p.quote({ subtotalCents, settings });
    return { id: p.id, label: p.label, requiresAddress: p.requiresAddress, feeCents: q.feeCents, note: q.note };
  }));
  const chosen = await getDeliveryProvider(input.method).quote({ subtotalCents, settings });
  const deliveryCents = lines.length ? chosen.feeCents : 0;

  let discountCents = 0, couponError: string | undefined, couponCode: string | undefined;
  if (input.coupon) {
    if (!isServiceRoleConfigured()) couponError = "Coupons are unavailable right now.";
    else {
      const { data: c } = await createServiceClient().from("coupons").select("*").eq("code", input.coupon).eq("active", true).maybeSingle();
      if (!c) couponError = "That coupon code isn’t valid.";
      else if (c.expires_at && new Date(c.expires_at) < new Date()) couponError = "That coupon has expired.";
      else if (c.max_uses != null && c.used_count >= c.max_uses) couponError = "That coupon has been fully redeemed.";
      else if (subtotalCents < c.min_subtotal_cents) couponError = `Spend at least R${Math.ceil(c.min_subtotal_cents / 100)} to use this coupon.`;
      else {
        discountCents = Math.min(subtotalCents, c.type === "percent" ? Math.round((subtotalCents * c.value) / 100) : c.value);
        couponCode = c.code as string;
      }
    }
  }

  return { lines, subtotalCents, deliveryCents, discountCents, totalCents: Math.max(0, subtotalCents + deliveryCents - discountCents),
    deliveryOptions, issues, couponError, couponCode };
}
