import { NextResponse } from "next/server";
import { getProducts, effectivePrice } from "@/lib/data/catalogue";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  if (!rateLimit(`search:${clientIp(req)}`, 60, 60_000)) return NextResponse.json({ results: [] }, { status: 429 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 80);
  if (q.trim().length < 2) return NextResponse.json({ results: [] });
  const found = await getProducts({ q, sort: "featured" });
  return NextResponse.json({
    results: found.slice(0, 6).map((p) => ({ slug: p.slug, name: p.name, category: p.category, priceCents: effectivePrice(p) })),
  });
}
