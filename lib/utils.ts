import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** cents -> "R5,999" (no decimals when whole rand, matching the storefront style) */
export function formatZAR(cents: number): string {
  const rand = cents / 100;
  const whole = Number.isInteger(rand);
  return (
    "R" +
    rand.toLocaleString("en-ZA", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    }).replace(/\s/g, ",")
  );
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function whatsappLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
