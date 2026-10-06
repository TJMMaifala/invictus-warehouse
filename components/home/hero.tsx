import Link from "next/link";
import { Plate } from "./plate";
import { SITE_IMAGES } from "@/lib/site-images";
import { Reveal } from "./reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-bone pt-24 md:pt-28">
      <div className="container-x grid min-h-[calc(100svh-6rem)] items-center gap-10 pb-12 lg:grid-cols-[1.05fr_1fr] lg:pb-16">
        <div className="relative z-10">
          <Reveal><p className="eyebrow mb-5">Invictus Warehouse · South Africa</p></Reveal>
          <Reveal delay={0.05}>
            <h1 className="display-xl">Style.<br />Tech.<br />Your way.</h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">
              Premium sneakers, clothing and iPhones curated for everyday life.
            </p>
          </Reveal>
          <Reveal delay={0.25} className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">Shop collection</Link>
            <Link href="/shop/iphones" className="btn-secondary">Explore iPhones</Link>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] sm:aspect-[5/4] lg:aspect-[4/5]">
            <Plate src={SITE_IMAGES.hero} label="Style. Tech." sizes="(min-width:1024px) 45vw, 100vw" priority />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
