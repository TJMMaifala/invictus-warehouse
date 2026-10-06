import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isServiceRoleConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/admin";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

export async function POST(req: Request) {
  if (!rateLimit(`nl:${clientIp(req)}`, 5, 60_000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { error } = await createServiceClient().from("newsletter_subscribers").upsert({ email: parsed.data.email });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
