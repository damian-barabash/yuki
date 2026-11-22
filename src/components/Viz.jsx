// Tiny dependency-free data visuals shared by the tabs.
import { isoOf, MS_DAY } from '../lib/dates.js'

// Sparkline for a short numeric series
export function Sparkline({ values, w = 120, h = 44 }) {
  if (!values || values.length < 2) return <svg width={w} height={h} aria-hidden />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const px = (i) => 4 + (i / (values.length - 1)) * (w - 8)
  const py = (v) => 5 + (1 - (v - min) / span) * (h - 12)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ')
  const lx = px(values.length - 1)
  const ly = py(values[values.length - 1])
  return (
    <svg className="spark" width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <path d={`${d} L${lx} ${h} L4 ${h} Z`} className="spark-area" />
      <path d={d} className="spark-line" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="3.6" className="spark-dot" />
    </svg>
  )
}

// Segmented progress (e.g. vitamin C 2/3)
export function Segments({ value, total }) {
  return (
    <div className="segs" role="img" aria-label={`${value} из ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <i key={i} className={i < value ? 'on' : ''} />
      ))}
    </div>
  )
}

// Range meter: how today's amount sits against a target range
export function RangeBar({ value, min, max }) {
  const top = Math.max(max * 1.5, value * 1.08)
  const pct = (v) => `${Math.min(100, (v / top) * 100)}%`
  const state = value > max * 1.35 ? 'over' : value >= min ? 'ok' : 'low'
  return (
    <div className={`range ${state}`}>
      <span className="range-zone" style={{ left: pct(min), width: `calc(${pct(max)} - ${pct(min)})` }} />
      <span className="range-fill" style={{ width: pct(value) }} />
    </div>
  )
}

// Last `days` days as dots — filled where an event happened. Shows care rhythm at a glance.
export function DotStrip({ timestamps, days = 21 }) {
  const done = new Set(timestamps.map((t) => isoOf(new Date(t))))
  const today = new Date()
  const cells = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * MS_DAY)
    cells.push({ iso: isoOf(d), day: d.getDate(), wd: d.getDay(), today: i === 0 })
  }
  return (
    <div className="dots" role="img" aria-label={`Последние ${days} дней`}>
      {cells.map((c) => (
        <span key={c.iso} className={`dot-cell ${done.has(c.iso) ? 'on' : ''} ${c.today ? 'today' : ''}`}>
          <i />
          <em>{c.day}</em>
        </span>
      ))}
    </div>
  )
}

// mean gap in days between the most recent events (newest-first timestamps)
export function avgGapDays(timestamps, take = 12) {
  const a = timestamps.slice(0, take).map((t) => +new Date(t)).sort((x, y) => x - y)
  if (a.length < 2) return null
  return (a[a.length - 1] - a[0]) / (a.length - 1) / MS_DAY
}
