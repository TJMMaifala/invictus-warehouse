/**
 * TODO — Uber Direct integration (NOT implemented).
 *
 * To enable: implement `quote` against the Uber Direct "Create Quote" API using
 * UBER_DIRECT_CLIENT_ID / UBER_DIRECT_CLIENT_SECRET / UBER_DIRECT_CUSTOMER_ID,
 * extend DeliveryMethodId + the delivery_method enum, add the provider to the
 * registry in ./index.ts, and create the delivery after payment is confirmed.
 * Until credentials exist this provider reports itself unavailable, so it is
 * never shown at checkout.
 */
import type { DeliveryProvider } from "./types";

export const UberDirect: DeliveryProvider = {
  id: "local", label: "Uber Direct", requiresAddress: true,
  isAvailable: () => Boolean(process.env.UBER_DIRECT_CLIENT_ID && process.env.UBER_DIRECT_CLIENT_SECRET) && false,
  quote: async () => { throw new Error("UberDirect is not implemented yet"); },
};
