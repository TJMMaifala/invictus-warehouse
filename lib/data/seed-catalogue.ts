/**
 * INITIAL SEED CATALOGUE — taken from the current Invictus Warehouse listing.
 *
 * This file is used for two things only:
 *   1. generating supabase/seed.sql   (npm run seed:sql)
 *   2. DEMO MODE when Supabase env vars are not configured
 * In production every product lives in the database and is edited in /admin.
 *
 * Prices are in rand (converted to cents on import).
 * Stock quantities, storage, battery health and pre-owned grades were NOT in
 * the source listing — they are PLACEHOLDERS to be corrected in /admin.
 */
import type { CategorySlug } from "@/types";

export interface SeedProduct {
  name: string;
  category: CategorySlug;
  brand: string;
  model: string;
  colour?: string;
  imageUrl?: string;
  condition: "new" | "pre_owned";
  priceRand: number;
  /** true when the source listing had no price and the category default was used */
  priceAssumed?: boolean;
  featured?: boolean;
}

export const SNEAKER_SIZES = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"];
export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const CLOTHING_IMAGE_NAMES = new Set([
  "Nike Air Oversized Crew",
  "Nike Club Fleece Hoodie",
  "Nike Dri-FIT Training Tee",
  "Nike Run Division Zip Hoodie",
  "Nike Sportswear French Terry Joggers",
  "Nike Tech Fleece Full-Zip Jacket",
  "Nike Tech Fleece Long Sleeve Set Blue",
  "Nike Tech Fleece Long Sleeve Set Grey",
  "Nike x Nocta Reversible Puffer Jacket",
]);

const sneaker = (
  name: string,
  model: string,
  colour: string,
  extra: Partial<SeedProduct> = {},
): SeedProduct => ({
  name,
  category: "sneakers",
  brand: "Nike",
  model,
  colour,
  condition: "new",
  priceRand: 950,
  ...extra,
});

const clothingItem = (
  name: string,
  model: string,
  brand: string,
  colour: string,
  priceRand: number,
  extra: Partial<SeedProduct> = {},
): SeedProduct => ({
  name,
  category: "clothing",
  brand,
  model,
  colour,
  ...(CLOTHING_IMAGE_NAMES.has(name)
    ? { imageUrl: `/images/clothing/${encodeURIComponent(`${name}.jpg`)}` }
    : {}),
  condition: "new",
  priceRand,
  ...extra,
});

export const SEED_CATEGORIES = [
  { slug: "sneakers", name: "Sneakers", description: "Nike Shox, Air Max and more.", sort: 1 },
  { slug: "iphones", name: "iPhones", description: "Brand new and carefully selected pre-owned.", sort: 2 },
  { slug: "clothing", name: "Clothing", description: "Tech Fleece, outerwear and everyday staples.", sort: 3 },
  { slug: "invictus-collection", name: "Invictus Collection", description: "House pieces from Invictus Warehouse.", sort: 4 },
] as const;

