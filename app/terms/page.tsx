import type { Metadata } from "next";
import { InfoPage } from "@/components/pages/info-page";

export const metadata: Metadata = { title: "Terms & conditions", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <InfoPage eyebrow="Legal" title="Terms & conditions" draft>
      <section><h2>Orders</h2><p>An order is accepted once payment is verified. Prices are in South African Rand (ZAR) and stock is limited.</p></section>
      <section><h2>Products</h2><p>Product images may be for reference and may differ slightly from the item supplied. Pre-owned items are sold in the condition stated on the listing.</p></section>
      <section><h2>Liability and governing law</h2><p>[TO BE COMPLETED WITH LEGAL ADVICE — Consumer Protection Act and ECTA considerations]</p></section>
    </InfoPage>
  );
}
