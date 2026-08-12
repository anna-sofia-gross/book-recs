import { books as curatedBooks } from '../data/books'
import type { Book } from '../data/types'

let cache: Promise<Book[]> | null = null

function dedupeKey(b: Book): string {
  return `${b.title}|${b.author}`.toLowerCase().replace(/[^a-z0-9|]+/g, '')
}

/**
 * Merges a batch of books into the accumulator map, keyed by title+author.
 * On a collision, fields are unioned rather than overwritten — e.g. a book
 * that's both location-tagged (from the travel catalog) and has a
 * recommendedBy (from the recommender catalog) keeps both, instead of
 * whichever source happened to load last clobbering the other.
 */
function mergeInto(map: Map<string, Book>, incoming: Book[]) {
  for (const b of incoming) {
    const key = dedupeKey(b)
    const existing = map.get(key)
    if (!existing) {
      map.set(key, b)
    } else {
      map.set(key, {
        ...existing,
        isbn: existing.isbn ?? b.isbn,
        year: existing.year ?? b.year,
        locationTags: existing.locationTags ?? b.locationTags,
        recommendedBy: existing.recommendedBy ?? b.recommendedBy,
        whyThisPlace: existing.whyThisPlace ?? b.whyThisPlace,
      })
    }
  }
}

async function fetchJson(path: string): Promise<Book[]> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}${path}`)
    return r.ok ? ((await r.json()) as Book[]) : []
  } catch {
    return []
  }
}

/**
 * Three sources merged at runtime, in priority order:
 *  1. The curated set (editorial "why this place" copy + documented
 *     recommendedBy attributions).
 *  2. travel-catalog.json — bulk-imported, location-tagged books from a
 *     Kaggle Goodreads export (real ratings/settings, no attributions).
 *  3. recommender-catalog.json — bulk-imported books with recommendedBy,
 *     joined from a separate public-figure-recommendations dataset against
 *     the same Goodreads ratings for a real rating (no fabricated numbers).
 * Both bulk files live in /public as plain static assets, fetched once and
 * cached, rather than bundled into the JS chunk.
 */
export function loadCatalog(): Promise<Book[]> {
  if (!cache) {
    cache = Promise.all([fetchJson('data/travel-catalog.json'), fetchJson('data/recommender-catalog.json')])
      .then(([travel, recommenders]) => {
        const map = new Map<string, Book>()
        mergeInto(map, curatedBooks)
        mergeInto(map, travel)
        mergeInto(map, recommenders)
        return Array.from(map.values())
      })
      .catch(() => curatedBooks)
  }
  return cache
}
