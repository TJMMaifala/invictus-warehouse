import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/types";
import { formatZAR } from "@/lib/utils";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default async function OrdersPage() {
  const user = (await getUser())!;
  const { data: orders } = await (await createClient())
    .from("orders").select("id,order_number,created_at,status,payment_status,total_cents,delivery_method,email,order_items(name,quantity)")
    .eq("user_id", user.id).order("created_at", { ascending: false });
  return (
    <section><h2 className="font-display text-2xl font-extrabold uppercase">My orders</h2>
      {!orders?.length ? (
        <div className="py-12"><p className="font-display text-2xl font-black uppercase">No orders yet.</p><Link href="/shop" className="btn-primary mt-5">Shop now</Link></div>
      ) : (
        <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div>
                <p className="font-semibold">#{o.order_number} <span className="ml-2 text-sm font-normal text-mist">{new Date(o.created_at).toLocaleDateString("en-ZA", { dateStyle: "medium" })}</span></p>
                <p className="mt-1 text-sm text-mist">{(o.order_items as { name: string; quantity: number }[]).map((i) => `${i.name} ×${i.quantity}`).join(", ")}</p>
                <p className="mt-2 flex gap-2"><span className="chip">{ORDER_STATUS_LABEL[o.status as OrderStatus]}</span><span className="chip">Payment: {String(o.payment_status).toLowerCase()}</span></p>
              </div>
              <div className="text-right"><p className="font-semibold">{formatZAR(o.total_cents)}</p>
                <Link className="text-sm underline" href={`/track?order=${o.order_number}&email=${encodeURIComponent(o.email)}`}>View details</Link></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
