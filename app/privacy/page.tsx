import type { Metadata } from "next";
import { InfoPage } from "@/components/pages/info-page";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <InfoPage eyebrow="Legal" title="Privacy policy" draft>
      <section><h2>Who we are</h2><p>[REGISTERED BUSINESS NAME AND ADDRESS]. Information officer: [NAME / EMAIL].</p></section>
      <section><h2>What we collect</h2><ul><li>Name, email, phone and delivery address when you order or create an account.</li><li>Order history and wishlist.</li><li>Messages you send us.</li></ul><p className="mt-2">We do not store card details; payments are handled by our payment provider.</p></section>
      <section><h2>How we use it</h2><p>To process and deliver orders, provide support, and, if you opt in, send updates. We handle personal information in line with POPIA.</p></section>
      <section><h2>Your rights</h2><p>You may ask to access, correct or delete your personal information by contacting us.</p></section>
    </InfoPage>
  );
}
