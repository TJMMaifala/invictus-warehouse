"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { saveProduct, type ProductInput } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";

const CATS = [["sneakers", "Sneakers"], ["iphones", "iPhones"], ["clothing", "Clothing"], ["invictus-collection", "Invictus Collection"]] as const;
const MAX_MB = 5;

export function ProductForm({ initial, sizeSets }: { initial: ProductInput; sizeSets: Record<string, string[]> }) {
  const router = useRouter();
  const [p, setP] = useState<ProductInput>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setP((s) => ({ ...s, [k]: v }));
  const attr = (k: keyof ProductInput["attributes"], v: string) => setP((s) => ({ ...s, attributes: { ...s.attributes, [k]: v } }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setMsg(null);
    const supabase = createClient();
    const added: ProductInput["images"] = [];
    for (const f of Array.from(files)) {
      if (!/^image\/(jpeg|png|webp|avif)$/.test(f.type)) { setMsg({ ok: false, text: `${f.name}: use JPG, PNG, WebP or AVIF.` }); continue; }
      if (f.size > MAX_MB * 1024 * 1024) { setMsg({ ok: false, text: `${f.name} is over ${MAX_MB}MB.` }); continue; }
      const ext = f.type.split("/")[1];
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, f, { contentType: f.type, cacheControl: "31536000" });
      if (error) { setMsg({ ok: false, text: `Upload failed for ${f.name}.` }); continue; }
      added.push({ url: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl, alt: p.name, source: "own" });
    }
    setP((s) => ({ ...s, images: [...s.images, ...added] }));
    setUploading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await saveProduct(p);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    setMsg({ ok: true, text: "Saved." });
    if (!p.id) router.replace(`/admin/products/${r.id}`); else router.refresh();
  }

  const sizes = sizeSets[p.categorySlug] ?? [];
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => <div><label className="label">{label}</label>{children}</div>;

  return (
    <form onSubmit={submit} className="space-y-10">
      <section className="grid gap-4 md:grid-cols-2">
        <F label="Name"><input required className="input" value={p.name} onChange={(e) => set("name", e.target.value)} /></F>
        <F label="URL slug (auto from name if blank)"><input className="input" value={p.slug ?? ""} onChange={(e) => set("slug", e.target.value)} /></F>
        <F label="Category"><select className="input" value={p.categorySlug} onChange={(e) => set("categorySlug", e.target.value as ProductInput["categorySlug"])}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></F>
        <F label="Condition"><select className="input" value={p.condition} onChange={(e) => set("condition", e.target.value as "new" | "pre_owned")}><option value="new">New</option><option value="pre_owned">Pre-owned</option></select></F>
        <F label="Brand"><input className="input" value={p.brand} onChange={(e) => set("brand", e.target.value)} /></F>
        <F label="Model"><input className="input" value={p.model} onChange={(e) => set("model", e.target.value)} /></F>
        <F label="Colour"><input className="input" value={p.colour} onChange={(e) => set("colour", e.target.value)} /></F>
        <div className="grid grid-cols-2 gap-4">
          <F label="Price (R)"><input required type="number" min={0} step="1" className="input" value={p.priceRand} onChange={(e) => set("priceRand", Number(e.target.value))} /></F>
          <F label="Sale price (R)"><input type="number" min={0} step="1" className="input" value={p.salePriceRand ?? ""} onChange={(e) => set("salePriceRand", e.target.value === "" ? null : Number(e.target.value))} placeholder="None" /></F>
        </div>
        <div className="md:col-span-2"><F label="Description"><textarea rows={4} className="input" value={p.description} onChange={(e) => set("description", e.target.value)} /></F></div>
      </section>

      {p.categorySlug === "iphones" && (
        <section className="grid gap-4 md:grid-cols-2">
          <h2 className="font-display text-lg font-extrabold uppercase md:col-span-2">iPhone details</h2>
          <F label="Storage (e.g. 128GB)"><input className="input" value={p.attributes.storage ?? ""} onChange={(e) => attr("storage", e.target.value)} /></F>
          <F label="Battery health (e.g. 87%)"><input className="input" value={p.attributes.batteryHealth ?? ""} onChange={(e) => attr("batteryHealth", e.target.value)} /></F>
          <F label="Condition grade (pre-owned)"><input className="input" value={p.attributes.grade ?? ""} onChange={(e) => attr("grade", e.target.value)} /></F>
          <F label="Warranty"><input className="input" value={p.attributes.warranty ?? ""} onChange={(e) => attr("warranty", e.target.value)} /></F>
        </section>
      )}
      {p.categorySlug === "clothing" && <F label="Fit"><input className="input max-w-md" value={p.attributes.fit ?? ""} onChange={(e) => attr("fit", e.target.value)} /></F>}

      <section>
        <h2 className="font-display text-lg font-extrabold uppercase">Images</h2>
        <p className="mt-1 text-sm text-mist">First image is the main photo. Upload your own photography; mark any borrowed image as “Reference” so it is labelled on the storefront.</p>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {p.images.map((img, i) => (
            <li key={img.url} className="rounded-xl bg-paper p-2 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} className="aspect-square w-full rounded-lg object-cover" />
              <select aria-label="Image source" className="mt-2 w-full rounded border border-ink/20 p-1" value={img.source} onChange={(e) => set("images", p.images.map((x, k) => k === i ? { ...x, source: e.target.value as "own" | "reference" } : x))}><option value="own">Our photo</option><option value="reference">Reference / illustrative</option></select>
              <div className="mt-2 flex justify-between">
                <button type="button" disabled={i === 0} onClick={() => set("images", p.images.map((x, k, a) => k === i - 1 ? a[i] : k === i ? a[i - 1] : x))} className="underline disabled:opacity-30">Move up</button>
                <button type="button" aria-label="Remove image" onClick={() => set("images", p.images.filter((_, k) => k !== i))}><Trash2 className="size-4 text-bad" /></button>
              </div>
            </li>
          ))}
        </ul>
        <label className="btn-secondary mt-4 cursor-pointer"><Upload className="size-4" /> {uploading ? "Uploading…" : "Upload images"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={uploading} /></label>
      </section>

      <section>
        <h2 className="font-display text-lg font-extrabold uppercase">Variants &amp; stock</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizes.length > 0 && <button type="button" className="btn-secondary !py-2" onClick={() => set("variants", [...p.variants, ...sizes.filter((s) => !p.variants.some((v) => v.size === s)).map((s) => ({ size: s, colour: "", storage: "", stock: 0 }))])}>Add all {p.categorySlug} sizes</button>}
          <button type="button" className="btn-secondary !py-2" onClick={() => set("variants", [...p.variants, { size: "", colour: "", storage: "", stock: 0 }])}>Add variant</button>
        </div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-mist"><tr><th>Size</th><th>Colour</th><th>Storage</th><th>Stock</th><th /></tr></thead>
          <tbody>{p.variants.map((v, i) => {
            const up = (patch: Partial<typeof v>) => set("variants", p.variants.map((x, k) => k === i ? { ...x, ...patch } : x));
            return (<tr key={v.id ?? i}>
              <td className="pr-2 pt-2"><input aria-label="Size" className="input !py-2" value={v.size ?? ""} onChange={(e) => up({ size: e.target.value })} /></td>
              <td className="pr-2 pt-2"><input aria-label="Colour" className="input !py-2" value={v.colour ?? ""} onChange={(e) => up({ colour: e.target.value })} /></td>
              <td className="pr-2 pt-2"><input aria-label="Storage" className="input !py-2" value={v.storage ?? ""} onChange={(e) => up({ storage: e.target.value })} /></td>
              <td className="pr-2 pt-2"><input aria-label="Stock" type="number" min={0} className="input !py-2 w-24" value={v.stock} onChange={(e) => up({ stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} /></td>
              <td className="pt-2"><button type="button" aria-label="Remove variant" onClick={() => set("variants", p.variants.filter((_, k) => k !== i))}><Trash2 className="size-4 text-bad" /></button></td>
            </tr>);
          })}</tbody></table></div>
        {p.variants.length === 0 && <p className="mt-3 text-sm text-warn">No variants: customers can’t buy this product. Add at least one (leave size blank for single-option items like phones).</p>}
      </section>

      <section className="flex flex-wrap gap-6">
        {([["published", "Published"], ["featured", "Featured"], ["archived", "Archived"]] as const).map(([k, l]) => (
          <label key={k} className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="size-4 accent-black" checked={p[k]} onChange={(e) => set(k, e.target.checked)} /> {l}</label>
        ))}
      </section>

      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-ok" : "text-bad"}>{msg.text}</p>}
      <button className="btn-primary" disabled={busy || uploading}>{busy ? "Saving…" : "Save product"}</button>
    </form>
  );
}
