import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments";
import type { OrderStatus, PaymentStatus } from "@/types";

/* ---- guest-safe order access: HMAC token bound to order number + email ---- */
const tokenSecret = () => process.env.ORDER_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export function orderToken(orderNumber: string, email: string): string {
  return createHmac("sha256", tokenSecret()).update(`${orderNumber}|${email.toLowerCase()}`).digest("hex").slice(0, 32);
}
export function checkOrderToken(orderNumber: string, email: string, token: string): boolean {
  const a = Buffer.from(orderToken(orderNumber, email)), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const newPaymentReference = (orderNumber: string) => `${orderNumber}-${randomBytes(5).toString("hex")}`;

export interface OrderView {
  orderNumber: string; createdAt: string; status: OrderStatus; paymentStatus: PaymentStatus;
  firstName: string; email: string; deliveryMethod: string; address: string;
  subtotalCents: number; deliveryCents: number; discountCents: number; totalCents: number;
  items: { name: string; variantLabel: string | null; quantity: number; unitPriceCents: number }[];
}

export async function getOrderView(orderNumber: string, email: string): Promise<OrderView | null> {
  const db = createServiceClient();
  const { data: o } = await db.from("orders").select("*, order_items(*)").eq("order_number", orderNumber).ilike("email", email).maybeSingle();
  if (!o) return null;
  return {
    orderNumber: o.order_number, createdAt: o.created_at, status: o.status, paymentStatus: o.payment_status,
    firstName: o.first_name, email: o.email, deliveryMethod: o.delivery_method,
    address: [o.address_line, o.suburb, o.city, o.province, o.postal_code].filter(Boolean).join(", "),
    subtotalCents: o.subtotal_cents, deliveryCents: o.delivery_cents, discountCents: o.discount_cents, totalCents: o.total_cents,
    items: (o.order_items as { name: string; variant_label: string | null; quantity: number; unit_price_cents: number }[]).map((i) => ({
      name: i.name, variantLabel: i.variant_label, quantity: i.quantity, unitPriceCents: i.unit_price_cents })),
  };
}

/**
 * Idempotent fulfilment: verifies with the gateway SERVER-TO-SERVER, checks the paid
 * amount equals the order total, marks the order paid, decrements stock atomically and
 * redeems the coupon. Safe to call from both the redirect callback and the webhook.
 */
export async function confirmPayment(reference: string): Promise<{ ok: boolean; orderNumber?: string; email?: string; reason?: string }> {
  const db = createServiceClient();
  const { data: pay } = await db.from("payments").select("*, orders(*)").eq("reference", reference).maybeSingle();
  if (!pay || !pay.orders) return { ok: false, reason: "unknown_reference" };
  const order = pay.orders as { id: string; order_number: string; email: string; total_cents: number; coupon_code: string | null };
  if (pay.status === "PAID") return { ok: true, orderNumber: order.order_number, email: order.email };

  const result = await getPaymentProvider().verify(reference);
  if (!result.paid) {
    await db.from("payments").update({ raw: result.raw as object }).eq("id", pay.id);
    return { ok: false, orderNumber: order.order_number, email: order.email, reason: "not_paid" };
  }
  if (result.amountCents !== order.total_cents || result.currency !== "ZAR") {
    await db.from("payments").update({ status: "FAILED", raw: result.raw as object }).eq("id", pay.id);
    await db.from("orders").update({ notes: "PAYMENT AMOUNT MISMATCH — review manually" }).eq("id", order.id);
    return { ok: false, orderNumber: order.order_number, email: order.email, reason: "amount_mismatch" };
  }

  // Claim the payment row atomically so concurrent callback + webhook only fulfil once.
  const { data: claimed } = await db.from("payments")
    .update({ status: "PAID", raw: result.raw as object, verified_at: new Date().toISOString() })
    .eq("id", pay.id).neq("status", "PAID").select("id");
  if (!claimed?.length) return { ok: true, orderNumber: order.order_number, email: order.email };

  const { error: stockErr } = await db.rpc("decrement_stock", { p_order_id: order.id });
  await db.from("orders").update({
    status: "PAYMENT_CONFIRMED", payment_status: "PAID",
    ...(stockErr ? { notes: "STOCK CONFLICT AFTER PAYMENT — contact customer or refund" } : {}),
  }).eq("id", order.id);
  if (order.coupon_code) {
    const { data: c } = await db.from("coupons").select("used_count").eq("code", order.coupon_code).maybeSingle();
    if (c) await db.from("coupons").update({ used_count: c.used_count + 1 }).eq("code", order.coupon_code);
  }
  // TODO(notifications): send confirmation email / WhatsApp here (see lib/notifications.ts)
  return { ok: true, orderNumber: order.order_number, email: order.email };
}
