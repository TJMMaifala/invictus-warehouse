"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatZAR } from "@/lib/utils";

interface Hit { slug: string; name: string; priceCents: number; category: string }

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 50);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); setState("idle"); return; }
    setState("loading");
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctl.signal });
        if (!r.ok) throw new Error();
        setHits(((await r.json()) as { results: Hit[] }).results);
        setState("idle");
      } catch (e) { if ((e as Error).name !== "AbortError") setState("error"); }
    }, 180);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) { onClose(); router.push(`/shop?q=${encodeURIComponent(q.trim())}`); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-50 bg-bone"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="container-x pt-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-black tracking-[0.04em]">INVICTUS</span>
              <button onClick={onClose} aria-label="Close search" className="grid size-10 place-items-center rounded-full hover:bg-ink/5"><X className="size-5" /></button>
            </div>
            <form onSubmit={submit} className="mt-10 flex items-center gap-3 border-b-2 border-ink pb-3">
              <Search className="size-6 shrink-0" />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search iPhone 13, Nike Shox, Tech Fleece…"
                className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-mist md:text-4xl" aria-label="Search products" />
            </form>
            <div className="mt-6" aria-live="polite">
              {state === "loading" && <p className="text-mist">Searching…</p>}
              {state === "error" && <p className="text-bad">We couldn’t search right now. Please check your connection and try again.</p>}
              {state === "idle" && q.trim().length >= 2 && hits.length === 0 && (
                <p className="text-lg">No results for “{q}”. Try a model name like “iPhone 12” or “Air Max”.</p>
              )}
              <ul className="divide-y divide-ink/10">
                {hits.map((h) => (
                  <li key={h.slug}>
                    <Link href={`/product/${h.slug}`} onClick={onClose} className="flex items-center justify-between gap-4 py-4 hover:opacity-70">
                      <span className="font-semibold">{h.name}</span>
                      <span className="text-sm text-mist">{formatZAR(h.priceCents)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {hits.length > 0 && (
                <button onClick={submit} className="btn-secondary mt-6">See all results</button>
              )}
              {q.trim().length < 2 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {["iPhone 13", "Nike Shox", "Air Max Plus", "Tech Fleece", "iPhone 15"].map((s) => (
                    <button key={s} onClick={() => setQ(s)} className="chip hover:bg-ink hover:text-paper">{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
