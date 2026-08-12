export default function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <button onClick={onHome} className="group flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden>
            <rect width="64" height="64" rx="12" fill="#211C15" />
            <path d="M18 14h20a6 6 0 0 1 6 6v30l-8-5-8 5-8-5-8 5V20a6 6 0 0 1 6-6z" fill="#F4EEE2" />
            <path d="M24 24h16M24 31h16M24 38h10" stroke="#B4502A" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-display text-lg tracking-tight text-ink">Marginalia</span>
        </button>
        <span className="hidden font-mono text-[11px] uppercase tracking-widest text-ink-faint sm:block">
          find your next chapter
        </span>
      </div>
    </header>
  )
}
