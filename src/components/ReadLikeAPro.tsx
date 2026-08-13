import { useRef, useState, type FormEvent } from 'react'
import type { Book, Genre } from '../data/types'
import GenrePicker from './GenrePicker'
import TagInput from './TagInput'
import BookResultCard from './BookResultCard'
import { allRecommenders, recommendForPro, type RankedBook } from '../lib/recommend'

export default function ReadLikeAPro({ onBack, pool }: { onBack: () => void; pool: Book[] }) {
  const [people, setPeople] = useState<string[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [results, setResults] = useState<RankedBook[] | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const peopleFieldRef = useRef<HTMLDivElement>(null)

  const recommenders = allRecommenders(pool)
  const nameHints = recommenders.map((r) => r.name)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (people.length === 0) return
    setResults(recommendForPro(pool, { people, genres }))
  }

  const refineSearch = () => {
    peopleFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <button onClick={onBack} className="ink-link font-mono text-xs text-ink-faint">
        ← back to Marginalia
      </button>

      <div className="mt-4">
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Read Like a Pro</h1>
        <p className="mt-3 max-w-xl font-serif text-[15px] leading-relaxed text-ink-soft">
          A short reading list drawn from what the people you admire have publicly recommended.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-8">
        <div ref={peopleFieldRef}>
          <span className="font-sans text-sm font-semibold text-ink">Who do you look up to?</span>
          <p className="font-sans text-xs text-ink-faint">Start typing for names we currently cover.</p>
          <div className="mt-2.5">
            <TagInput
              values={people}
              onChange={setPeople}
              placeholder="e.g. Barack Obama, Bill Gates"
              suggestions={nameHints}
            />
          </div>
          {submitted && people.length === 0 && (
            <p className="mt-1.5 font-sans text-xs text-rust-dark">Add at least one person to search their picks.</p>
          )}
        </div>

        <div>
          <span className="font-sans text-sm font-semibold text-ink">Genres you're in the mood for</span>
          <p className="font-sans text-xs text-ink-faint">Optional — leave blank for any genre.</p>
          <div className="mt-2.5">
            <GenrePicker selected={genres} onChange={setGenres} />
          </div>
        </div>

        <button
          type="submit"
          className="self-start rounded-full bg-moss px-6 py-3 font-sans text-sm font-semibold text-paper shadow-card transition-colors hover:bg-moss-dark"
        >
          Show my reading list
        </button>
      </form>

      <details className="mt-8 rounded-lg border border-ink/10 bg-paper-card p-4">
        <summary className="cursor-pointer font-sans text-sm font-semibold text-ink">
          Whose bookshelves do you currently cover?
        </summary>
        <ul className="mt-3 flex flex-wrap gap-2">
          {recommenders.map((r) => (
            <li key={r.name} className="rounded-full border border-ink/15 bg-paper px-3 py-1 font-mono text-[11px] text-ink-soft">
              {r.name} <span className="text-ink-faint">· {r.role}</span>
            </li>
          ))}
        </ul>
      </details>

      {results && (
        <div className="mt-14">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-display text-xl text-ink">
              {results.length > 0 ? 'Books they’ve pointed to' : 'No matches yet'}
            </h2>
            <button
              type="button"
              onClick={refineSearch}
              className="ink-link font-mono text-xs text-ink-faint whitespace-nowrap"
            >
              ✎ refine your search
            </button>
          </div>
          {results.length === 0 && (
            <p className="mt-2 max-w-md font-serif text-[15px] text-ink-soft">
              We don't have documented recommendations for that combination yet — try a name from the list
              above, or loosen your genre filter.
            </p>
          )}
          <ol className="mt-6 flex flex-col gap-8">
            {results.map((r, i) => (
              <BookResultCard key={r.book.id} rank={i + 1} result={r} />
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
