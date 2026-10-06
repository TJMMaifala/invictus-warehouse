"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "login" | "notbuyer" | "error">("idle");
  if (productId.startsWith("demo-")) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setState("sending");
    try {
      const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, rating, body }) });
      setState(r.ok ? "done" : r.status === 401 ? "login" : r.status === 403 ? "notbuyer" : "error");
    } catch { setState("error"); }
  }
  if (state === "done") return <p className="mt-6 font-semibold">Thanks! Your review will appear once it’s approved.</p>;
  return (
    <form onSubmit={submit} className="mt-8 max-w-xl space-y-3">
      <p className="label">Write a review</p>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" role="radio" aria-checked={rating === s} aria-label={`${s} star${s > 1 ? "s" : ""}`} onClick={() => setRating(s)}>
            <Star className={cn("size-7", s <= rating && "fill-ink")} />
          </button>
        ))}
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={4} className="input" placeholder="Tell others what you thought" aria-label="Review text" />
      <button className="btn-primary" disabled={!rating || state === "sending"}>{state === "sending" ? "Sending…" : "Submit review"}</button>
      {state === "login" && <p role="alert" className="text-sm text-bad">Please <a className="underline" href="/login">sign in</a> to review.</p>}
      {state === "notbuyer" && <p role="alert" className="text-sm text-bad">Only customers who purchased this product can review it.</p>}
      {state === "error" && <p role="alert" className="text-sm text-bad">We couldn’t submit your review. Please try again.</p>}
    </form>
  );
}
