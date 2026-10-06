import "server-only";
import type { SiteSettings } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Defaults are clearly-labelled placeholders until the owner fills in /admin/settings */
export const DEFAULT_SETTINGS: SiteSettings = {
  businessName: "Invictus Warehouse",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[EMAIL — set in admin]",
  phone: "[PHONE — set in admin]",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  address: "[STORE ADDRESS — set in admin]",
  instagram: "",
  tiktok: "",
  currency: "ZAR",
  shippingFeeCents: 9900,
  freeShippingThresholdCents: 0,
  localDeliveryFeeCents: 5000,
  paymentProvider: "paystack",
  businessHours: "[BUSINESS HOURS — set in admin]",
};

export async function getSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("value").eq("key", "site").maybeSingle();
    return { ...DEFAULT_SETTINGS, ...((data?.value as Partial<SiteSettings>) ?? {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
