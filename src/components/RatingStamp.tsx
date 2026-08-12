export default function RatingStamp({ rating, count }: { rating: number; count: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper-card px-2.5 py-1 shadow-stamp">
      <span aria-hidden className="text-gold text-sm leading-none">★</span>
      <span className="font-mono text-xs font-bold tracking-tight">{rating.toFixed(2)}</span>
      <span className="font-mono text-[10px] text-ink-faint">· {count}</span>
    </div>
  )
}
