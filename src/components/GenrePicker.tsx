import { ALL_GENRES, type Genre } from '../data/types'

export default function GenrePicker({ selected, onChange }: { selected: Genre[]; onChange: (g: Genre[]) => void }) {
  const genres = ALL_GENRES

  const toggle = (g: Genre) => {
    onChange(selected.includes(g) ? selected.filter((x) => x !== g) : [...selected, g])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((g) => {
        const active = selected.includes(g)
        return (
          <button
            key={g}
            type="button"
            onClick={() => toggle(g)}
            className={`rounded-full border px-3 py-1.5 text-sm font-sans transition-colors ${
              active
                ? 'bg-moss border-moss text-paper'
                : 'border-ink/20 bg-paper-card text-ink-soft hover:border-ink/40'
            }`}
            aria-pressed={active}
          >
            {g}
          </button>
        )
      })}
    </div>
  )
}
