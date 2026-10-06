import { formatZAR, cn } from "@/lib/utils";

export function Price({ priceCents, salePriceCents, className, large }:
  { priceCents: number; salePriceCents?: number | null; className?: string; large?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold", large ? "text-2xl" : "text-[15px]")}>{formatZAR(salePriceCents ?? priceCents)}</span>
      {salePriceCents != null && (
        <s className={cn("text-mist", large ? "text-base" : "text-[13px]")}>{formatZAR(priceCents)}</s>
      )}
    </span>
  );
}
