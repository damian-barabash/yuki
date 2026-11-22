import Icon from './Icon.jsx'

export const TABS = [
  { id: 'home', label: 'Сегодня', icon: 'home' },
  { id: 'feed', label: 'Еда', icon: 'food' },
  { id: 'weight', label: 'Вес', icon: 'scale' },
  { id: 'clean', label: 'Уборка', icon: 'broom' },
  { id: 'water', label: 'Вода', icon: 'drop' },
]

// Dark pill dock: the active tab grows into a peach capsule with its label.
export default function BottomTabs({ tab, setTab, alerts = {} }) {
  return (
    <nav className="dock" aria-label="Разделы">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`dock-btn ${tab === t.id ? 'on' : ''}`}
          onClick={() => setTab(t.id)}
          aria-current={tab === t.id ? 'page' : undefined}
          aria-label={t.label}
        >
          <Icon name={t.icon} />
          <span className="dock-label">{t.label}</span>
          {alerts[t.id] && tab !== t.id && <i className="dock-dot" />}
        </button>
      ))}
    </nav>
  )
}
