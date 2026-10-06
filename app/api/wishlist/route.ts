import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

const one = z.object({ productId: z.string().uuid() });
const merge = z.object({ merge: z.array(z.string()).max(200) });

async function ensureWishlist(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("wishlists").select("id").eq("user_id", userId).maybeSingle();
  if (data) return { supabase, id: data.id as string };
  const { data: created, error } = await supabase.from("wishlists").insert({ user_id: userId }).select("id").single();
  if (error) throw error;
  return { supabase, id: created.id as string };
}

export async function PUT(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = merge.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { supabase, id } = await ensureWishlist(user.id);
  const uuids = body.data.merge.filter((x) => z.string().uuid().safeParse(x).success);
  if (uuids.length) await supabase.from("wishlist_items").upsert(uuids.map((p) => ({ wishlist_id: id, product_id: p })), { ignoreDuplicates: true });
  const { data } = await supabase.from("wishlist_items").select("product_id").eq("wishlist_id", id);
  return NextResponse.json({ ids: (data ?? []).map((r) => r.product_id as string) });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = one.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { supabase, id } = await ensureWishlist(user.id);
  await supabase.from("wishlist_items").upsert({ wishlist_id: id, product_id: body.data.productId }, { ignoreDuplicates: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = one.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { supabase, id } = await ensureWishlist(user.id);
  await supabase.from("wishlist_items").delete().eq("wishlist_id", id).eq("product_id", body.data.productId);
  return NextResponse.json({ ok: true });
}
