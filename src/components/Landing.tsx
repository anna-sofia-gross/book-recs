export default function Landing({
  onSelectTravel,
  onSelectPro,
}: {
  onSelectTravel: () => void
  onSelectPro: () => void
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-14 sm:pt-20">
      <div className="relative">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-rust">Two ways to read on purpose</p>
        <h1 className="mt-4 max-w-2xl text-balance font-display text-4xl leading-[1.08] text-ink sm:text-6xl">
          Find the book that already knows where you're going.
        </h1>
        <p className="mt-5 max-w-xl text-balance font-serif text-lg leading-relaxed text-ink-soft">
          Marginalia curates five books at a time — never a wall of results — filtered by rating,
          matched to your trip or your role models, and annotated with why each one earns its spot.
        </p>
        <span className="pointer-events-none absolute -right-4 top-2 hidden rotate-3 font-mono text-[11px] text-ink-faint md:block">
          (only 5 — no doomscrolling)
        </span>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        <button
          onClick={onSelectTravel}
          className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-paper-card p-8 text-left shadow-card transition-transform hover:-translate-y-1"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rust/10 transition-transform group-hover:scale-110" />
          <span className="font-mono text-xs uppercase tracking-widest text-rust">Flow one</span>
          <h2 className="mt-3 font-display text-2xl text-ink sm:text-3xl">Literary Travels</h2>
          <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-soft">
            Tell us where you're headed and what you already love. We'll hand you five books —
            rated 3.8+ on Goodreads — that make the place come alive before you land.
          </p>
          <span className="mt-6 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-rust">
            Plan a reading list
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </span>
          <div className="mt-6 inline-block -rotate-2 rounded-sm border border-ink/15 bg-paper px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint shadow-stamp">
            ✈ excludes books you've read
          </div>
        </button>

        <button
          onClick={onSelectPro}
          className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-paper-card p-8 text-left shadow-card transition-transform hover:-translate-y-1"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-moss/10 transition-transform group-hover:scale-110" />
          <span className="font-mono text-xs uppercase tracking-widest text-moss-dark">Flow two</span>
          <h2 className="mt-3 font-display text-2xl text-ink sm:text-3xl">Read Like a Pro</h2>
          <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-soft">
            Name the people you look up to. We surface books they've publicly recommended —
            rated 3.4+ on Goodreads — filtered to genres you actually want.
          </p>
          <span className="mt-6 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-moss-dark">
            Find their bookshelf
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </span>
          <div className="mt-6 inline-block rotate-2 rounded-sm border border-ink/15 bg-paper px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint shadow-stamp">
            ★ sourced from public reading lists
          </div>
        </button>
      </div>

      <p className="mx-auto mt-16 max-w-lg text-center font-mono text-[11px] leading-relaxed text-ink-faint">
        Ratings are curated snapshots, not a live Goodreads feed — Goodreads retired its public
        API in 2020. Recommendations are limited to publicly documented lists and interviews.
      </p>
    </div>
  )
}
