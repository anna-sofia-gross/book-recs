import type { Book } from '../data/types'

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchJson(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch(url, { signal: controller.signal })
    return r.ok ? await r.json() : null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetches a fuller description from the Google Books API (free, keyless)
 * for a card expanded by the user. Best-effort: returns null on any
 * failure — a slow/blocked network, no result, a stalled request — so the
 * caller can silently keep showing the stored summary rather than hang.
 * This is a progressive enhancement, not something the app depends on.
 */
export async function fetchFullDescription(book: Book, timeoutMs = 6000): Promise<string | null> {
  try {
    if (book.googleId) {
      const data = await fetchJson(`https://www.googleapis.com/books/v1/volumes/${book.googleId}`, timeoutMs)
      const desc = data?.volumeInfo?.description
      if (desc) return stripHtml(desc)
    }
    if (book.isbn) {
      const data = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`, timeoutMs)
      const desc = data?.items?.[0]?.volumeInfo?.description
      if (desc) return stripHtml(desc)
    }
  } catch {
    // network error, CORS, offline, aborted timeout, etc.
  }
  return null
}
