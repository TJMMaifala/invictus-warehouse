import type { Metadata } from "next";
import { CheckoutView, type CheckoutDefaults } from "@/components/checkout/checkout-view";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/data/catalogue";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const sp = await searchParams;
  const user = await getUser();
  const defaults: CheckoutDefaults = {};
  if (user) {
    const supabase = await createClient();
    const [{ data: p }, { data: addr }] = await Promise.all([
      supabase.from("profiles").select("first_name,last_name,phone").eq("id", user.id).maybeSingle(),
      supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).limit(1).maybeSingle(),
    ]);
    Object.assign(defaults, { email: user.email, firstName: p?.first_name ?? "", lastName: p?.last_name ?? "", phone: p?.phone ?? "" });
    if (addr) defaults.address = { line: addr.address_line, suburb: addr.suburb ?? "", city: addr.city, province: addr.province, postalCode: addr.postal_code };
  }
  return <CheckoutView defaults={defaults} paymentFailed={sp.payment === "failed"} demo={isDemoMode()} />;
}
