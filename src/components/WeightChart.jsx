import { useMemo } from 'react'
import { fmtDate } from '../lib/dates.js'

// Lightweight hand-rolled SVG line chart (no chart library → tiny bundle).
export default function WeightChart({ data }) {
  const W = 320
  const H = 150
  const pad = { l: 34, r: 10, t: 12, b: 22 }

  const view = useMemo(() => {
    if (data.length < 1) return null
    const xs = data.map((d) => Date.parse(d.measured_on))
    const ys = data.map((d) => Number(d.grams))
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    let minY = Math.min(...ys)
    let maxY = Math.max(...ys)
    const span = maxY - minY || 1
    minY = Math.floor((minY - span * 0.15) / 10) * 10
    maxY = Math.ceil((maxY + span * 0.15) / 10) * 10
    const iw = W - pad.l - pad.r
    const ih = H - pad.t - pad.b
    const sx = (x) => (maxX === minX ? pad.l + iw / 2 : pad.l + ((x - minX) / (maxX - minX)) * iw)
    const sy = (y) => pad.t + ih - ((y - minY) / (maxY - minY)) * ih
    const pts = data.map((d) => ({ x: sx(Date.parse(d.measured_on)), y: sy(Number(d.grams)), d }))
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H - pad.b} L${pts[0].x.toFixed(1)},${H - pad.b} Z`
    const yticks = [minY, Math.round((minY + maxY) / 2), maxY]
    return { pts, line, area, minY, maxY, yticks, sy }
  }, [data])

  if (!view) return <div className="empty">Добавь пару взвешиваний — построю график.</div>

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="График веса">
      {view.yticks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={view.sy(t)} y2={view.sy(t)} className="chart-grid" />
          <text x={4} y={view.sy(t) + 3} className="chart-ylabel">
            {t}
          </text>
        </g>
      ))}
      <path d={view.area} className="chart-area" />
      <path d={view.line} className="chart-line" />
      {view.pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.4" className="chart-dot" />
          {(i === 0 || i === view.pts.length - 1) && (
            <text x={p.x} y={H - 8} className="chart-xlabel" textAnchor="middle">
              {fmtDate(p.d.measured_on)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
