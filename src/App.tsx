import { useEffect, useState } from 'react'
import Header from './components/Header'
import Landing from './components/Landing'
import LiteraryTravels from './components/LiteraryTravels'
import ReadLikeAPro from './components/ReadLikeAPro'
import { loadCatalog } from './lib/catalog'
import { READ_LIKE_A_PRO_ENABLED } from './lib/featureFlags'
import type { Book } from './data/types'

type View = 'home' | 'travel' | 'pro'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [pool, setPool] = useState<Book[] | null>(null)

  useEffect(() => {
    let cancelled = false
    loadCatalog().then((books) => {
      if (!cancelled) setPool(books)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen">
      <Header onHome={() => setView('home')} />
      {view === 'home' && (
        <Landing
          onSelectTravel={() => setView('travel')}
          onSelectPro={READ_LIKE_A_PRO_ENABLED ? () => setView('pro') : undefined}
        />
      )}
      {view === 'travel' &&
        (pool ? (
          <LiteraryTravels onBack={() => setView('home')} pool={pool} />
        ) : (
          <CatalogLoading onBack={() => setView('home')} />
        ))}
      {view === 'pro' && READ_LIKE_A_PRO_ENABLED &&
        (pool ? (
          <ReadLikeAPro onBack={() => setView('home')} pool={pool} />
        ) : (
          <CatalogLoading onBack={() => setView('home')} />
        ))}
    </div>
  )
}

function CatalogLoading({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <button onClick={onBack} className="ink-link font-mono text-xs text-ink-faint">
        ← back to Marginalia
      </button>
      <p className="mt-10 font-serif text-ink-soft">Loading the catalog…</p>
    </div>
  )
}
