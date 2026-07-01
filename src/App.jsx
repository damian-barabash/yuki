import { useState } from 'react'
import { useAuth } from './auth.jsx'
import { DataProvider, useData } from './data.jsx'
import Login from './Login.jsx'
import PetStage from './components/PetStage.jsx'
import BottomTabs from './components/BottomTabs.jsx'
import CleanTab from './tabs/CleanTab.jsx'
import WeightTab from './tabs/WeightTab.jsx'
import FeedTab from './tabs/FeedTab.jsx'
import SettingsTab from './tabs/SettingsTab.jsx'

function Splash({ text = 'Загрузка…' }) {
  return (
    <div className="splash">
      <div className="splash-pig">🐹</div>
      <div className="splash-text">{text}</div>
    </div>
  )
}

function Shell() {
  const { status, loading } = useData()
  const [tab, setTab] = useState('clean')

  if (loading) return <Splash />

  return (
    <div className={`app ${status.dirty ? 'is-dirty' : ''}`}>
      <PetStage tab={tab} />
      <main className="content">
        {tab === 'clean' && <CleanTab />}
        {tab === 'weight' && <WeightTab />}
        {tab === 'feed' && <FeedTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>
      <BottomTabs tab={tab} setTab={setTab} />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Login />
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}
