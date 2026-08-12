import { books as curatedBooks } from '../data/books'
import type { Book } from '../data/types'

let cache: Promise<Book[]> | null = null

function dedupeKey(b: Book): string {
  return `${b.title}|${b.author}`.toLowerCase().replace(/[^a-z0-9|]+/g, '')
}

/**
 * The curated set (with editorial "why this place" copy and documented
 * recommendedBy attributions) plus the bulk-imported travel catalog
 * (real ratings/settings from a Kaggle Goodreads export, no attributions).
 * Fetched once and cached — the bulk file lives in /public so it's a plain
 * static asset, not bundled into the JS chunk.
 *
 * The two sources overlap (many well-known curated picks are also in the
 * bulk "Best Books Ever" export) — curated entries are kept and their bulk
 * duplicates dropped, since the curated version carries editorial context
 * and attributions the bulk one doesn't.
 */
export function loadCatalog(): Promise<Book[]> {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}data/travel-catalog.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Book[]>) : Promise.resolve([])))
      .then((bulk: Book[]) => {
        const curatedKeys = new Set(curatedBooks.map(dedupeKey))
        const deduped = bulk.filter((b) => !curatedKeys.has(dedupeKey(b)))
        return [...curatedBooks, ...deduped]
      })
      .catch(() => curatedBooks)
  }
  return cache
}
