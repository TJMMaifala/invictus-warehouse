import { NextResponse } from "next/server";
import { buildQuote, quoteInput } from "@/lib/pricing";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`quote:${clientIp(req)}`, 60, 60_000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = quoteInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  return NextResponse.json(await buildQuote(parsed.data));
}
