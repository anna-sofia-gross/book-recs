import Cover from './Cover'
import RatingStamp from './RatingStamp'
import type { RankedBook } from '../lib/recommend'

export default function BookResultCard({ rank, result }: { rank: number; result: RankedBook }) {
  const { book, matchReasons } = result
  return (
    <li className="group relative rounded-xl border border-ink/10 bg-paper-card p-5 sm:p-6 shadow-card">
      <span className="absolute -top-3 -left-3 flex h-9 w-9 items-center justify-center rounded-full bg-rust font-display text-lg text-paper shadow-card">
        {rank}
      </span>
      <div className="flex gap-5">
        <Cover book={book} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-xl leading-snug text-ink">{book.title}</h3>
              <p className="font-sans text-sm text-ink-faint">{book.author}{book.year ? ` · ${book.year}` : ''}</p>
            </div>
            <RatingStamp rating={book.goodreadsRating} count={book.ratingsLabel} />
          </div>

          <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-soft">{book.summary}</p>

          {book.whyThisPlace && (
            <p className="mt-3 border-l-2 border-rust/60 pl-3 font-serif text-[15px] italic leading-relaxed text-ink">
              {book.whyThisPlace}
            </p>
          )}

          {matchReasons.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1.5">
              {matchReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 font-mono text-xs text-moss-dark">
                  <span aria-hidden>—</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {book.genres.map((g) => (
              <span key={g} className="rounded-full bg-paper-dim px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>
    </li>
  )
}
