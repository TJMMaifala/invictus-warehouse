import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Plate } from "./plate";
import { SITE_IMAGES } from "@/lib/site-images";
import { Reveal } from "./reveal";

const CARDS = [
  { slug: "sneakers", name: "Sneakers", desc: "Shox, Air Max and everyday icons." },
  { slug: "iphones", name: "iPhones", desc: "Brand new and carefully selected pre-owned." },
  { slug: "clothing", name: "Clothing", desc: "Tech Fleece, outerwear and staples." },
  { slug: "invictus-collection", name: "Invictus Collection", desc: "Pieces made for Invictus." },
] as const;

export function CategoryCards() {
  return (
    <section aria-labelledby="cats" className="bg-paper py-4 sm:py-5">
      <h2 id="cats" className="sr-only">Shop by category</h2>
      <div className="container-x grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {CARDS.map((c, i) => (
          <Reveal key={c.slug} delay={i * 0.06}>
            <Link href={`/shop/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] bg-stone">
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]">
                <Plate src={SITE_IMAGES.categories[c.slug]} label={c.name} sizes="(min-width:1024px) 25vw, 50vw" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h3 className="font-display text-lg font-extrabold uppercase leading-tight sm:text-2xl">{c.name}</h3>
                <p className="mt-1 hidden text-[13px] text-ink/70 sm:block">{c.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em]">
                  Shop now <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
