import type { DeliveryMethodId, SiteSettings } from "@/types";

export interface DeliveryContext {
  subtotalCents: number;
  settings: SiteSettings;
  /** Present for delivery methods that need an address (not collection). */
  address?: { suburb?: string; city?: string; province?: string; postalCode?: string };
}
export interface DeliveryQuote { feeCents: number; label: string; note?: string }

/**
 * A delivery provider turns a cart context into a price. Add a new provider
 * (e.g. Uber Direct) by implementing this and registering it in ./index.ts —
 * checkout itself does not change.
 */
export interface DeliveryProvider {
  id: DeliveryMethodId;
  label: string;
  requiresAddress: boolean;
  /** false => hidden from checkout (e.g. missing API credentials) */
  isAvailable(): boolean;
  quote(ctx: DeliveryContext): Promise<DeliveryQuote>;
}
