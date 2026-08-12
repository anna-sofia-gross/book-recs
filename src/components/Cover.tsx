import { useState } from 'react'
import type { Book } from '../data/types'

function initials(title: string): string {
  const words = title.replace(/^(the|a|an)\s+/i, '').split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

export default function Cover({ book, size = 'md' }: { book: Book; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(!book.isbn)
  const dims = size === 'lg' ? 'w-28 h-40' : size === 'sm' ? 'w-14 h-20' : 'w-20 h-28'

  if (failed) {
    const [a, b] = book.palette
    return (
      <div
        className={`${dims} shrink-0 rounded-sm shadow-card flex flex-col justify-between p-2 border border-ink/10`}
        style={{ background: `linear-gradient(150deg, ${a}, ${b})` }}
      >
        <span className="font-mono text-[9px] uppercase tracking-widest text-paper/80">{book.genres[0]}</span>
        <span className="font-display text-paper text-lg leading-none">{initials(book.title)}</span>
      </div>
    )
  }

  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`}
      alt={`Cover of ${book.title}`}
      onError={() => setFailed(true)}
      className={`${dims} shrink-0 rounded-sm object-cover shadow-card border border-ink/10 bg-paper-dim`}
    />
  )
}
