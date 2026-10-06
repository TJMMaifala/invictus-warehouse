import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { getSettings } from "@/lib/settings";
import { getUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/utils";
import { isDemoMode } from "@/lib/data/catalogue";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Invictus Warehouse — Style. Tech. Everyday.", template: "%s | Invictus Warehouse" },
  description: "Premium sneakers, clothing and iPhones, brand new and pre-owned. Shop online with Invictus Warehouse, South Africa.",
  openGraph: { type: "website", siteName: "Invictus Warehouse", locale: "en_ZA", url: SITE_URL },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: "#efecea", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([getSettings(), getUser()]);
  return (
    <html lang="en-ZA">
      <body>
        <Providers signedIn={!!user}>
          {isDemoMode() && (
            <div className="fixed bottom-5 left-5 z-30 max-w-[60vw] rounded-md bg-ink px-3 py-2 text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-paper">
              Demo mode: Supabase not configured. Orders &amp; accounts disabled.
            </div>
          )}
          <Header signedIn={!!user} />
          <main id="main" className="min-h-[70vh]">{children}</main>
          <Footer settings={settings} />
          <WhatsAppFab number={settings.whatsapp} />
        </Providers>
      </body>
    </html>
  );
}
