"use client";
import type { ReactNode } from "react";
import { CartProvider } from "@/hooks/use-cart";
import { WishlistProvider } from "@/hooks/use-wishlist";
import { CartDrawer } from "@/components/cart/cart-drawer";

export function Providers({ children, signedIn }: { children: ReactNode; signedIn: boolean }) {
  return (
    <CartProvider>
      <WishlistProvider signedIn={signedIn}>
        {children}
        <CartDrawer />
      </WishlistProvider>
    </CartProvider>
  );
}
