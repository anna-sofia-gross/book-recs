import { useState } from 'react'
import type { Book } from '../data/types'

type Source = 'openlibrary' | 'google' | 'none'

function initials(title: string): string {
  const words = title.replace(/^(the|a|an)\s+/i, '').split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

function firstSource(book: Book): Source {
  if (book.isbn) return 'openlibrary'
  if (book.googleId) return 'google'
  return 'none'
}

function nextSource(current: Source, book: Book): Source {
  if (current === 'openlibrary') return book.googleId ? 'google' : 'none'
  return 'none'
}

const SRC_URL: Record<Exclude<Source, 'none'>, (book: Book) => string> = {
  openlibrary: (book) => `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`,
  google: (book) => `https://books.google.com/books/content?id=${book.googleId}&printsec=frontcover&img=1&zoom=1`,
}

export default function Cover({ book, size = 'md' }: { book: Book; size?: 'sm' | 'md' | 'lg' }) {
  const [source, setSource] = useState<Source>(() => firstSource(book))
  const dims = size === 'lg' ? 'w-28 h-40' : size === 'sm' ? 'w-14 h-20' : 'w-20 h-28'

  if (source === 'none') {
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
      src={SRC_URL[source](book)}
      alt={`Cover of ${book.title}`}
      onError={() => setSource((s) => nextSource(s, book))}
      onLoad={(e) => {
        // Both Open Library and Google Books can return a real HTTP 200 with
        // a tiny placeholder image (rather than a 404) when they have no
        // cover for a given ID, so onError alone won't catch those — check
        // actual pixel size too.
        if (e.currentTarget.naturalWidth < 25) setSource((s) => nextSource(s, book))
      }}
      className={`${dims} shrink-0 rounded-sm object-cover shadow-card border border-ink/10 bg-paper-dim`}
    />
  )
}
