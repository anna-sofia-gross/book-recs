import { COUNTRIES } from '../data/countries'
import type { Book, Genre } from '../data/types'

/**
 * Defunct/historical political entities that show up in crowd-sourced book
 * "setting" tags (a Cold War novel genuinely gets tagged "East Germany" or
 * "Soviet Union" by Goodreads readers). Legitimate for matching — someone
 * who types "Soviet Union" should still find that book — but not something
 * to suggest in the location autocomplete, since nobody travels there today.
 */
const DEFUNCT_LOCATIONS = new Set([
  'german democratic republic', 'east germany', 'west germany',
  'soviet union', 'ussr', 'petrograd soviet',
  'czechoslovakia', 'yugoslavia',
  'ottoman empire', 'austro-hungarian empire', 'austria-hungary',
  'prussia', 'east prussia',
  'rhodesia', 'southern rhodesia',
  'siam', 'ceylon', 'persia', 'persian empire',
  'indochina', 'french indochina', 'british raj', 'british india',
  'byzantine empire', 'roman empire', 'the roman empire', 'holy roman empire',
  'gaul', 'mesopotamia', 'bohemia', 'dahomey', 'transvaal', 'gold coast',
])

export const TRAVEL_MIN_RATING = 3.8
export const PRO_MIN_RATING = 3.4

/**
 * Genres with a strong, distinct reader expectation — a book tagged one of
 * these only shows up when the user explicitly asked for it. Without this,
 * a book tagged both "Young Adult" and "Fiction" (e.g. Astrid Lindgren) or
 * "Mystery/Thriller" and "Fiction" (e.g. Stieg Larsson) surfaces for any
 * plain "Fiction" search purely because "Fiction" is one of its several
 * genre tags, crowding out books that are Fiction *without* also being a
 * thriller or aimed at teens. Broad/umbrella genres (Fiction, Nonfiction,
 * Literary Fiction, Classic, etc.) stay opt-out as before — only genres
 * that represent a distinct format or audience are opt-in.
 */
const EXCLUSIVE_GENRES: Genre[] = ['Young Adult', 'Mystery/Thriller', 'Romance', 'Horror', 'Sci-Fi/Fantasy']

/** True if a book carries an exclusive genre the user didn't ask for. */
function blockedByExclusiveGenre(book: Book, selectedGenres: Genre[]): boolean {
  if (selectedGenres.length === 0) return false // "any genre" — don't filter
  return book.genres.some((g) => EXCLUSIVE_GENRES.includes(g) && !selectedGenres.includes(g))
}

/**
 * Stand-in for a real Goodreads/Fable OAuth read-shelf pull. There's no public
 * Goodreads API to connect to (it was shut down to new developers in 2020),
 * so "connecting" a profile simulates what the exclusion would look like.
 */
