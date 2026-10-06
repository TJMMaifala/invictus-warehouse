import type { Metadata } from "next";
import { InfoPage } from "@/components/pages/info-page";
import { getSettings } from "@/lib/settings";
import { formatZAR } from "@/lib/utils";

export const metadata: Metadata = { title: "Shipping & delivery", alternates: { canonical: "/shipping" } };

export default async function Shipping() {
  const s = await getSettings();
  return (
    <InfoPage eyebrow="Customer care" title="Shipping & delivery">
      <section><h2>Options at checkout</h2><ul>
        <li><strong>Store collection:</strong> free. We’ll tell you when your order is ready.</li>
        <li><strong>Local delivery:</strong> {formatZAR(s.localDeliveryFeeCents)}.</li>
        <li><strong>Courier delivery:</strong> {formatZAR(s.shippingFeeCents)}{s.freeShippingThresholdCents > 0 ? `, free on orders over ${formatZAR(s.freeShippingThresholdCents)}` : ""}.</li></ul></section>
      <section><h2>Delivery times</h2><p>[DELIVERY TIMEFRAMES — to be confirmed by the business owner]</p></section>
      <section><h2>Tracking</h2><p>Use the Track Order page with your order number and email to see progress.</p></section>
    </InfoPage>
  );
}
