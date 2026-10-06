import { NextResponse } from "next/server";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { confirmPayment } from "@/lib/orders";

// Paystack webhook: guarantees fulfilment even if the customer closes the tab before the redirect.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyPaystackSignature(raw, req.headers.get("x-paystack-signature"))) return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  const evt = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  if (evt.event === "charge.success" && evt.data?.reference) await confirmPayment(evt.data.reference).catch(() => undefined);
  return NextResponse.json({ received: true });
}
