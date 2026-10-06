import Link from "next/link";
import type { SiteSettings } from "@/types";
import { NewsletterForm } from "./newsletter-form";
import { whatsappLink } from "@/lib/utils";

const col = "text-[13px] leading-8 text-paper/70 hover:text-paper";

export function Footer({ settings }: { settings: SiteSettings }) {
  const wa = settings.whatsapp ? whatsappLink(settings.whatsapp, "Hi Invictus Warehouse") : null;
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
        <div>
          <p className="font-display text-2xl font-black tracking-[0.04em]">INVICTUS WAREHOUSE</p>
          <p className="mt-3 max-w-xs text-[13px] text-paper/60">Style. Tech. Everyday. Sneakers, clothing and iPhones, South Africa.</p>
        </div>
        <nav aria-label="Shop"><p className="eyebrow !text-paper/50">Shop</p><ul className="mt-3">
          {[["Sneakers", "/shop/sneakers"], ["iPhones", "/shop/iphones"], ["Clothing", "/shop/clothing"], ["Invictus Collection", "/shop/invictus-collection"]].map(([l, h]) => <li key={h}><Link href={h} className={col}>{l}</Link></li>)}
        </ul></nav>
        <nav aria-label="Customer care"><p className="eyebrow !text-paper/50">Customer care</p><ul className="mt-3">
          {[["Contact", "/contact"], ["Shipping", "/shipping"], ["Returns", "/returns"], ["FAQ", "/faq"], ["Track order", "/track"]].map(([l, h]) => <li key={h}><Link href={h} className={col}>{l}</Link></li>)}
        </ul></nav>
        <nav aria-label="Legal and social"><p className="eyebrow !text-paper/50">Legal</p><ul className="mt-3">
          {[["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"], ["Refund Policy", "/refunds"]].map(([l, h]) => <li key={h}><Link href={h} className={col}>{l}</Link></li>)}
        </ul>
          <p className="eyebrow mt-6 !text-paper/50">Social</p>
          <ul className="mt-3">
            {settings.instagram && <li><a href={settings.instagram} className={col} rel="noopener noreferrer" target="_blank">Instagram</a></li>}
            {settings.tiktok && <li><a href={settings.tiktok} className={col} rel="noopener noreferrer" target="_blank">TikTok</a></li>}
            {wa && <li><a href={wa} className={col} rel="noopener noreferrer" target="_blank">WhatsApp</a></li>}
            {!settings.instagram && !settings.tiktok && !wa && <li className="text-[13px] text-paper/40">[Add social links in admin]</li>}
          </ul>
        </nav>
        <div>
          <p className="eyebrow !text-paper/50">Newsletter</p>
          <p className="mb-4 mt-3 font-display text-xl font-extrabold uppercase">Join the Invictus list.</p>
          <NewsletterForm dark />
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-x flex flex-col justify-between gap-2 py-5 text-[11px] text-paper/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Invictus Warehouse. All rights reserved.</p>
          <p>Prices in South African Rand (ZAR).</p>
        </div>
      </div>
    </footer>
  );
}
