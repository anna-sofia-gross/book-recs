import { books } from '../data/books'
import type { Book, Genre } from '../data/types'

export const TRAVEL_MIN_RATING = 3.8
export const PRO_MIN_RATING = 3.4

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

function titleMatches(book: Book, readTitles: string[]): boolean {
  const t = normalize(book.title)
  const a = normalize(book.author)
  return readTitles.some((r) => {
    const rn = normalize(r)
    if (!rn) return false
    return t === rn || t.includes(rn) || rn.includes(t) || a.includes(rn)
  })
}

export interface TravelInput {
  location: string
  genres: Genre[]
  booksEnjoyed: string[]
  connectedService?: 'goodreads' | 'fable' | null
}

export interface RankedBook {
  book: Book
  matchReasons: string[]
  score: number
}

export function recommendForTravel(input: TravelInput): RankedBook[] {
  const locQuery = normalize(input.location)
  const locTerms = locQuery.split(/[,\s]+/).filter(Boolean)
  const readTitles = [
    ...input.booksEnjoyed,
    ...(input.connectedService ? MOCK_CONNECTED_SHELF[input.connectedService] ?? [] : []),
  ]
  const connectedIds = input.connectedService ? MOCK_CONNECTED_SHELF[input.connectedService] ?? [] : []

  const candidates = books.filter((b) => {
    if (b.goodreadsRating < TRAVEL_MIN_RATING) return false
    if (connectedIds.includes(b.id)) return false
    if (titleMatches(b, input.booksEnjoyed)) return false
    return true
  })

  const ranked: RankedBook[] = candidates.map((book) => {
    const reasons: string[] = []
    let score = 0

    const tags = book.locationTags ?? []
    const locHit = locTerms.length > 0 && tags.some((tag) => locTerms.some((term) => tag.includes(term) || term.includes(tag)))
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

export function recommendForPro(input: ProInput): RankedBook[] {
  const peopleTerms = input.people.map(normalize).filter(Boolean)
  if (peopleTerms.length === 0) return []

  const candidates = books.filter((b) => {
    if (b.goodreadsRating < PRO_MIN_RATING) return false
    if (!b.recommendedBy || b.recommendedBy.length === 0) return false
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

export function allGenres(): Genre[] {
  const set = new Set<Genre>()
  books.forEach((b) => b.genres.forEach((g) => set.add(g)))
  return Array.from(set).sort()
}

export function allRecommenders(): { name: string; role: string }[] {
  const map = new Map<string, string>()
  books.forEach((b) => (b.recommendedBy ?? []).forEach((r) => map.set(r.name, r.role)))
  return Array.from(map.entries()).map(([name, role]) => ({ name, role }))
}

export function allLocationHints(): string[] {
  const set = new Set<string>()
  books.forEach((b) => (b.locationTags ?? []).forEach((t) => {
    if (t !== 'world' && t !== 'general') set.add(t)
  }))
  return Array.from(set).sort()
}
