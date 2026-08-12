# Marginalia

A book recommendation engine for those looking to travel more knowledgeably, or read what the people they look up to read.

Two flows, five books each, no doomscrolling:

- **Literary Travels** — enter a destination, your genre preferences, and books you've already enjoyed. Get five books (rated 3.8+ on Goodreads) that deepen your understanding of the place before you land. Includes a demo "connect Goodreads/Fable" toggle that simulates excluding books already on your shelf.
- **Read Like a Pro** — enter public figures you admire and get five books (rated 3.4+ on Goodreads) they've publicly recommended, filtered by genre.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static production build in `dist/`, deployable to any static host (Vercel, Netlify, GitHub Pages, etc.) — there's no backend.

## How the data works

There's no live Goodreads API to call — Goodreads shut down public API access to new developers in 2020, and there's no public API for scraping celebrity interviews either. So instead of faking a live scrape, `src/data/books.ts` is a curated, hand-picked dataset:

- **Ratings** are approximate, hand-curated snapshots of real Goodreads scores, not a live feed.
- **"Recommended by"** entries are limited to recommendations that are genuinely, publicly documented — annual reading lists (Obama, Gates), book clubs (Reese's, Emma Watson's), GatesNotes, and similarly attributable sources — described generally rather than invented as verbatim quotes.
- **Book covers** are fetched live from the [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers) by ISBN, with a generated placeholder cover as a graceful fallback if an image is missing.

To go from demo to production, the natural next step is swapping `src/data/books.ts` for a real backend that pulls current ratings from a licensed data source (e.g. the Google Books API, a Goodreads data partner, or a self-maintained catalog) and a moderated pipeline for sourcing new celebrity-recommendation citations. The recommendation logic in `src/lib/recommend.ts` is already decoupled from where the data comes from, so that swap doesn't touch the UI.

## Stack

Vite + React + TypeScript + Tailwind CSS. No backend, no database — everything runs client-side against the curated dataset.
