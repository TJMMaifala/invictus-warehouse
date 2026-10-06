import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/admin";

const schema = z.object({ productId: z.string().uuid(), rating: z.number().int().min(1).max(5), body: z.string().trim().max(1000).optional() });

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const db = createServiceClient();
  // Only customers with a PAID order containing this product may review it.
  const { data: bought } = await db.from("order_items")
    .select("id, orders!inner(user_id, payment_status)").eq("product_id", parsed.data.productId)
    .eq("orders.user_id", user.id).eq("orders.payment_status", "PAID").limit(1);
  if (!bought?.length) return NextResponse.json({ error: "not_purchased" }, { status: 403 });
  const { error } = await db.from("reviews").upsert({
    product_id: parsed.data.productId, user_id: user.id, rating: parsed.data.rating, body: parsed.data.body ?? "",
    verified_purchase: true, approved: false }, { onConflict: "product_id,user_id" });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
