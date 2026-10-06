import "server-only";

/**
 * Minimal in-memory sliding-window limiter. Good enough to blunt abuse on a single
 * instance; on Vercel (multiple instances) swap for Upstash Redis — same signature.
 */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) { hits.set(key, arr); return false; }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
