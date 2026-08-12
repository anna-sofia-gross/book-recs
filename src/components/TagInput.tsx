import { useState, type KeyboardEvent } from 'react'

export default function TagInput({
  values,
  onChange,
  placeholder,
  suggestions = [],
}: {
  values: string[]
  onChange: (v: string[]) => void
  placeholder: string
  suggestions?: string[]
}) {
  const [draft, setDraft] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...values, v])
    setDraft('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  const filteredSuggestions = suggestions
    .filter((s) => s.toLowerCase().includes(draft.toLowerCase()) && !values.some((v) => v.toLowerCase() === s.toLowerCase()))
    .slice(0, 6)

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/20 bg-paper-card px-3 py-2.5 focus-within:border-rust transition-colors">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper text-sm px-3 py-1"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-paper/60 hover:text-paper leading-none"
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[10ch] bg-transparent outline-none text-sm font-sans py-1 placeholder:text-ink-faint"
        />
      </div>
      {showSuggestions && draft && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-ink/15 bg-paper-card shadow-card overflow-hidden">
          {filteredSuggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(s)}
                className="w-full text-left px-3 py-2 text-sm font-sans hover:bg-paper-dim capitalize"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
