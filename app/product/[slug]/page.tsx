import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getProductBySlug, getRelated, effectivePrice, totalStock } from "@/lib/data/catalogue";
import { getReviews } from "@/lib/data/reviews";
import { getSettings } from "@/lib/settings";
import { Gallery } from "@/components/products/gallery";
import { PurchasePanel } from "@/components/products/purchase-panel";
import { Price } from "@/components/products/price";
import { ProductGrid } from "@/components/products/product-card";
import { ReviewForm } from "@/components/products/review-form";
import { productStock } from "@/components/products/stock";
import { SITE_URL, formatZAR, whatsappLink } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Product not found" };
  const desc = `${p.name} — ${formatZAR(effectivePrice(p))}. ${p.description}`.slice(0, 158);
  const img = p.images[0]?.url;
  return {
    title: p.name, description: desc, alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description: desc, type: "website", url: `${SITE_URL}/product/${p.slug}`, images: img ? [{ url: img }] : undefined },
  };
}

const Row = ({ k, v }: { k: string; v?: string }) => v ? (
  <div className="flex justify-between gap-6 border-b border-ink/10 py-3 text-[14px]"><dt className="text-mist">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
) : null;

export default async function ProductPage({ params }: Props) {
  const p = await getProductBySlug((await params).slug);
  if (!p) notFound();
  const [related, reviews, settings] = await Promise.all([getRelated(p), getReviews(p.id), getSettings()]);
  const stock = productStock(p);
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const isPhone = p.category === "iphones";

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined, sku: p.variants[0]?.id,
    image: p.images.map((i) => i.url),
    itemCondition: p.condition === "pre_owned" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
    offers: { "@type": "Offer", url: `${SITE_URL}/product/${p.slug}`, priceCurrency: "ZAR", price: (effectivePrice(p) / 100).toFixed(2),
      availability: totalStock(p) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
    ...(reviews.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length } } : {}),
  };

  return (
    <div className="container-x py-8 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-mist">
        <Link href="/" className="hover:text-ink">Home</Link> / <Link href={`/shop/${p.category}`} className="hover:text-ink capitalize">{p.category.replace("-", " ")}</Link> / <span className="text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <Gallery product={p} />
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">{p.brand}{isPhone && ` · ${p.condition === "pre_owned" ? "Pre-owned" : "Brand new"}`}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold uppercase leading-[1.02] md:text-5xl">{p.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm">
            {reviews.length > 0 ? (<><span className="flex" aria-label={`${avg.toFixed(1)} out of 5`}>{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`size-4 ${s <= Math.round(avg) ? "fill-ink" : ""}`} />)}</span><a href="#reviews" className="underline">{reviews.length} reviews</a></>) : <a href="#reviews" className="text-mist underline">No reviews yet</a>}
          </div>
          <Price priceCents={p.priceCents} salePriceCents={p.salePriceCents} large className="mt-5" />
          <p className={`mt-2 text-sm font-semibold ${stock.kind === "out" ? "text-bad" : stock.kind === "low" ? "text-warn" : "text-ok"}`}>{stock.label}</p>
          <p className="mt-5 leading-relaxed text-ink/75">{p.description}</p>
          <PurchasePanel product={p} />
          {settings.whatsapp && (
            <a href={whatsappLink(settings.whatsapp, `Hi, I'm interested in: ${p.name} (${SITE_URL}/product/${p.slug})`)} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-4 !px-0">
              Ask about this on WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="details">
          <h2 id="details" className="font-display text-2xl font-extrabold uppercase">Product details</h2>
          <dl className="mt-4">
            <Row k="Brand" v={p.brand} /><Row k="Model" v={p.model} /><Row k="Colour" v={p.colour} />
            {isPhone && <>
              <Row k="Condition" v={p.condition === "pre_owned" ? (p.attributes.grade ?? "Pre-owned — grade confirmed before purchase") : "Brand new"} />
              <Row k="Storage" v={p.attributes.storage ?? "Confirmed on request"} />
              <Row k="Battery health" v={p.attributes.batteryHealth ?? (p.condition === "pre_owned" ? "Confirmed on request" : "New battery")} />
              <Row k="Warranty" v={p.attributes.warranty ?? "[WARRANTY TERMS — to be confirmed by Invictus]"} />
            </>}
            {p.category === "clothing" && <Row k="Fit" v={p.attributes.fit ?? "[FIT — to be confirmed]"} />}
          </dl>
        </section>
        <section className="space-y-2">
          {[
            ["Shipping", `Collection is free. Local delivery from ${formatZAR(settings.localDeliveryFeeCents)}; courier delivery ${formatZAR(settings.shippingFeeCents)}${settings.freeShippingThresholdCents > 0 ? `, free over ${formatZAR(settings.freeShippingThresholdCents)}` : ""}. Final options are shown at checkout.`],
            ["Returns", "[RETURNS POLICY — to be confirmed by Invictus. See the Returns page.]"],
          ].map(([t, b]) => (
            <details key={t} className="group border-b border-ink/10 py-4" open={t === "Shipping"}>
              <summary className="cursor-pointer list-none font-display text-lg font-extrabold uppercase">{t}</summary>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/70">{b}</p>
            </details>
          ))}
        </section>
      </div>

      <section id="reviews" className="mt-16 scroll-mt-24" aria-labelledby="rev">
        <h2 id="rev" className="font-display text-2xl font-extrabold uppercase">Reviews</h2>
        {reviews.length === 0 ? <p className="mt-3 text-mist">No reviews yet. Purchased this item? Be the first to review it.</p> : (
          <ul className="mt-4 divide-y divide-ink/10">
            {reviews.map((r) => (
              <li key={r.id} className="py-5">
                <div className="flex items-center gap-3">
                  <span className="flex" aria-label={`${r.rating} out of 5`}>{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`size-4 ${s <= r.rating ? "fill-ink" : ""}`} />)}</span>
                  {r.verified && <span className="chip">Verified purchase</span>}
                </div>
                <p className="mt-2">{r.body}</p>
                <p className="mt-1 text-[12px] text-mist">{r.author} · {new Date(r.createdAt).toLocaleDateString("en-ZA", { dateStyle: "medium" })}</p>
              </li>
            ))}
          </ul>
        )}
        <ReviewForm productId={p.id} />
      </section>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="rel">
          <h2 id="rel" className="display-lg mb-8">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
