import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Addresses } from "@/components/account/addresses";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default async function AddressesPage() {
  const user = (await getUser())!;
  const { data } = await (await createClient()).from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
  return <section><h2 className="font-display text-2xl font-extrabold uppercase">Addresses</h2><div className="mt-6"><Addresses userId={user.id} initial={data ?? []} /></div></section>;
}
