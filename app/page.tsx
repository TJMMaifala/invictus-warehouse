import { Hero } from "@/components/home/hero";
import { CategoryCards } from "@/components/home/category-cards";
import { EditorialSection, FeaturedDrops, IphoneSection, NewArrivals, NewsletterBand, WhyInvictus } from "@/components/home/sections";
import { getProducts } from "@/lib/data/catalogue";
import { SITE_IMAGES } from "@/lib/site-images";

export default async function Home() {
  const [featured, iphones, sneakers, clothing, newest] = await Promise.all([
    getProducts({ sort: "featured" }), getProducts({ category: "iphones", sort: "featured" }),
    getProducts({ category: "sneakers", sort: "featured" }), getProducts({ category: "clothing", sort: "featured" }),
    getProducts({ sort: "newest" }),
  ]);
  return (
    <>
      <Hero />
      <CategoryCards />
      <FeaturedDrops products={featured.filter((p) => p.featured)} />
      <IphoneSection products={iphones} />
      <EditorialSection title="Step into something different" sub="Nike Shox, Air Max Plus, Portal and more. Find your size, filter by colour and model."
        href="/shop/sneakers" cta="Shop sneakers" products={sneakers} image={SITE_IMAGES.sneakerSection} label="Sneakers" />
      <EditorialSection flip title="Built for everyday" sub="Tech Fleece sets and statement outerwear designed for comfort and movement."
        href="/shop/clothing" cta="Shop clothing" products={clothing} image={SITE_IMAGES.clothingSection} label="Clothing" />
      <WhyInvictus />
      <NewArrivals products={newest} />
      <NewsletterBand />
    </>
  );
}
