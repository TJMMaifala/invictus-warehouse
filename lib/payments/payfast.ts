/**
 * TODO — PayFast (NOT implemented). Reports itself unconfigured so it can never
 * be selected by accident. To implement: build the signed form POST to
 * https://www.payfast.co.za/eng/process (MD5 signature with passphrase), handle
 * the ITN webhook (validate signature, source IP, and POST back to
 * /eng/query/validate), then return `paid` from verify(). Env vars:
 * PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, PAYFAST_PASSPHRASE.
 */
import type { PaymentProvider } from "./types";

export const PayFast: PaymentProvider = {
  id: "payfast",
  isConfigured: () => false,
  initialize: async () => { throw new Error("PayFast is not implemented yet"); },
  verify: async () => { throw new Error("PayFast is not implemented yet"); },
};
