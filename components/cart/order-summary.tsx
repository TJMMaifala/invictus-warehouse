import type { Quote } from "@/lib/pricing";
import { formatZAR } from "@/lib/utils";

export function Totals({ quote, showDelivery = true }: { quote: Quote; showDelivery?: boolean }) {
  const Row = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => (
    <div className={`flex justify-between ${strong ? "border-t border-ink/15 pt-3 text-lg font-bold" : "text-[14px]"}`}><dt>{k}</dt><dd>{v}</dd></div>
  );
  return (
    <dl className="space-y-2">
      <Row k="Subtotal" v={formatZAR(quote.subtotalCents)} />
      {showDelivery && <Row k="Delivery" v={quote.deliveryCents ? formatZAR(quote.deliveryCents) : "Free"} />}
      {quote.discountCents > 0 && <Row k={`Discount${quote.couponCode ? ` (${quote.couponCode})` : ""}`} v={`-${formatZAR(quote.discountCents)}`} />}
      <Row k="Total" v={formatZAR(quote.totalCents)} strong />
    </dl>
  );
}
