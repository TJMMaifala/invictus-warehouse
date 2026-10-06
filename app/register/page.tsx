import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Register", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  if (await getUser()) redirect(safeNext(sp.next));
  return <AuthForm mode="register" next={sp.next} enabled={isSupabaseConfigured()} linkError={sp.error === "link"} />;
}
