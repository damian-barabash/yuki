import { useEffect, useState } from 'react'
import { useAuth } from './auth.jsx'
import { DataProvider, useData } from './data.jsx'
import Login from './Login.jsx'
import { ConfirmProvider } from './components/Confirm.jsx'
import PetStage from './components/PetStage.jsx'
import BottomTabs from './components/BottomTabs.jsx'
import Cheer from './components/Cheer.jsx'
import YukiArt from './components/YukiArt.jsx'
import HomeTab from './tabs/HomeTab.jsx'
import CareTab from './tabs/CareTab.jsx'
import WeightTab from './tabs/WeightTab.jsx'
import FeedTab from './tabs/FeedTab.jsx'
import SettingsTab from './tabs/SettingsTab.jsx'

// status colour of the whole app; also pushed to the browser chrome
const MOOD_COLOR = { calm: '#1E9E6A', dirty: '#E2493F', hot: '#F0862A', hungry: '#2549D8' }

function Splash() {
  // one of a few poses, picked once — sometimes he peeks out of his tunnel
  const [pose] = useState(() => [{ mood: 'idle' }, { mood: 'happy' }, { mood: 'wow', prop: 'tunnel' }][Math.floor(Math.random() * 3)])
  return (
    <div className="splash">
      <div className="splash-art">
        <YukiArt {...pose} size={132} />
      </div>
      <div className="splash-text">секундочку…</div>
    </div>
  )
}

function Shell() {
  const { status, loading } = useData()
  const [tab, setTabRaw] = useState('home')

  function setTab(t) {
    setTabRaw(t)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', MOOD_COLOR[status.mood] || MOOD_COLOR.calm)
  }, [status.mood])

  if (loading) return <Splash />

  const alerts = {
    clean: status.dirty,
    water: status.hot,
    feed: status.hungry,
    weight: status.needsWeigh,
  }

  return (
    <div className={`app mood-${status.mood}`}>
      <PetStage tab={tab} setTab={setTab} />
      <main className="content" key={tab}>
        {tab === 'home' && <HomeTab setTab={setTab} />}
        {tab === 'clean' && <CareTab kind="clean" />}
        {tab === 'water' && <CareTab kind="water" />}
        {tab === 'weight' && <WeightTab />}
        {tab === 'feed' && <FeedTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>
      <BottomTabs tab={tab} setTab={setTab} alerts={alerts} />
      <Cheer />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Login />
  return (
    <DataProvider>
      <ConfirmProvider>
        <Shell />
      </ConfirmProvider>
    </DataProvider>
  )
}
