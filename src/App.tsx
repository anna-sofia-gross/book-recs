import { useState } from 'react'
import Header from './components/Header'
import Landing from './components/Landing'
import LiteraryTravels from './components/LiteraryTravels'
import ReadLikeAPro from './components/ReadLikeAPro'

type View = 'home' | 'travel' | 'pro'

export default function App() {
  const [view, setView] = useState<View>('home')

  return (
    <div className="min-h-screen">
      <Header onHome={() => setView('home')} />
      {view === 'home' && <Landing onSelectTravel={() => setView('travel')} onSelectPro={() => setView('pro')} />}
      {view === 'travel' && <LiteraryTravels onBack={() => setView('home')} />}
      {view === 'pro' && <ReadLikeAPro onBack={() => setView('home')} />}
    </div>
  )
}