export const SEED_PRODUCTS: SeedProduct[] = [
  // ---- Sneakers ----
  sneaker("Nike Shox TL White", "Shox TL", "White", { featured: true }),
  sneaker("Nike Air Max Portal Black", "Air Max Portal", "Black", { featured: true }),
  sneaker("Nike Air Max Portal Crimson", "Air Max Portal", "Crimson"),
  sneaker("Nike Shox TL Black", "Shox TL", "Black", { featured: true }),
  sneaker("Nike Air Max Portal Black/White/Metallic Silver", "Air Max Portal", "Black/White/Metallic Silver"),
  sneaker("Nike Air Max Portal Racer Blue", "Air Max Portal", "Racer Blue"),
  sneaker("Nike Air Max Portal Bright Ceramic", "Air Max Portal", "Bright Ceramic"),
  sneaker("Nike Portal Panda", "Air Max Portal", "Black/White"),
  sneaker('Nike Shox "Playful Pink"', "Shox TL", "Playful Pink"),
  sneaker("Nike Women's Shox TL Metallic Platinum/Pinksicle", "Shox TL", "Metallic Platinum/Pinksicle"),
  sneaker("Nike Shox TL Black Lyon Blue Varsity Maize", "Shox TL", "Black/Lyon Blue/Varsity Maize", { priceAssumed: true }),
  sneaker('Nike Shox TL "Sunrise"', "Shox TL", "Sunrise"),
  sneaker('Nike Air Max Plus "Triple Black"', "Air Max Plus", "Triple Black", { featured: true }),
  sneaker('Nike Air Max Plus/TN OG "Pimento"', "Air Max Plus", "Pimento"),
  sneaker("Nike Air Max Plus Killer Whale Black White", "Air Max Plus", "Black/White"),
  sneaker("Nike Air Max Plus White", "Air Max Plus", "White"),
  sneaker("Nike Air Max Plus TN Ultra Black Silver", "Air Max Plus", "Black/Silver"),
  sneaker('Nike Air Max SNDR Gore-Tex "Black"', "Air Max SNDR", "Black"),
  sneaker('Nike Air Max SNDR "Hydrangeas and Hyper Violet"', "Air Max SNDR", "Hydrangeas/Hyper Violet"),
  sneaker("Nike MIND 001 Solar Red", "MIND 001", "Solar Red"),

  // ---- Pre-owned iPhones ----
  ...(
    [
      ["iPhone 11", 4000],
      ["iPhone 13", 5999],
      ["iPhone XR", 3600],
      ["iPhone 12", 5100],
      ["iPhone 11 Pro", 5600],
      ["iPhone 12 Pro", 7000],
      ["iPhone 12 Pro Max", 7800],
    ] as const
  ).map(
    ([m, p]): SeedProduct => ({
      name: `Pre-owned ${m}`,
      category: "iphones",
      brand: "Apple",
      model: m,
      imageUrl: `/images/iphones/${encodeURIComponent(`${m}.jpg`)}`,
      condition: "pre_owned",
      priceRand: p,
      featured: m === "iPhone 13",
    }),
  ),

  // ---- Brand new iPhones ----
  ...(
    [
      ["iPhone 7 Plus", 3200],
      ["iPhone 8", 3300],
      ["iPhone 8 Plus", 3700],
      ["iPhone X", 4000],
      ["iPhone XR", 4300],
      ["iPhone 11", 5000],
      ["iPhone 11 Pro", 6800],
      ["iPhone 11 Pro Max", 7300],
      ["iPhone 12", 5700],
      ["iPhone 12 Pro", 8600],
      ["iPhone 12 Pro Max", 9900],
      ["iPhone 13", 7999],
      ["iPhone 13 Pro", 11000],
      ["iPhone 13 Pro Max", 10200],
      ["iPhone 14", 7800],
      ["iPhone 14 Plus", 11500],
      ["iPhone 14 Pro", 13800],
      ["iPhone 14 Pro Max", 16000],
      ["iPhone 15 Plus", 14000],
      ["iPhone 15 Pro", 16600],
    ] as const
  ).map(
    ([m, p]): SeedProduct => ({
      name: m,
      category: "iphones",
      brand: "Apple",
      model: m,
      imageUrl: `/images/iphones/${encodeURIComponent(`${m}.jpg`)}`,
      condition: "new",
      priceRand: p,
      featured: m === "iPhone 15 Pro",
    }),
  ),

  // ---- Clothing ----
  clothingItem("Nike Tech Fleece Long Sleeve Set Grey", "Tech Fleece", "Nike", "Grey", 1600, { featured: true }),
  clothingItem("Nike x Nocta Reversible Puffer Jacket", "Reversible Puffer Jacket", "Nike x Nocta", "Black", 1600, { featured: true }),
  clothingItem("Nike Tech Fleece Long Sleeve Set Blue", "Tech Fleece", "Nike", "Blue", 1600),
  clothingItem("Nike Club Fleece Hoodie", "Club Fleece", "Nike", "Charcoal", 1200),
  clothingItem("Jordan Essentials Track Jacket", "Essentials Track Jacket", "Jordan", "Black", 1800),
  clothingItem("Nike Dri-FIT Training Tee", "Dri-FIT Tee", "Nike", "White", 650),
  clothingItem("Nike Sportswear French Terry Joggers", "French Terry Joggers", "Nike", "Stone", 1100),
  clothingItem("Nike Air Oversized Crew", "Air Oversized Crew", "Nike", "Cream", 900),
  clothingItem("Nike Run Division Zip Hoodie", "Run Division Hoodie", "Nike", "Midnight", 1450),
  clothingItem("Nike Tech Fleece Full-Zip Jacket", "Tech Fleece", "Nike", "Forest Green", 1700),
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Unique slug per seed product (pre-owned and new iPhones share model names). */
export function seedSlug(p: SeedProduct): string {
  return slugify(p.name);
}

/** Deterministic PLACEHOLDER stock so the demo shows all three stock states. */
export function placeholderStock(productIndex: number, sizeIndex: number): number {
  return (productIndex * 3 + sizeIndex * 5) % 6 === 0 ? 0 : ((productIndex + sizeIndex) % 4) + 1;
}
