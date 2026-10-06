"use client";
import { useEffect, useRef, useState } from "react";
import type { ClientCartLine, DeliveryMethodId } from "@/types";
import type { Quote } from "@/lib/pricing";

export type QuoteState = { status: "idle" | "loading" | "ready" | "error"; quote: Quote | null };

/** Fetches a server-authoritative quote whenever the cart, delivery method or coupon changes. */
export function useQuote(lines: ClientCartLine[], method: DeliveryMethodId, coupon: string, enabled = true): QuoteState & { refresh: () => void } {
  const [state, setState] = useState<QuoteState>({ status: "idle", quote: null });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([lines.map((l) => [l.variantId, l.quantity]), method, coupon, tick]);
  const last = useRef("");

  useEffect(() => {
    if (!enabled) return;
    if (lines.length === 0) { setState({ status: "ready", quote: null }); return; }
    if (last.current === key) return;
    last.current = key;
    const ctl = new AbortController();
    setState((s) => ({ status: "loading", quote: s.quote }));
    fetch("/api/cart/quote", {
      method: "POST", headers: { "content-type": "application/json" }, signal: ctl.signal,
      body: JSON.stringify({ lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), method, coupon: coupon || undefined }),
    })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Quote>; })
      .then((quote) => setState({ status: "ready", quote }))
      .catch((e) => { if ((e as Error).name !== "AbortError") setState((s) => ({ status: "error", quote: s.quote })); });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { ...state, refresh: () => { last.current = ""; setTick((t) => t + 1); } };
}
