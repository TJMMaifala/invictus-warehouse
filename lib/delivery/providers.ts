import type { DeliveryProvider } from "./types";

export const StoreCollection: DeliveryProvider = {
  id: "collection", label: "Collect in store", requiresAddress: false,
  isAvailable: () => true,
  quote: async () => ({ feeCents: 0, label: "Collect in store", note: "Free. We’ll message you when your order is ready." }),
};

/** Flat courier fee, free above the configured threshold (0 = never free). */
export const ManualDelivery: DeliveryProvider = {
  id: "manual", label: "Courier delivery", requiresAddress: true,
  isAvailable: () => true,
  quote: async ({ subtotalCents, settings }) => {
    const free = settings.freeShippingThresholdCents > 0 && subtotalCents >= settings.freeShippingThresholdCents;
    return { feeCents: free ? 0 : settings.shippingFeeCents, label: "Courier delivery", note: free ? "Free delivery applied." : undefined };
  },
};

export const LocalDelivery: DeliveryProvider = {
  id: "local", label: "Local delivery", requiresAddress: true,
  isAvailable: () => true,
  quote: async ({ settings }) => ({ feeCents: settings.localDeliveryFeeCents, label: "Local delivery", note: "Delivered by Invictus within the local area." }),
};
