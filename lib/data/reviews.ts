import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface Review { id: string; rating: number; body: string; verified: boolean; createdAt: string; author: string }

export async function getReviews(productId: string): Promise<Review[]> {
  if (!isSupabaseConfigured() || productId.startsWith("demo-")) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id,rating,body,verified_purchase,created_at,user_id,profiles:user_id(first_name)")
    .eq("product_id", productId).eq("approved", true).order("created_at", { ascending: false }).limit(50);
  return (data ?? []).map((r) => {
    const prof = r.profiles as { first_name: string | null } | { first_name: string | null }[] | null;
    const first = Array.isArray(prof) ? prof[0]?.first_name : prof?.first_name;
    return { id: r.id as string, rating: r.rating as number, body: (r.body as string) ?? "", verified: r.verified_purchase as boolean,
      createdAt: r.created_at as string, author: first || "Customer" };
  });
}
