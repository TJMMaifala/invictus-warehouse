import type { Metadata } from "next";
import { InfoPage } from "@/components/pages/info-page";

export const metadata: Metadata = { title: "FAQ", alternates: { canonical: "/faq" } };

const FAQ: [string, string][] = [
  ["How do I pay?", "Securely online through our payment provider. We never see or store your card details."],
  ["Can I buy without an account?", "Yes. Guest checkout is available, and you can track your order with your order number and email."],
  ["What does “pre-owned” mean for iPhones?", "Pre-owned phones are previously used. Each listing states the condition so you know what to expect."],
  ["How do I find my size?", "Choose your size on the product page. Sizes that are sold out are disabled."],
  ["Can I collect my order?", "Yes, choose Store collection at checkout."],
];
export default function Faq() {
  return (
    <InfoPage eyebrow="Customer care" title="FAQ">
      {FAQ.map(([q, a]) => <details key={q} className="rounded-[var(--radius-card)] bg-paper p-5"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-3 text-mist">{a}</p></details>)}
    </InfoPage>
  );
}
