"use client";
import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
export function ClearCart() {
  const { clear, hydrated } = useCart();
  useEffect(() => { if (hydrated) clear(); }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
