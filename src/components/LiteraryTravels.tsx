import { useState, type FormEvent } from 'react'
import type { Book, Genre } from '../data/types'
import GenrePicker from './GenrePicker'
import BookResultCard from './BookResultCard'
import { allLocationHints, recommendForTravel, type RankedBook } from '../lib/recommend'

type ConnectState = 'goodreads' | 'fable' | null

export default function LiteraryTravels({ onBack, pool }: { onBack: () => void; pool: Book[] }) {
  const [location, setLocation] = useState('')
  const [genres, setGenres] = useState<Genre[]>([])
  const [connected, setConnected] = useState<ConnectState>(null)
  const [results, setResults] = useState<RankedBook[] | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const locationHints = allLocationHints(pool)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!location.trim()) return
    setResults(recommendForTravel(pool, { location, genres, connectedService: connected }))
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <button onClick={onBack} className="ink-link font-mono text-xs text-ink-faint">
        ← back to Marginalia
      </button>

      <div className="mt-4">
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Literary Travels</h1>
        <p className="mt-3 max-w-xl font-serif text-[15px] leading-relaxed text-ink-soft">
          Five books chosen to make your destination feel familiar before you arrive.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-8">
        <div>
          <label htmlFor="location" className="font-sans text-sm font-semibold text-ink">
            Where are you headed?
          </label>
          <input
            id="location"
            list="location-hints"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Kyoto, Japan"
            className="mt-2 w-full rounded-lg border border-ink/20 bg-paper-card px-3 py-2.5 font-sans text-sm outline-none placeholder:text-ink-faint focus:border-rust"
          />
          <datalist id="location-hints">
            {locationHints.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          {submitted && !location.trim() && (
            <p className="mt-1.5 font-sans text-xs text-rust-dark">Tell us where you're going first.</p>
          )}
        </div>

        <div>
          <span className="font-sans text-sm font-semibold text-ink">Genres you're in the mood for</span>
          <p className="font-sans text-xs text-ink-faint">Optional — leave blank for any genre.</p>
          <div className="mt-2.5">
            <GenrePicker selected={genres} onChange={setGenres} />
          </div>
        </div>

        <div>
          <span className="font-sans text-sm font-semibold text-ink">Already-read shelf</span>
          <p className="font-sans text-xs text-ink-faint">
            Connect a profile to automatically exclude books you've logged. (Demo — simulates the exclusion,
            no real account access.)
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {(['goodreads', 'fable'] as const).map((svc) => (
              <button
                key={svc}
                type="button"
                onClick={() => setConnected(connected === svc ? null : svc)}
                className={`rounded-full border px-3.5 py-1.5 font-sans text-sm capitalize transition-colors ${
                  connected === svc
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/20 bg-paper-card text-ink-soft hover:border-ink/40'
                }`}
              >
                {connected === svc ? `✓ ${svc} connected` : `Connect ${svc}`}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="self-start rounded-full bg-rust px-6 py-3 font-sans text-sm font-semibold text-paper shadow-card transition-colors hover:bg-rust-dark"
        >
          Show my five books
        </button>
      </form>

      {results && (
        <div className="mt-14">
          <h2 className="font-display text-xl text-ink">
            {results.length > 0 ? `Reading list for ${location.trim()}` : `Nothing landed for "${location.trim()}"`}
          </h2>
          {results.length === 0 && (
            <p className="mt-2 max-w-md font-serif text-[15px] text-ink-soft">
              We don't have a strong enough match yet — try a nearby city, region, or country, or loosen your
              genre filters.
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
