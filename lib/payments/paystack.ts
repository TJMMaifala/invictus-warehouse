import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "./types";

const BASE = "https://api.paystack.co";
const secret = () => {
  const s = process.env.PAYSTACK_SECRET_KEY;
  if (!s) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return s;
};

export const Paystack: PaymentProvider = {
  id: "paystack",
  isConfigured: () => Boolean(process.env.PAYSTACK_SECRET_KEY),

  async initialize({ reference, amountCents, email, callbackUrl, metadata }) {
    const res = await fetch(`${BASE}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret()}`, "content-type": "application/json" },
      // Paystack takes the smallest currency unit — cents for ZAR.
      body: JSON.stringify({ reference, amount: amountCents, email, currency: "ZAR", callback_url: callbackUrl, metadata }),
    });
    const json = (await res.json().catch(() => null)) as { status?: boolean; data?: { authorization_url?: string }; message?: string } | null;
    if (!res.ok || !json?.status || !json.data?.authorization_url) throw new Error(`Paystack initialize failed: ${json?.message ?? res.status}`);
    return { redirectUrl: json.data.authorization_url };
  },

  async verify(reference) {
    const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret()}` }, cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as { status?: boolean; data?: { status?: string; amount?: number; currency?: string } } | null;
    if (!res.ok || !json?.status || !json.data) return { paid: false, amountCents: 0, currency: "", raw: json };
    return { paid: json.data.status === "success", amountCents: json.data.amount ?? 0, currency: json.data.currency ?? "", raw: json.data };
  },
};

/** Validates the x-paystack-signature header on webhook calls (HMAC-SHA512 of the raw body). */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
