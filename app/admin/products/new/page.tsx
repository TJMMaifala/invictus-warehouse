import { ProductForm } from "@/components/admin/product-form";
import { getSizeSets } from "@/lib/data/admin";

export default async function NewProduct() {
  return (
    <div><h1 className="display-lg mb-8 !text-4xl">New product</h1>
      <ProductForm sizeSets={await getSizeSets()} initial={{ name: "", slug: "", description: "", categorySlug: "sneakers", brand: "", model: "", colour: "", condition: "new", priceRand: 0, salePriceRand: null, featured: false, published: false, archived: false, attributes: {}, images: [], variants: [] }} />
    </div>
  );
}
