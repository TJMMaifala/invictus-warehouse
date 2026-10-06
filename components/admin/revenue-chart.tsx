import { formatZAR } from "@/lib/utils";

/** Dependency-free SVG bar chart: revenue per day (bars) with order counts in the tooltip. */
export function RevenueChart({ days }: { days: { date: string; revenue: number; orders: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const w = 720, h = 200, bw = w / days.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h + 24}`} role="img" aria-label="Revenue per day, last 30 days" className="w-full">
        {[0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1="0" x2={w} y1={h - h * t} y2={h - h * t} stroke="currentColor" strokeOpacity=".08" />)}
        {days.map((d, i) => {
          const bh = (d.revenue / max) * h;
          return (
            <g key={d.date}>
              <rect x={i * bw + 2} y={h - bh} width={bw - 4} height={Math.max(bh, d.revenue ? 2 : 0)} rx="2" fill="#0b0b0c">
                <title>{`${d.date}: ${formatZAR(d.revenue)} · ${d.orders} order${d.orders === 1 ? "" : "s"}`}</title>
              </rect>
              {i % 5 === 0 && <text x={i * bw + bw / 2} y={h + 16} textAnchor="middle" fontSize="10" fill="#8a8784">{d.date.slice(5)}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">Peak day {formatZAR(max)}</figcaption>
    </figure>
  );
}
