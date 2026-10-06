import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/data/catalogue";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  if (!rateLimit(`byids:${clientIp(req)}`, 60, 60_000)) return NextResponse.json({ products: [] }, { status: 429 });
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
  return NextResponse.json({ products: ids.length ? await getProductsByIds(ids) : [] });
}
