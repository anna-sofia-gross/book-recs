export type Genre =
  | 'Fiction'
  | 'Nonfiction'
  | 'Memoir'
  | 'History'
  | 'Historical Fiction'
  | 'Literary Fiction'
  | 'Mystery/Thriller'
  | 'Sci-Fi/Fantasy'
  | 'Poetry'
  | 'Biography'
  | 'Business'
  | 'Science'
  | 'Travel Writing'
  | 'Short Stories'
  | 'Politics'
  | 'Philosophy'
  | 'Self-Help'
  | 'Classic'
  | 'Young Adult'
  | 'Romance'
  | 'Horror'

export const ALL_GENRES: Genre[] = [
  'Biography',
  'Business',
  'Classic',
  'Fiction',
  'Historical Fiction',
  'History',
  'Horror',
  'Literary Fiction',
  'Memoir',
  'Mystery/Thriller',
  'Nonfiction',
  'Philosophy',
  'Poetry',
  'Politics',
  'Romance',
  'Sci-Fi/Fantasy',
  'Science',
  'Self-Help',
  'Short Stories',
  'Travel Writing',
  'Young Adult',
]

export interface Recommendation {
  /** The public figure who has recommended this book. */
  name: string
  /** What they're known for, shown as a small tag under their name. */
  role: string
  /** Where/how the recommendation is documented — kept general and factual. */
  context: string
}

export interface Book {
  id: string
  title: string
  author: string
  /** ISBN-13, used to fetch a real cover from Open Library; falls back to a generated cover if it 404s. */
  isbn?: string
  /** Google Books volume ID, tried as a second cover source after Open Library. */
  googleId?: string
  /** Omitted where the source data's publish date couldn't be parsed confidently. */
  year?: number
  genres: Genre[]
  /** Curated approximate Goodreads rating out of 5. */
  goodreadsRating: number
  /** Approximate rating count, shown for social proof (e.g. "1.2M ratings"). */
  ratingsLabel: string
  summary: string
  /** Travel flow: why this book deepens understanding of the place. */
  whyThisPlace?: string
  /** Travel flow: place-matching keywords (countries, cities, regions). */
  locationTags?: string[]
  /** Read Like a Pro flow: who has recommended it, and how that's documented. */
  recommendedBy?: Recommendation[]
  /** Two-tone palette used for the generated fallback cover. */
  palette: [string, string]
}
