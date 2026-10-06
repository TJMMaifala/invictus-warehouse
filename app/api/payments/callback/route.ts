import { NextResponse } from "next/server";
import { confirmPayment, orderToken } from "@/lib/orders";
import { SITE_URL } from "@/lib/utils";

// Customer is redirected here by the gateway. We NEVER trust the query string —
// confirmPayment() verifies with the gateway server-to-server.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
  if (!reference) return NextResponse.redirect(`${SITE_URL}/checkout?payment=failed`);
  try {
    const r = await confirmPayment(reference);
    if (r.ok && r.orderNumber && r.email)
      return NextResponse.redirect(`${SITE_URL}/order/${r.orderNumber}?t=${orderToken(r.orderNumber, r.email)}&e=${encodeURIComponent(r.email)}&paid=1`);
    return NextResponse.redirect(`${SITE_URL}/checkout?payment=failed`);
  } catch {
    return NextResponse.redirect(`${SITE_URL}/checkout?payment=failed`);
  }
}
