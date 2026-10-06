"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [
  ["featured", "Featured"], ["newest", "Newest"], ["price_asc", "Price: Low to High"], ["price_desc", "Price: High to Low"],
] as const;

export function FilterPanel({ brands, colours, sizeOptions, showCondition }:
  { brands: string[]; colours: string[]; sizeOptions: string[]; showCondition: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const list = (k: string) => (sp.get(k) ?? "").split(",").filter(Boolean);
  const push = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    start(() => router.push(`${path}${p.toString() ? `?${p}` : ""}`, { scroll: false }));
  };
  const toggleMulti = (k: string, v: string) => push((p) => {
    const cur = list(k);
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    next.length ? p.set(k, next.join(",")) : p.delete(k);
  });
  const set = (k: string, v: string) => push((p) => (v ? p.set(k, v) : p.delete(k)));
  const active = ["brand", "size", "condition", "min", "max", "stock", "colour"].some((k) => sp.has(k));

  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <fieldset className="border-b border-ink/10 py-5"><legend className="eyebrow mb-3 !text-ink">{title}</legend>{children}</fieldset>
  );
  const Pill = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn("rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors", on ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink")}>{children}</button>
  );

  const panel = (
    <div className={cn(pending && "opacity-60 transition-opacity")}>
      <Group title="Sort">
        <select aria-label="Sort products" className="input !py-2.5" value={sp.get("sort") ?? "featured"} onChange={(e) => set("sort", e.target.value === "featured" ? "" : e.target.value)}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Group>
      {showCondition && (
        <Group title="Condition"><div className="flex flex-wrap gap-2">
          <Pill on={sp.get("condition") === "new"} onClick={() => set("condition", sp.get("condition") === "new" ? "" : "new")}>New</Pill>
          <Pill on={sp.get("condition") === "pre_owned"} onClick={() => set("condition", sp.get("condition") === "pre_owned" ? "" : "pre_owned")}>Pre-owned</Pill>
        </div></Group>
      )}
      {sizeOptions.length > 0 && (
        <Group title="Size"><div className="flex flex-wrap gap-2">
          {sizeOptions.map((s) => <Pill key={s} on={list("size").includes(s)} onClick={() => toggleMulti("size", s)}>{s}</Pill>)}
        </div></Group>
      )}
      {brands.length > 1 && (
        <Group title="Brand"><div className="flex flex-wrap gap-2">
          {brands.map((b) => <Pill key={b} on={list("brand").includes(b)} onClick={() => toggleMulti("brand", b)}>{b}</Pill>)}
        </div></Group>
      )}
      {colours.length > 0 && (
        <Group title="Colour">
          <select aria-label="Colour" className="input !py-2.5" value={sp.get("colour") ?? ""} onChange={(e) => set("colour", e.target.value)}>
            <option value="">All colours</option>
            {colours.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Group>
      )}
      <Group title="Price (R)">
        <div className="flex items-center gap-2">
          <input aria-label="Minimum price" inputMode="numeric" placeholder="Min" className="input !py-2.5" defaultValue={sp.get("min") ?? ""} onBlur={(e) => set("min", e.target.value.replace(/\D/g, ""))} />
          <span>–</span>
          <input aria-label="Maximum price" inputMode="numeric" placeholder="Max" className="input !py-2.5" defaultValue={sp.get("max") ?? ""} onBlur={(e) => set("max", e.target.value.replace(/\D/g, ""))} />
        </div>
      </Group>
      <Group title="Availability">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-black" checked={sp.get("stock") === "1"} onChange={(e) => set("stock", e.target.checked ? "1" : "")} /> In stock only</label>
      </Group>
      {active && <button type="button" onClick={() => start(() => router.push(path, { scroll: false }))} className="btn-ghost mt-4 !px-0">Clear all filters</button>}
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary lg:hidden"><SlidersHorizontal className="size-4" /> Filter &amp; sort</button>
      <aside aria-label="Filters" className="hidden lg:block">{panel}</aside>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Filters" className="fixed inset-0 z-50 flex flex-col bg-bone lg:hidden">
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
            <h2 className="font-display text-lg font-extrabold uppercase">Filter &amp; sort</h2>
            <button onClick={() => setOpen(false)} aria-label="Close filters" className="grid size-9 place-items-center"><X className="size-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5">{panel}</div>
          <div className="border-t border-ink/10 p-4"><button onClick={() => setOpen(false)} className="btn-primary w-full">Show results</button></div>
        </div>
      )}
    </>
  );
}
