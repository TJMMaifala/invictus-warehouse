export default function Loading() {
  return <div className="container-x py-24" role="status" aria-label="Loading"><div className="h-8 w-48 animate-pulse rounded bg-stone/60" /><div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] bg-stone/60" />)}</div></div>;
}
