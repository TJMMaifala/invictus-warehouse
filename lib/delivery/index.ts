import type { DeliveryMethodId } from "@/types";
import type { DeliveryProvider } from "./types";
import { LocalDelivery, ManualDelivery, StoreCollection } from "./providers";

const REGISTRY: DeliveryProvider[] = [StoreCollection, LocalDelivery, ManualDelivery];

export const availableDeliveryProviders = () => REGISTRY.filter((p) => p.isAvailable());
export function getDeliveryProvider(id: DeliveryMethodId): DeliveryProvider {
  const p = availableDeliveryProviders().find((x) => x.id === id);
  if (!p) throw new Error(`Delivery method "${id}" is not available`);
  return p;
}
export type { DeliveryProvider, DeliveryQuote, DeliveryContext } from "./types";
