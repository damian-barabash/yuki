import { useMemo } from 'react'
import { fmtDate } from '../lib/dates.js'

const NORM = [900, 1200]

// Hand-rolled SVG line chart (no chart library → tiny bundle): smooth line,
// adult-norm band, first/last dates and a labelled last point.
export default function WeightChart({ data }) {
  const W = 340
  const H = 170
  const pad = { l: 38, r: 14, t: 18, b: 24 }

  const view = useMemo(() => {
    if (data.length < 1) return null
    const xs = data.map((d) => Date.parse(d.measured_on))
    const ys = data.map((d) => Number(d.grams))
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    let minY = Math.min(...ys)
    let maxY = Math.max(...ys)
    const span = maxY - minY || 40
    minY = Math.floor((minY - span * 0.2) / 10) * 10
    maxY = Math.ceil((maxY + span * 0.25) / 10) * 10
    const iw = W - pad.l - pad.r
    const ih = H - pad.t - pad.b
    const sx = (x) => (maxX === minX ? pad.l + iw / 2 : pad.l + ((x - minX) / (maxX - minX)) * iw)
    const sy = (y) => pad.t + ih - ((y - minY) / (maxY - minY)) * ih
    const pts = data.map((d) => ({ x: sx(Date.parse(d.measured_on)), y: sy(Number(d.grams)), d }))
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H - pad.b} L${pts[0].x.toFixed(1)},${H - pad.b} Z`
    const yticks = [minY, Math.round((minY + maxY) / 2), maxY]
    const top = Math.min(NORM[1], maxY)
    const bot = Math.max(NORM[0], minY)
    const band = top > bot ? { y: sy(top), h: sy(bot) - sy(top) } : null
    const edge = NORM[1] < maxY && NORM[1] > minY ? sy(NORM[1]) : null
    return { pts, line, area, yticks, sy, band, edge }
  }, [data])

  if (!view) return <div className="empty">Добавь пару взвешиваний — построю график.</div>
  const last = view.pts[view.pts.length - 1]
  const many = view.pts.length > 24

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="График веса">
      {view.band && <rect x={pad.l} y={view.band.y} width={W - pad.l - pad.r} height={view.band.h} className="chart-band" rx="6" />}
      {view.yticks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={view.sy(t)} y2={view.sy(t)} className="chart-grid" />
          <text x={pad.l - 6} y={view.sy(t) + 3.5} className="chart-label" textAnchor="end">{t}</text>
        </g>
      ))}
      {view.edge !== null && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={view.edge} y2={view.edge} className="chart-edge" />
          <text x={W - pad.r} y={view.edge - 4} className="chart-label chart-edge-label" textAnchor="end">верх нормы {NORM[1]}</text>
        </g>
      )}
      <path d={view.area} className="chart-area" />
      <path d={view.line} className="chart-line" />
      {view.pts.map((p, i) => {
        const end = i === 0 || i === view.pts.length - 1
        if (many && !end) return null
        return <circle key={i} cx={p.x} cy={p.y} r={i === view.pts.length - 1 ? 5 : 3} className={`chart-dot ${i === view.pts.length - 1 ? 'last' : ''}`} />
      })}
      <text x={view.pts[0].x} y={H - 6} className="chart-label" textAnchor="start">{fmtDate(view.pts[0].d.measured_on)}</text>
      {view.pts.length > 1 && <text x={last.x} y={H - 6} className="chart-label" textAnchor="end">{fmtDate(last.d.measured_on)}</text>}
      <text x={Math.min(last.x, W - pad.r)} y={Math.max(last.y - 11, 12)} className="chart-last" textAnchor="end">{Number(last.d.grams)} г</text>
    </svg>
  )
}
