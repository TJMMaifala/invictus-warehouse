import type { Metadata } from "next";
import { WishlistView } from "@/components/account/wishlist-view";
export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };
export default function WishlistPage() {
  return <div className="container-x py-12 md:py-16"><h1 className="display-lg mb-10">Wishlist</h1><WishlistView /></div>;
}
