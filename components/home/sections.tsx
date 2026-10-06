import Link from "next/link";
import { ShieldCheck, Tag, Truck, MessageCircle } from "lucide-react";
import type { Product } from "@/types";
import { ProductGrid } from "@/components/products/product-card";
import { Price } from "@/components/products/price";
import { productStock, variantLabel } from "@/components/products/stock";
import { Plate } from "./plate";
import { Reveal } from "./reveal";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { SITE_IMAGES } from "@/lib/site-images";
import { cn } from "@/lib/utils";

export function SectionHead({ title, sub, href, cta = "View all" }: { title: string; sub?: string; href?: string; cta?: string }) {
  return (
    <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-12">
      <div>
        <h2 className="display-lg">{title}</h2>
        {sub && <p className="mt-3 max-w-lg text-ink/70">{sub}</p>}
      </div>
      {href && <Link href={href} className="btn-secondary">{cta}</Link>}
    </Reveal>
  );
}

export function FeaturedDrops({ products }: { products: Product[] }) {
  return (
    <section className="container-x py-20 md:py-28" aria-labelledby="drops">
      <span id="drops" className="sr-only">Featured drops</span>
      <SectionHead title="Featured drops" sub="Hand-picked pieces across sneakers, tech and clothing." href="/shop" />
      <ProductGrid products={products.slice(0, 8)} />
    </section>
  );
}

export function IphoneSection({ products }: { products: Product[] }) {
  return (
    <section className="bg-ink py-20 text-paper md:py-28" aria-labelledby="iph">
      <div className="container-x">
        <Reveal className="mb-10 max-w-2xl md:mb-14">
          <p className="eyebrow !text-paper/50">iPhone</p>
          <h2 id="iph" className="display-lg mt-3">Upgrade your everyday</h2>
          <p className="mt-4 text-lg text-paper/70">Premium iPhones. Carefully selected. Ready for your next move.</p>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => {
            const st = productStock(p);
            const pre = p.condition === "pre_owned";
            return (
              <Link key={p.id} href={`/product/${p.slug}`} className="group flex flex-col justify-between rounded-[var(--radius-card)] border border-paper/15 bg-paper/[0.04] p-5 transition-colors hover:bg-paper/[0.09]">
                <div className="flex items-center justify-between">
                  <span className={cn("chip", pre ? "border-paper/60 text-paper" : "border-paper bg-paper text-ink")}>{pre ? "Pre-owned" : "New"}</span>
                  <span className={cn("text-[12px]", st.kind === "out" ? "text-red-300" : st.kind === "low" ? "text-amber-300" : "text-emerald-300")}>{st.label}</span>
                </div>
                <div className="mt-16">
                  <h3 className="font-display text-2xl font-extrabold uppercase leading-none">{p.model}</h3>
                  <dl className="mt-3 grid grid-cols-2 gap-y-1 text-[12px] text-paper/60">
                    <dt>Condition</dt><dd className="text-paper">{pre ? (p.attributes.grade ?? "Pre-owned — grade confirmed on request") : "Brand new"}</dd>
                    <dt>Storage</dt><dd className="text-paper">{p.attributes.storage ?? p.variants[0]?.storage ?? "Confirm on order"}</dd>
                    <dt>Colour</dt><dd className="text-paper">{p.colour ?? p.variants[0]?.colour ?? "Confirm on order"}</dd>
                  </dl>
                  <Price priceCents={p.priceCents} salePriceCents={p.salePriceCents} large className="mt-4 [&_s]:text-paper/50" />
                </div>
              </Link>
            );
          })}
        </div>
        <Reveal className="mt-10 flex flex-wrap gap-3">
          <Link href="/shop/iphones?condition=new" className="btn border-paper bg-paper text-ink hover:bg-bone">Shop new</Link>
          <Link href="/shop/iphones?condition=pre_owned" className="btn border-paper text-paper hover:bg-paper hover:text-ink">Shop pre-owned</Link>
        </Reveal>
      </div>
    </section>
  );
}

export function EditorialSection({ title, sub, href, cta, products, image, label, flip }:
  { title: string; sub: string; href: string; cta: string; products: Product[]; image: string | null; label: string; flip?: boolean }) {
  return (
    <section className="container-x py-20 md:py-28">
      <div className={cn("grid items-stretch gap-6 lg:grid-cols-2", flip && "lg:[&>*:first-child]:order-2")}>
        <Reveal className="relative min-h-[360px] overflow-hidden rounded-[28px]">
          <Plate src={image} label={label} sizes="(min-width:1024px) 50vw, 100vw" />
        </Reveal>
        <Reveal delay={0.08} className="flex flex-col justify-center py-4 lg:px-10">
          <h2 className="display-lg">{title}</h2>
          <p className="mt-4 max-w-md text-lg text-ink/70">{sub}</p>
          <Link href={href} className="btn-primary mt-8 self-start">{cta}</Link>
        </Reveal>
      </div>
      <div className="mt-10"><ProductGrid products={products.slice(0, 4)} /></div>
    </section>
  );
}

export function WhyInvictus() {
  const items = [
    { icon: ShieldCheck, t: "Quality", d: "Authentic products, checked before they reach you." },
    { icon: Tag, t: "Value", d: "Honest prices on new and pre-owned." },
    { icon: Truck, t: "Convenience", d: "Collect in store or get it delivered." },
    { icon: MessageCircle, t: "Customer service", d: "Real people on WhatsApp when you need help." },
  ];
  return (
    <section className="border-y border-ink/10 bg-paper py-16 md:py-20" aria-labelledby="why">
      <div className="container-x">
        <h2 id="why" className="display-lg mb-10">Why Invictus?</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: I, t, d }, i) => (
            <Reveal key={t} delay={i * 0.05}>
              <I className="size-7" strokeWidth={1.5} />
              <h3 className="mt-4 font-display text-lg font-extrabold uppercase">{t}</h3>
              <p className="mt-1.5 text-[14px] text-ink/65">{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewArrivals({ products }: { products: Product[] }) {
  return (
    <section className="container-x py-20 md:py-28">
      <Reveal className="mb-10 text-center">
        <h2 className="display-lg">New arrivals</h2>
        <p className="mt-3 text-ink/70">Fresh in, straight from the warehouse.</p>
      </Reveal>
      <ProductGrid products={products.slice(0, 4)} />
    </section>
  );
}

export function NewsletterBand() {
  return (
    <section className="bg-stone/50 py-16 md:py-20">
      <div className="container-x flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-2xl font-extrabold uppercase md:text-3xl">Join our newsletter</h2>
          <p className="mt-2 text-ink/70">Get updates on arrivals and exclusive offers.</p>
        </div>
        <NewsletterForm />
      </div>
    </section>
  );
}

export { SITE_IMAGES, variantLabel };
