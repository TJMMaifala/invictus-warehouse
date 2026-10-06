import "server-only";
import type { PaymentProvider } from "./types";
import { Paystack } from "./paystack";
import { PayFast } from "./payfast";

const PROVIDERS: Record<string, PaymentProvider> = { paystack: Paystack, payfast: PayFast };

/** Provider is chosen by PAYMENT_PROVIDER (default paystack); swap gateways without touching checkout. */
export function getPaymentProvider(): PaymentProvider {
  const id = process.env.PAYMENT_PROVIDER || "paystack";
  const p = PROVIDERS[id];
  if (!p) throw new Error(`Unknown PAYMENT_PROVIDER "${id}"`);
  return p;
}
export type { PaymentProvider } from "./types";
