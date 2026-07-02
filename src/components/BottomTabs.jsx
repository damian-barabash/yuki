import { useState } from 'react'
import { useAuth } from '../auth.jsx'

const TABS = [
  { id: 'clean', label: 'Уборка', icon: '🧹' },
  { id: 'water', label: 'Вода', icon: '💧' },
  { id: 'weight', label: 'Вес', icon: '⚖️' },
  { id: 'feed', label: 'Кормёжка', icon: '🥗' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' },
]

export default function BottomTabs({ tab, setTab }) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const current = TABS.find((t) => t.id === tab) || TABS[0]

  function choose(id) {
    setTab(id)
    setOpen(false)
  }

  // items rise from the trigger; last index closest to the button = smallest delay
  const items = [...TABS].reverse()

  return (
    <>
      <div className={`dock-scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <nav className={`dock ${open ? 'open' : ''}`}>
        <ul className="dock-menu" aria-hidden={!open}>
          {items.map((t, i) => (
            <li
              key={t.id}
              className="dock-item"
              style={{ transitionDelay: `${open ? i * 45 : (items.length - 1 - i) * 25}ms` }}
            >
              <button
                className={`dock-pill ${tab === t.id ? 'active' : ''}`}
                onClick={() => choose(t.id)}
              >
                <span className="dock-ico">{t.icon}</span>
                <span className="dock-label">{t.label}</span>
              </button>
            </li>
          ))}
          <li
            className="dock-item"
            style={{ transitionDelay: `${open ? items.length * 45 : 0}ms` }}
          >
            <button className="dock-pill dock-logout" onClick={logout}>
              <span className="dock-ico">🚪</span>
              <span className="dock-label">Выйти</span>
            </button>
          </li>
        </ul>

        <button className="dock-trigger" onClick={() => setOpen((o) => !o)}>
          <span className="dock-trigger-ico">{open ? '✕' : current.icon}</span>
          <span className="dock-trigger-label">{open ? 'Закрыть' : current.label}</span>
          <span className={`dock-caret ${open ? 'up' : ''}`}>▾</span>
        </button>
      </nav>
    </>
  )
}
