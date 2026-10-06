import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { checkOrderToken, getOrderView } from "@/lib/orders";
import { isServiceRoleConfigured } from "@/lib/supabase/env";
import { OrderDetail } from "@/components/orders/order-detail";
import { ClearCart } from "@/components/orders/clear-cart";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string; e?: string; paid?: string }> }) {
  const { orderNumber } = await params;
  const { t, e, paid } = await searchParams;
  if (!isServiceRoleConfigured() || !t || !e || !checkOrderToken(orderNumber, e, t)) notFound();
  const order = await getOrderView(orderNumber, e);
  if (!order) notFound();
  const confirmed = paid === "1" && order.paymentStatus === "PAID";

  return (
    <div className="container-x max-w-3xl py-14 md:py-20">
      {confirmed && <ClearCart />}
      {confirmed ? (
        <header className="mb-12">
          <p className="eyebrow">Thank you, {order.firstName}.</p>
          <h1 className="display-lg mt-2">Order confirmed</h1>
          <p className="mt-4 text-lg">Your order <strong>#{order.orderNumber}</strong> has been received.</p>
          <p className="mt-1 text-mist">You’ll receive updates as your order progresses.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/track?order=${order.orderNumber}&email=${encodeURIComponent(order.email)}`} className="btn-primary">Track order</Link>
            <Link href="/shop" className="btn-secondary">Continue shopping</Link>
          </div>
        </header>
      ) : (
        <header className="mb-10"><p className="eyebrow">Order</p><h1 className="display-lg mt-2">#{order.orderNumber}</h1></header>
      )}
      <OrderDetail o={order} />
    </div>
  );
}
