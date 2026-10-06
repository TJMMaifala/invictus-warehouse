import type { Metadata } from "next";
import { InfoPage } from "@/components/pages/info-page";

export const metadata: Metadata = { title: "Refund policy", alternates: { canonical: "/refunds" } };

export default function Refunds() {
  return (
    <InfoPage eyebrow="Legal" title="Refund policy" draft>
      <section><h2>Refunds</h2><p>[REFUND CONDITIONS AND TIMEFRAME — to be confirmed]. Approved refunds are returned to the original payment method.</p></section>
      <section><h2>Faulty items</h2><p>[FAULTY GOODS PROCESS — to be confirmed]</p></section>
    </InfoPage>
  );
}
