import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/pages/info-page";

export const metadata: Metadata = { title: "About", description: "Invictus Warehouse is a South African destination for sneakers, clothing and iPhones.", alternates: { canonical: "/about" } };

export default function About() {
  const pillars = [["Fashion", "Everyday pieces and the Invictus Collection, picked for how they wear."], ["Sneakers", "Sought-after silhouettes from Nike, in a full run of sizes."], ["Technology", "iPhones, brand new and carefully selected pre-owned, with condition stated up front."]];
  return (
    <InfoPage eyebrow="About" title="Style. Tech. Everyday." intro="Invictus Warehouse brings fashion, sneakers and Apple technology into one store.">
      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map(([t, d]) => <div key={t} className="rounded-[var(--radius-card)] bg-paper p-6"><h2>{t}</h2><p className="text-mist">{d}</p></div>)}
      </section>
      <section><h2>Our story</h2><p>[BUSINESS STORY — to be supplied by the business owner]</p><p className="mt-2 text-mist">Founded: [FOUNDING YEAR] · Store: [STORE LOCATION]</p></section>
      <section><h2>Get in touch</h2><p>[CONTACT INFORMATION] — see our <Link href="/contact" className="underline">contact page</Link>.</p></section>
    </InfoPage>
  );
}
