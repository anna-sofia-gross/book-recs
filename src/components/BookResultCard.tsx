import { useState, type KeyboardEvent } from 'react'
import Cover from './Cover'
import RatingStamp from './RatingStamp'
import type { RankedBook } from '../lib/recommend'
import { fetchFullDescription } from '../lib/bookDetails'

export default function BookResultCard({ rank, result }: { rank: number; result: RankedBook }) {
  const { book, matchReasons } = result
  const [expanded, setExpanded] = useState(false)
  const [fullSummary, setFullSummary] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const displayedSummary = fullSummary ?? book.summary

  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    if (next && !fullSummary && !loadingMore && (book.isbn || book.googleId)) {
      setLoadingMore(true)
      fetchFullDescription(book).then((desc) => {
        if (desc && desc.length > book.summary.length) setFullSummary(desc)
        setLoadingMore(false)
      })
    }
  }

  const handleSummaryKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleExpanded()
    }
  }

  return (
    <li
      onClick={toggleExpanded}
      className="group relative cursor-pointer rounded-xl border border-ink/10 bg-paper-card p-5 sm:p-6 shadow-card"
    >
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

          <p
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            onKeyDown={handleSummaryKeyDown}
            className={`mt-3 font-serif text-[15px] leading-relaxed text-ink-soft ${expanded ? '' : 'line-clamp-3'}`}
          >
            {displayedSummary}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded()
              }}
              className="font-mono text-xs text-rust hover:underline"
            >
              {expanded ? 'Show less ▲' : 'Read more ▾'}
            </button>
            {expanded && loadingMore && <span className="font-mono text-xs text-ink-faint">loading more…</span>}
          </div>

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
