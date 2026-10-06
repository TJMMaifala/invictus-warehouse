import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isServiceRoleConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(5).max(2000),
});

export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req)}`, 3, 60_000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { error } = await createServiceClient().from("contact_messages").insert(parsed.data);
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
