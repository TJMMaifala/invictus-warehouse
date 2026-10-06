import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = (await getUser())!;
  const { data: p } = await (await createClient()).from("profiles").select("first_name,last_name,phone").eq("id", user.id).maybeSingle();
  return (
    <section><h2 className="font-display text-2xl font-extrabold uppercase">Profile</h2>
      <div className="mt-6"><ProfileForm userId={user.id} email={user.email ?? ""} initial={{ firstName: p?.first_name ?? "", lastName: p?.last_name ?? "", phone: p?.phone ?? "" }} /></div>
    </section>
  );
}
