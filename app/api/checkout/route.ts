import { NextResponse } from "next/server";
import { z } from "zod";
import { buildQuote, quoteInput } from "@/lib/pricing";
import { getUser } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isServiceRoleConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments";
import { newPaymentReference } from "@/lib/orders";
import { getDeliveryProvider } from "@/lib/delivery";
import { SITE_URL } from "@/lib/utils";

const text = (max: number) => z.string().trim().min(1).max(max);
const body = quoteInput.extend({
  customer: z.object({
    firstName: text(60), lastName: text(60), email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().regex(/^[+\d][\d\s()-]{7,19}$/, "invalid phone"),
  }),
  address: z.object({
    line: text(200), suburb: z.string().trim().max(100).optional(), city: text(100), province: text(60),
    postalCode: z.string().trim().regex(/^\d{4}$/, "invalid postal code"),
  }).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req)}`, 10, 60_000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const input = parsed.data;

  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const provider = getPaymentProvider();
  if (!provider.isConfigured()) return NextResponse.json({ error: "payments_not_configured" }, { status: 503 });

  const delivery = getDeliveryProvider(input.method);
  if (delivery.requiresAddress && !input.address) return NextResponse.json({ error: "invalid", fields: { address: ["required"] } }, { status: 400 });

  const quote = await buildQuote(input);
  if (quote.lines.length === 0) return NextResponse.json({ error: "empty_cart", issues: quote.issues }, { status: 409 });
  // If stock changed since the customer last looked, make them review rather than silently altering the order.
  const requested = new Map(input.lines.map((l) => [l.variantId, l.quantity]));
  if (quote.issues.length || quote.lines.some((l) => l.quantity !== requested.get(l.variantId)))
    return NextResponse.json({ error: "cart_changed", quote }, { status: 409 });
  if (input.coupon && quote.couponError) return NextResponse.json({ error: "coupon", message: quote.couponError }, { status: 400 });

  const db = createServiceClient();
  const user = await getUser();
  const a = delivery.requiresAddress ? input.address : undefined;
  const { data: order, error } = await db.from("orders").insert({
    user_id: user?.id ?? null, email: input.customer.email, first_name: input.customer.firstName, last_name: input.customer.lastName,
    phone: input.customer.phone, delivery_method: input.method,
    address_line: a?.line ?? null, suburb: a?.suburb ?? null, city: a?.city ?? null, province: a?.province ?? null, postal_code: a?.postalCode ?? null,
    subtotal_cents: quote.subtotalCents, delivery_cents: quote.deliveryCents, discount_cents: quote.discountCents,
    total_cents: quote.totalCents, coupon_code: quote.couponCode ?? null,
  }).select("id, order_number").single();
  if (error || !order) return NextResponse.json({ error: "order_failed" }, { status: 500 });

  const { error: itemsErr } = await db.from("order_items").insert(quote.lines.map((l) => ({
    order_id: order.id, product_id: l.productId, variant_id: l.variantId, name: l.name, variant_label: l.variantLabel,
    unit_price_cents: l.unitPriceCents, quantity: l.quantity })));
  if (itemsErr) { await db.from("orders").delete().eq("id", order.id); return NextResponse.json({ error: "order_failed" }, { status: 500 }); }

  const reference = newPaymentReference(order.order_number);
  await db.from("payments").insert({ order_id: order.id, provider: provider.id, reference, amount_cents: quote.totalCents });

  try {
    const { redirectUrl } = await provider.initialize({
      reference, amountCents: quote.totalCents, email: input.customer.email,
      callbackUrl: `${SITE_URL}/api/payments/callback`, metadata: { orderNumber: order.order_number },
    });
    return NextResponse.json({ redirectUrl });
  } catch {
    await db.from("orders").update({ payment_status: "FAILED" }).eq("id", order.id);
    await db.from("payments").update({ status: "FAILED" }).eq("reference", reference);
    return NextResponse.json({ error: "gateway_error" }, { status: 502 });
  }
}