export const MOCK_CONNECTED_SHELF: Record<string, string[]> = {
  goodreads: ['the-alchemist', 'the-great-gatsby', 'life-of-pi', 'sapiens'],
  fable: ['normal-people', 'educated', 'the-shadow-of-the-wind'],
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * Matches a location tag against one comma-separated segment of the user's
 * query (e.g. "Kyoto, Japan" -> ["kyoto", "japan"]). Containment is only
 * allowed when the shorter phrase has 2+ words, so a short, ambiguous tag
 * like "york" can't match purely by being a substring fragment of "new
 * york" — it has to equal a whole query segment instead.
 */
function placeMatches(tag: string, querySegments: string[]): boolean {
  return querySegments.some((seg) => {
    if (tag === seg) return true
    const shorter = tag.length <= seg.length ? tag : seg
    const longer = tag.length <= seg.length ? seg : tag
    return shorter.split(' ').length >= 2 && longer.includes(shorter)
  })
}

export interface TravelInput {
  location: string
  genres: Genre[]
  connectedService?: 'goodreads' | 'fable' | null
}

export interface RankedBook {
  book: Book
  matchReasons: string[]
  score: number
}

export function recommendForTravel(pool: Book[], input: TravelInput): RankedBook[] {
  const locSegments = normalize(input.location)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const connectedIds = input.connectedService ? MOCK_CONNECTED_SHELF[input.connectedService] ?? [] : []

  const candidates = pool.filter((b) => {
    if (b.goodreadsRating < TRAVEL_MIN_RATING) return false
    if (connectedIds.includes(b.id)) return false
    if (blockedByExclusiveGenre(b, input.genres)) return false
    return true
  })

  const ranked: RankedBook[] = candidates.map((book) => {
    const reasons: string[] = []
    let score = 0

    const tags = book.locationTags ?? []
    const locHit = locSegments.length > 0 && tags.some((tag) => placeMatches(tag, locSegments))
    if (locHit) {
      score += 50
      reasons.push(`Set in or around ${input.location.trim()}`)
    }

    const genreOverlap = book.genres.filter((g) => input.genres.includes(g))
    if (genreOverlap.length > 0) {
      score += genreOverlap.length * 8
      reasons.push(`Matches your ${genreOverlap.join(' & ')} preference`)
    }

    score += (book.goodreadsRating - TRAVEL_MIN_RATING) * 10

    if (!locHit) score -= 200 // heavily deprioritize (effectively exclude) place mismatches

    return { book, matchReasons: reasons, score }
  })

  return ranked
    .filter((r) => r.score > -100)
    .sort((a, b) => b.score - a.score || b.book.goodreadsRating - a.book.goodreadsRating)
    .slice(0, 5)
}

export interface ProInput {
  people: string[]
  genres: Genre[]
}

export function recommendForPro(pool: Book[], input: ProInput): RankedBook[] {
  const peopleTerms = input.people.map(normalize).filter(Boolean)
  if (peopleTerms.length === 0) return []

  const candidates = pool.filter((b) => {
    if (b.goodreadsRating < PRO_MIN_RATING) return false
    if (!b.recommendedBy || b.recommendedBy.length === 0) return false
    if (blockedByExclusiveGenre(b, input.genres)) return false
    return b.recommendedBy.some((r) => peopleTerms.some((p) => normalize(r.name).includes(p) || p.includes(normalize(r.name))))
  })

  const ranked: RankedBook[] = candidates.map((book) => {
    const reasons: string[] = []
    let score = 0

    const matchedPeople = (book.recommendedBy ?? []).filter((r) =>
      peopleTerms.some((p) => normalize(r.name).includes(p) || p.includes(normalize(r.name))),
    )
    score += matchedPeople.length * 40
    matchedPeople.forEach((m) => reasons.push(`Recommended by ${m.name} — ${m.context}`))

    const genreOverlap = book.genres.filter((g) => input.genres.includes(g))
    if (genreOverlap.length > 0) {
      score += genreOverlap.length * 8
      reasons.push(`Matches your ${genreOverlap.join(' & ')} preference`)
    } else if (input.genres.length > 0) {
      score -= 15
    }

    score += (book.goodreadsRating - PRO_MIN_RATING) * 6

    return { book, matchReasons: reasons, score }
  })

  return ranked.sort((a, b) => b.score - a.score || b.book.goodreadsRating - a.book.goodreadsRating).slice(0, 5)
}

export function allRecommenders(pool: Book[]): { name: string; role: string }[] {
  const map = new Map<string, string>()
  pool.forEach((b) => (b.recommendedBy ?? []).forEach((r) => map.set(r.name, r.role)))
  return Array.from(map.entries()).map(([name, role]) => ({ name, role }))
}

export function allLocationHints(pool: Book[]): string[] {
  const set = new Set<string>(COUNTRIES)
  pool.forEach((b) => (b.locationTags ?? []).forEach((t) => {
    if (t !== 'world' && t !== 'general' && !DEFUNCT_LOCATIONS.has(t)) set.add(t)
  }))
  return Array.from(set).sort()
}
