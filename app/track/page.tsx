import type { Metadata } from "next";
import { headers } from "next/headers";
import { getOrderView } from "@/lib/orders";
import { isServiceRoleConfigured } from "@/lib/supabase/env";
import { OrderDetail } from "@/components/orders/order-detail";
import { rateLimit } from "@/lib/rate-limit";

export const metadata: Metadata = { title: "Track your order", robots: { index: false } };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string; email?: string }> }) {
  const { order, email } = await searchParams;
  let view = null, message = "";
  if (order && email) {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!rateLimit(`track:${ip}`, 15, 60_000)) message = "Too many lookups. Please wait a minute and try again.";
    else if (!isServiceRoleConfigured()) message = "Order tracking isn’t available yet.";
    else {
      view = await getOrderView(order.trim().toUpperCase().replace(/^#/, ""), email.trim());
      if (!view) message = "We couldn’t find an order with those details. Check your order number and the email used at checkout.";
    }
  }
  return (
    <div className="container-x max-w-3xl py-14 md:py-20">
      <h1 className="display-lg">Track order</h1>
      <form className="mt-8 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" method="get">
        <div><label htmlFor="order" className="label">Order number</label><input id="order" name="order" required placeholder="INV-10042" defaultValue={order} className="input" /></div>
        <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" required defaultValue={email} className="input" /></div>
        <button className="btn-primary">Track</button>
      </form>
      {message && <p role="alert" className="mt-6 rounded-lg bg-paper p-4 text-sm">{message}</p>}
      {view && <div className="mt-10"><h2 className="display-lg !text-3xl mb-6">#{view.orderNumber}</h2><OrderDetail o={view} /></div>}
    </div>
  );
}
