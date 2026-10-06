import type { Metadata } from "next";
import { InfoPage } from "@/components/pages/info-page";

export const metadata: Metadata = { title: "Returns", alternates: { canonical: "/returns" } };

export default function Returns() {
  return (
    <InfoPage eyebrow="Customer care" title="Returns" draft>
      <section><h2>Return window</h2><p>[RETURN WINDOW, e.g. number of days — to be confirmed]</p></section>
      <section><h2>Condition</h2><p>Items should be unworn/unused with original packaging unless faulty. Pre-owned iPhones are sold with the condition stated on the product page. [WARRANTY TERMS — to be confirmed]</p></section>
      <section><h2>How to start a return</h2><p>Contact us on WhatsApp or via the contact page with your order number.</p></section>
    </InfoPage>
  );
}
