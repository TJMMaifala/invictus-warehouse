import type { Metadata } from "next";
import { InfoPage } from "@/components/pages/info-page";
import { ContactForm } from "@/components/pages/contact-form";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = { title: "Contact", description: "Contact Invictus Warehouse by WhatsApp, phone, email or message form.", alternates: { canonical: "/contact" } };

export default async function Contact() {
  const s = await getSettings();
  const wa = s.whatsapp ? whatsappLink(s.whatsapp, "Hi Invictus Warehouse, I have a question.") : null;
  return (
    <InfoPage eyebrow="Customer care" title="Contact" intro="The fastest way to reach us is WhatsApp.">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <dl className="space-y-4 text-sm">
            <div><dt className="eyebrow">Phone</dt><dd>{s.phone}</dd></div>
            <div><dt className="eyebrow">Email</dt><dd>{s.email}</dd></div>
            <div><dt className="eyebrow">Location</dt><dd>{s.address}</dd></div>
            <div><dt className="eyebrow">Business hours</dt><dd className="whitespace-pre-line">{s.businessHours}</dd></div>
          </dl>
          {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary">Chat on WhatsApp</a> : <p className="text-sm text-mist">WhatsApp number not set yet (Admin → Settings).</p>}
          <div className="grid aspect-[4/3] place-items-center rounded-[var(--radius-card)] bg-stone/60 text-sm text-mist">[GOOGLE MAPS EMBED — add once the store address is confirmed]</div>
        </div>
        <ContactForm />
      </div>
    </InfoPage>
  );
}
