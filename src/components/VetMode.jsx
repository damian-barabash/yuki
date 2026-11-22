import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../data.jsx'
import { sel } from '../lib/supabase.js'
import { todayISO, isoOf, MS_DAY } from '../lib/dates.js'
import {
  foodPl, fmtDatePl, fmtDatePlShort, fmtMonthPl, monthShortPl, agePl, numPl, CATEGORY_PL,
} from '../lib/vetPl.js'
import YukiArt from './YukiArt.jsx'
import Icon from './Icon.jsx'

const FRESH_MIN = 80
const FRESH_MAX = 150

// 30 daily bars of fresh food (g) against the recommended range
function DailyBars({ days }) {
  const W = 680
  const H = 150
  const pad = { l: 40, r: 8, t: 10, b: 22 }
  const max = Math.max(FRESH_MAX * 1.2, ...days.map((d) => d.g))
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const bw = iw / days.length
  const sy = (v) => pad.t + ih - (v / max) * ih
  return (
    <svg className="vet-svg" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Świeży pokarm dziennie, 30 dni">
      <rect x={pad.l} y={sy(FRESH_MAX)} width={iw} height={sy(FRESH_MIN) - sy(FRESH_MAX)} className="vet-norm-band" />
      {[0, FRESH_MIN, FRESH_MAX].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} className="vet-gridline" />
          <text x={pad.l - 6} y={sy(t) + 3.5} className="vet-axis" textAnchor="end">{t}</text>
        </g>
      ))}
      {days.map((d, i) => (
        <g key={d.iso}>
          {d.g > 0 ? (
            <rect x={pad.l + i * bw + bw * 0.16} y={sy(d.g)} width={bw * 0.68} height={Math.max(1.5, sy(0) - sy(d.g))} rx="2.5" className={`vet-bar ${d.g > FRESH_MAX * 1.35 ? 'over' : d.g < FRESH_MIN ? 'low' : ''}`} />
          ) : (
            <circle cx={pad.l + i * bw + bw / 2} cy={sy(0) - 3} r="1.6" className={d.logged ? 'vet-dot-zero' : 'vet-dot-none'} />
          )}
          {(i % 5 === 0 || i === days.length - 1) && (
            <text x={pad.l + i * bw + bw / 2} y={H - 6} className="vet-axis" textAnchor="middle">{d.label}</text>
          )}
        </g>
      ))}
    </svg>
  )
}

function longestGapDays(timestamps, sinceMs) {
  const a = timestamps.map((t) => +new Date(t)).filter((t) => t >= sinceMs).sort((x, y) => x - y)
  if (!a.length) return null
  let g = 0
  for (let i = 1; i < a.length; i++) g = Math.max(g, a[i] - a[i - 1])
  g = Math.max(g, Date.now() - a[a.length - 1])
  return g / MS_DAY
}

const NORM_MIN = 900 // adult boar
const NORM_MAX = 1200

// Big printable weight chart: month grid, adult-norm band, 5 y-ticks.
function BigWeightChart({ data }) {
  const W = 680
  const H = 300
  const pad = { l: 48, r: 16, t: 18, b: 30 }

  const view = useMemo(() => {
    if (data.length < 1) return null
    const xs = data.map((d) => Date.parse(d.measured_on))
    const ys = data.map((d) => Number(d.grams))
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    let minY = Math.min(...ys)
    let maxY = Math.max(...ys)
    const span = maxY - minY || 40
    minY = Math.floor((minY - span * 0.18) / 25) * 25
    maxY = Math.ceil((maxY + span * 0.18) / 25) * 25
    const iw = W - pad.l - pad.r
    const ih = H - pad.t - pad.b
    const sx = (x) => (maxX === minX ? pad.l + iw / 2 : pad.l + ((x - minX) / (maxX - minX)) * iw)
    const sy = (y) => pad.t + ih - ((y - minY) / (maxY - minY)) * ih
    const pts = data.map((d) => ({ x: sx(Date.parse(d.measured_on)), y: sy(Number(d.grams)), d }))
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H - pad.b} L${pts[0].x.toFixed(1)},${H - pad.b} Z`

    const yticks = []
    for (let i = 0; i <= 4; i++) yticks.push(Math.round(minY + ((maxY - minY) * i) / 4))

    // month boundaries for the x-axis
    const xticks = []
    const t0 = new Date(minX)
    const cursor = new Date(t0.getFullYear(), t0.getMonth(), 1)
    if (+cursor < minX) cursor.setMonth(cursor.getMonth() + 1)
    while (+cursor <= maxX) {
      xticks.push({ x: sx(+cursor), label: `${monthShortPl(cursor.getMonth())}${cursor.getMonth() === 0 ? ` '${String(cursor.getFullYear()).slice(2)}` : ''}` })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    const step = Math.max(1, Math.ceil(xticks.length / 9))
    const xshow = xticks.filter((_, i) => i % step === 0)

    // adult-norm band clipped to the visible scale
    const bandTop = Math.min(NORM_MAX, maxY)
    const bandBot = Math.max(NORM_MIN, minY)
    const band = bandTop > bandBot ? { y: sy(bandTop), h: sy(bandBot) - sy(bandTop) } : null

    return { pts, line, area, yticks, xshow, sy, band, minX, maxX }
  }, [data])

  if (!view) return <div className="empty">Brak pomiarów masy ciała.</div>

  const many = view.pts.length > 40
  const last = view.pts[view.pts.length - 1]

  return (
    <svg className="vet-svg" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Wykres masy ciała">
      {view.band && (
        <rect x={pad.l} y={view.band.y} width={W - pad.l - pad.r} height={view.band.h} className="vet-norm-band" />
      )}
      {view.yticks.map((t, i) => (
        <g key={`y${i}`}>
          <line x1={pad.l} x2={W - pad.r} y1={view.sy(t)} y2={view.sy(t)} className="vet-gridline" />
          <text x={pad.l - 6} y={view.sy(t) + 3.5} className="vet-axis" textAnchor="end">{t}</text>
        </g>
      ))}
      {view.xshow.map((t, i) => (
        <g key={`x${i}`}>
          <line x1={t.x} x2={t.x} y1={pad.t} y2={H - pad.b} className="vet-gridline vet-grid-v" />
          <text x={t.x} y={H - 10} className="vet-axis" textAnchor="middle">{t.label}</text>
        </g>
      ))}
      {view.xshow.length === 0 && (
        <text x={view.pts[0].x} y={H - 10} className="vet-axis" textAnchor="middle">
          {fmtDatePlShort(view.pts[0].d.measured_on)}
        </text>
      )}
      <path d={view.area} className="vet-area" />
      <path d={view.line} className="vet-line" />
      {view.pts.map((p, i) => {
        const edge = i === 0 || i === view.pts.length - 1
        if (many && !edge) return null
        return <circle key={i} cx={p.x} cy={p.y} r={many ? 3.6 : 3} className="vet-dot" />
      })}
      <text
        x={Math.min(last.x, W - pad.r - 4)}
        y={Math.max(last.y - 10, 12)}
        className="vet-last-label"
        textAnchor="end"
      >
        {numPl(last.d.grams)} g
      </text>
    </svg>
  )
}

// mean gap (days) between the most recent events; timestamps come newest-first
function avgIntervalDays(timestamps) {
  const a = timestamps.slice(0, 16).map((t) => +new Date(t)).sort((x, y) => x - y)
  if (a.length < 2) return null
  let sum = 0
  for (let i = 1; i < a.length; i++) sum += a[i] - a[i - 1]
  return sum / (a.length - 1) / MS_DAY
}

export default function VetMode({ onClose }) {
  const { foods, feedings, weights, cleanings, waterings, pet, status } = useData()

  // context only holds ~90 days of feedings — the vet report wants full history
  const [allFeedings, setAllFeedings] = useState(null)
  useEffect(() => {
    let alive = true
    sel('feedings?select=*&order=fed_on.desc&limit=10000')
      .then((rows) => alive && setAllFeedings(rows))
      .catch(() => alive && setAllFeedings([]))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    document.body.classList.add('vet-open')
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.classList.remove('vet-open')
      document.body.style.overflow = prev
    }
  }, [])

  const [showAllWeights, setShowAllWeights] = useState(false)
  const [openMonths, setOpenMonths] = useState(() => new Set()) // toggled keys — XOR with "newest is open by default"
  const [printAll, setPrintAll] = useState(false) // beforeprint → expand everything so the PDF is complete

  useEffect(() => {
    const on = () => setPrintAll(true)
    window.addEventListener('beforeprint', on)
    return () => window.removeEventListener('beforeprint', on)
  }, [])

  const fe = allFeedings ?? feedings
  const foodById = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods])

  const wAsc = useMemo(() => [...weights].sort((a, b) => (a.measured_on < b.measured_on ? -1 : 1)), [weights])
  const wDesc = useMemo(() => [...wAsc].reverse(), [wAsc])
  const current = wDesc[0] || null

  const today = todayISO()
  const cutoff30 = isoOf(new Date(Date.now() - 30 * MS_DAY))

  const weightStats = useMemo(() => {
    if (!wAsc.length) return null
    const ys = wAsc.map((w) => Number(w.grams))
    let base = null
    for (const w of wAsc) if (w.measured_on <= cutoff30) base = w
    if (!base) base = wAsc[0]
    const cur = Number(current.grams)
    const change30 = base !== current ? cur - Number(base.grams) : null
    const change30pct = change30 !== null && Number(base.grams) > 0 ? (change30 / Number(base.grams)) * 100 : null
    const norm = cur < NORM_MIN ? 'below' : cur > NORM_MAX ? 'above' : 'ok'
    return {
      cur,
      change30,
      change30pct,
      norm,
      min: Math.min(...ys),
      max: Math.max(...ys),
      avg: ys.reduce((s, y) => s + y, 0) / ys.length,
      count: wAsc.length,
      firstDate: wAsc[0].measured_on,
    }
  }, [wAsc, current, cutoff30])

  const diet30 = useMemo(() => {
    const rows = fe.filter((f) => f.fed_on >= cutoff30)
    let freshG = 0
    let pellets = 0
    const vitByDay = {}
    const catG = {}
    const produceIds = new Set()
    for (const f of rows) {
      const food = foodById[f.food_id]
      if (!food) continue
      const amt = Number(f.amount || 0)
      if (food.kind === 'feed') pellets += amt
      else if (food.kind === 'vitamin_c') vitByDay[f.fed_on] = (vitByDay[f.fed_on] || 0) + amt
      else {
        freshG += amt
        produceIds.add(f.food_id)
        catG[food.category] = (catG[food.category] || 0) + amt
      }
    }
    const vitTarget = status.vitTarget || 3
    const daysWithVit = Object.keys(vitByDay).length
    const daysFullVit = Object.values(vitByDay).filter((v) => v >= vitTarget).length
    return {
      freshPerDay: freshG / 30,
      pelletsPerDay: pellets / 30,
      freshG,
      catG,
      diversity: produceIds.size,
      daysWithVit,
      daysFullVit,
      vitTarget,
    }
  }, [fe, foodById, cutoff30, status.vitTarget])

  const tops = useMemo(() => {
    const agg = new Map()
    const forbidden = new Map()
    for (const f of fe) {
      const food = foodById[f.food_id]
      if (!food) continue
      if (food.safety === 'forbidden') {
        const e = forbidden.get(f.food_id) || { food, count: 0 }
        e.count++
        forbidden.set(f.food_id, e)
      }
      if (food.kind !== 'produce') continue
      const e = agg.get(f.food_id) || { food, count: 0, grams: 0 }
      e.count++
      e.grams += Number(f.amount || 0)
      agg.set(f.food_id, e)
    }
    const all = [...agg.values()]
    return {
      byCount: [...all].sort((a, b) => b.count - a.count).slice(0, 5),
      byGrams: [...all].sort((a, b) => b.grams - a.grams).slice(0, 5),
      forbidden: [...forbidden.values()].sort((a, b) => b.count - a.count),
    }
  }, [fe, foodById])

  const months = useMemo(() => {
    const map = new Map()
    for (const f of fe) {
      const key = f.fed_on.slice(0, 7)
      let mo = map.get(key)
      if (!mo) {
        mo = { key, freshG: 0, pellets: 0, vit: 0, count: 0, items: new Map() }
        map.set(key, mo)
      }
      const food = foodById[f.food_id]
      if (!food) continue
      const amt = Number(f.amount || 0)
      mo.count++
      let it = mo.items.get(f.food_id)
      if (!it) {
        it = { food, grams: 0, amount: 0, count: 0 }
        mo.items.set(f.food_id, it)
      }
      it.count++
      if (food.kind === 'feed') {
        mo.pellets += amt
        it.amount += amt
      } else if (food.kind === 'vitamin_c') {
        mo.vit += amt
        it.amount += amt
      } else {
        mo.freshG += amt
        it.grams += amt
      }
    }
    return [...map.values()]
      .sort((a, b) => (a.key < b.key ? 1 : -1))
      .map((mo) => ({
        ...mo,
        items: [...mo.items.values()].sort((a, b) => b.grams - a.grams || b.count - a.count),
      }))
  }, [fe, foodById])

  function toggleMonth(key) {
    setOpenMonths((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }

  // last 30 days, day by day
  const daily = useMemo(() => {
    const g = {}
    const logged = new Set()
    for (const f of fe) {
      if (f.fed_on < cutoff30) continue
      logged.add(f.fed_on)
      const food = foodById[f.food_id]
      if (food?.kind === 'produce') g[f.fed_on] = (g[f.fed_on] || 0) + Number(f.amount || 0)
    }
    const out = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * MS_DAY)
      const iso = isoOf(d)
      out.push({ iso, g: g[iso] || 0, logged: logged.has(iso), label: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}` })
    }
    return { days: out, logged: logged.size }
  }, [fe, foodById, cutoff30])

  const top30 = useMemo(() => {
    const agg = new Map()
    for (const f of fe) {
      if (f.fed_on < cutoff30) continue
      const food = foodById[f.food_id]
      if (!food || food.kind !== 'produce') continue
      const e = agg.get(f.food_id) || { food, days: new Set(), grams: 0 }
      e.days.add(f.fed_on)
      e.grams += Number(f.amount || 0)
      agg.set(f.food_id, e)
    }
    return [...agg.values()].sort((a, b) => b.grams - a.grams).slice(0, 8)
  }, [fe, foodById, cutoff30])

  const cleanEvery = avgIntervalDays(cleanings.map((c) => c.cleaned_at))
  const since60 = Date.now() - 60 * MS_DAY
  const cleanMaxGap = longestGapDays(cleanings.map((c) => c.cleaned_at), since60)
  const waterMaxGap = longestGapDays(waterings.map((w) => w.changed_at), since60)
  const waterEvery = avgIntervalDays(waterings.map((w) => w.changed_at))

  const shownWeights = showAllWeights || printAll ? wDesc : wDesc.slice(0, 6)
  const rapidLoss = weightStats?.change30pct !== null && weightStats?.change30pct <= -10

  function itemAmount(it) {
    if (it.food.kind === 'feed') return `${numPl(it.amount, 1)} porcji`
    if (it.food.kind === 'vitamin_c') return `${numPl(it.amount)} szt.`
    return `${numPl(it.grams)} g`
  }

  // plain-language summary a vet can read in ten seconds
  const summary = []
  if (weightStats) {
    const n = weightStats.norm === 'ok' ? 'w normie' : weightStats.norm === 'below' ? 'poniżej normy' : 'powyżej normy'
    summary.push({
      tone: weightStats.norm === 'ok' ? 'good' : 'warn',
      text: `Masa ciała ${numPl(weightStats.cur)} g (${fmtDatePlShort(current.measured_on)}) — ${n} dla dorosłego samca (${NORM_MIN}–${NORM_MAX} g).`,
    })
    if (weightStats.change30 !== null)
      summary.push({
        tone: rapidLoss ? 'bad' : weightStats.change30pct <= -5 ? 'warn' : 'good',
        text: `Zmiana masy w ostatnich ~30 dniach: ${weightStats.change30 > 0 ? '+' : ''}${numPl(weightStats.change30)} g (${weightStats.change30pct > 0 ? '+' : ''}${numPl(weightStats.change30pct, 1)}%).`,
      })
  } else summary.push({ tone: 'warn', text: 'Brak pomiarów masy ciała w dzienniku.' })
  summary.push({ tone: 'good', text: 'Siano: stały, nieograniczony dostęp 24/7 (ad libitum).' })
  if (daily.logged > 0) {
    const perLogged = diet30.freshG / daily.logged
    summary.push({
      tone: perLogged < FRESH_MIN * 0.75 ? 'warn' : 'good',
      text: `Świeży pokarm: średnio ${numPl(perLogged)} g/dzień (zapisy z ${daily.logged} z 30 dni), ${diet30.diversity} różnych produktów; granulat średnio ${numPl(diet30.pelletsPerDay * 30 / daily.logged, 1)} porcji/dzień.`,
    })
    summary.push({
      tone: diet30.daysFullVit >= daily.logged * 0.8 ? 'good' : diet30.daysFullVit >= daily.logged * 0.4 ? 'warn' : 'bad',
      text: `Witamina C (tabletki, ${diet30.vitTarget}×/dzień): pełna dawka w ${diet30.daysFullVit} dniach, częściowa w ${diet30.daysWithVit - diet30.daysFullVit} — na ${daily.logged} dni z zapisami.`,
    })
  } else summary.push({ tone: 'warn', text: 'Brak zapisów karmienia z ostatnich 30 dni.' })
  if (cleanEvery !== null)
    summary.push({
      tone: cleanEvery <= 3 ? 'good' : 'warn',
      text: `Sprzątanie klatki średnio co ${numPl(cleanEvery, 1)} dnia, wymiana wody ${waterEvery === null ? 'bez zapisów' : `co ${numPl(waterEvery, 1)} dnia`}.`,
    })
  if (tops.forbidden.length)
    summary.push({ tone: 'bad', text: `W dzienniku wystąpiły produkty niewskazane: ${tops.forbidden.map((t) => `${foodPl(t.food)} (${t.count}×)`).join(', ')}.` })

  const maxCat = Math.max(1, ...Object.values(diet30.catG))

  return createPortal(
    <div className="vet-scrim">
      <div className="vet">
        <div className="vet-top">
          <h2>Raport weterynaryjny</h2>
          <div className="vet-actions">
            <button
              className="btn btn-ghost vet-btn"
              onClick={() => {
                // expand everything first, then print on the next frame so the DOM is complete
                setPrintAll(true)
                setTimeout(() => window.print(), 60)
              }}
            >
              <Icon name="print" size={18} /> <span>PDF</span>
            </button>
            <button className="btn btn-ink vet-btn" onClick={onClose} aria-label="Zamknij">
              <Icon name="x" size={18} /> <span>Zamknij</span>
            </button>
          </div>
        </div>

        <div className="vet-body">
          <section className="vet-patient">
            <div className="vet-patient-art"><YukiArt mood="idle" size={96} /></div>
            <dl className="vet-info">
              <div><dt>Pacjent</dt><dd>{pet.name || 'Yuki'}</dd></div>
              <div><dt>Gatunek</dt><dd>Świnka morska (Cavia porcellus)</dd></div>
              <div><dt>Płeć</dt><dd>Samiec</dd></div>
              <div><dt>Data urodzenia</dt><dd>{fmtDatePl(pet.birthdate)}</dd></div>
              <div><dt>Wiek</dt><dd>{agePl(pet.birthdate, today)}</dd></div>
              <div><dt>Data raportu</dt><dd>{fmtDatePl(today)}</dd></div>
            </dl>
          </section>

          <h3 className="vet-sec">Podsumowanie</h3>
          <ul className="vet-summary">
            {summary.map((s, i) => (
              <li key={i} className={s.tone}>
                <i />
                <span>{s.text}</span>
              </li>
            ))}
          </ul>

          <h3 className="vet-sec">Kluczowe wskaźniki</h3>
          <div className="vet-grid">
            <div className="vet-tile">
              <b>{weightStats ? `${numPl(weightStats.cur)} g` : '—'}</b>
              <span>masa aktualna{current ? ` (${fmtDatePlShort(current.measured_on)})` : ''}</span>
            </div>
            <div className={`vet-tile ${rapidLoss ? 'bad' : ''}`}>
              <b>
                {weightStats?.change30 === null || !weightStats ? '—' : `${weightStats.change30 > 0 ? '+' : ''}${numPl(weightStats.change30)} g`}
              </b>
              <span>
                zmiana masy — 30 dni
                {weightStats?.change30pct !== null && weightStats?.change30 !== null && weightStats
                  ? ` (${weightStats.change30pct > 0 ? '+' : ''}${numPl(weightStats.change30pct, 1)}%)`
                  : ''}
              </span>
            </div>
            <div className={`vet-tile ${weightStats?.norm === 'ok' ? 'good' : weightStats ? 'warn' : ''}`}>
              <b>{!weightStats ? '—' : weightStats.norm === 'ok' ? 'w normie' : weightStats.norm === 'below' ? 'poniżej' : 'powyżej'}</b>
              <span>norma samca {NORM_MIN}–{NORM_MAX} g</span>
            </div>
            <div className="vet-tile">
              <b>{daily.logged ? `${numPl(diet30.freshG / daily.logged)} g` : '—'}</b>
              <span>świeży pokarm / dzień z zapisem</span>
            </div>
            <div className={`vet-tile ${!daily.logged ? '' : diet30.daysFullVit >= daily.logged * 0.8 ? 'good' : diet30.daysFullVit >= daily.logged * 0.4 ? 'warn' : 'bad'}`}>
              <b>{diet30.daysFullVit}/{daily.logged || 30} dni</b>
              <span>pełna dawka wit. C ({diet30.vitTarget}×/dzień)</span>
            </div>
            <div className="vet-tile good">
              <b>24/7</b>
              <span>siano bez ograniczeń</span>
            </div>
          </div>
          {rapidLoss && (
            <div className="vet-alert">
              <Icon name="alert" size={18} /> Szybka utrata masy ciała (≥10% w 30 dni) — wymaga uwagi lekarza.
            </div>
          )}

          <h3 className="vet-sec">Dynamika masy ciała</h3>
          <div className="vet-card">
            <BigWeightChart data={wAsc} />
            <div className="vet-legend">
              <span><i className="vet-legend-band" /> norma {NORM_MIN}–{NORM_MAX} g</span>
              {weightStats && (
                <>
                  <span>min {numPl(weightStats.min)} g</span>
                  <span>śr. {numPl(weightStats.avg)} g</span>
                  <span>maks {numPl(weightStats.max)} g</span>
                  <span>{weightStats.count} pomiarów od {fmtDatePl(weightStats.firstDate)}</span>
                </>
              )}
            </div>
          </div>

          <h3 className="vet-sec">Pomiary wagi</h3>
          {wDesc.length === 0 && <div className="empty">Brak pomiarów.</div>}
          <div className="vet-table">
            {shownWeights.map((w, i) => {
              const prev = wDesc[i + 1]
              const d = prev ? Number(w.grams) - Number(prev.grams) : null
              return (
                <div key={w.id} className="vet-row">
                  <span className="vet-row-main">
                    {fmtDatePl(w.measured_on)}
                    {w.note && <small>{w.note}</small>}
                  </span>
                  <b>{numPl(w.grams)} g</b>
                  <em className={d > 0 ? 'up' : d < 0 ? 'down' : ''}>{d === null ? '' : `${d > 0 ? '+' : ''}${numPl(d)} g`}</em>
                </div>
              )
            })}
          </div>
          {wDesc.length > 6 && !printAll && (
            <button className="btn btn-ghost btn-block vet-expand" onClick={() => setShowAllWeights((v) => !v)}>
              {showAllWeights ? 'Zwiń listę' : `Pokaż wszystkie pomiary (${wDesc.length})`}
            </button>
          )}

          <h3 className="vet-sec">Żywienie — ostatnie 30 dni</h3>
          <div className="vet-card">
            <h4>Świeży pokarm dziennie (g)</h4>
            <DailyBars days={daily.days} />
            <div className="vet-legend">
              <span><i className="vet-legend-band" /> zalecane {FRESH_MIN}–{FRESH_MAX} g</span>
              <span>zapisy z {daily.logged} z 30 dni</span>
              <span>siano: stały dostęp 24/7</span>
            </div>
          </div>
          <div className="vet-two">
            <div className="vet-card">
              <h4>Struktura świeżego pokarmu</h4>
              {Object.keys(diet30.catG).length === 0 && <div className="empty">Brak danych.</div>}
              {Object.entries(diet30.catG)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, g]) => (
                  <div key={cat} className="vet-bar-row">
                    <span className="vet-bar-name">{CATEGORY_PL[cat] || cat}</span>
                    <span className="vet-bar-track"><i style={{ width: `${(g / maxCat) * 100}%` }} /></span>
                    <span className="vet-bar-val">{numPl(g)} g · {numPl((g / (diet30.freshG || 1)) * 100)}%</span>
                  </div>
                ))}
              <p className="vet-note">
                Różnorodność: {diet30.diversity} produktów · granulat {daily.logged ? numPl((diet30.pelletsPerDay * 30) / daily.logged, 1) : '—'} porcji/dzień
              </p>
            </div>
            <div className="vet-card">
              <h4>Najczęściej podawane</h4>
              {top30.length === 0 && <div className="empty">Brak danych.</div>}
              {top30.map((t) => (
                <div key={t.food.id} className={`vet-food-row ${t.food.safety === 'forbidden' ? 'forbid' : ''}`}>
                  <span className="vet-food-name">{foodPl(t.food)}</span>
                  <span className="vet-food-amt">{numPl(t.grams)} g</span>
                  <span className="vet-food-cnt">{t.days.size} dni</span>
                </div>
              ))}
            </div>
          </div>

          <h3 className="vet-sec">Żywienie — miesiącami</h3>
          {allFeedings === null && <div className="vet-note">Wczytywanie pełnej historii żywienia…</div>}
          {months.length === 0 && allFeedings !== null && <div className="empty">Brak zapisów karmienia.</div>}
          {months.map((mo, idx) => {
            // the newest month starts expanded; a toggle flips whatever the default is
            const open = printAll || openMonths.has(mo.key) !== (idx === 0)
            return (
              <div key={mo.key} className={`vet-month ${open ? 'open' : ''}`}>
                <button className="vet-month-head" onClick={() => toggleMonth(mo.key)} aria-expanded={open}>
                  <b>{fmtMonthPl(mo.key)}</b>
                  <Icon name="down" size={18} className="vet-chev" />
                  <span className="vet-month-sum">
                    <span>świeże {numPl(mo.freshG)} g</span>
                    <span>granulat {numPl(mo.pellets, 1)} porcji</span>
                    <span>wit. C {numPl(mo.vit)} szt.</span>
                  </span>
                </button>
                {open && (
                  <div className="vet-month-body">
                    {mo.items.map((it) => (
                      <div key={it.food.id} className={`vet-food-row ${it.food.safety === 'forbidden' ? 'forbid' : ''}`}>
                        <span className="vet-food-name">{foodPl(it.food)}</span>
                        <span className="vet-food-amt">{itemAmount(it)}</span>
                        <span className="vet-food-cnt">{it.count}×</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <h3 className="vet-sec">Sygnały ostrzegawcze</h3>
          {tops.forbidden.length === 0 && !rapidLoss ? (
            <div className="vet-ok"><Icon name="check" size={18} stroke={2.6} /> Brak produktów zakazanych w dzienniku żywienia. Bez sygnałów alarmowych.</div>
          ) : (
            <>
              {rapidLoss && <div className="vet-alert"><Icon name="alert" size={18} /> Utrata masy ciała ≥10% w 30 dni.</div>}
              {tops.forbidden.map((t) => (
                <div key={t.food.id} className="vet-alert">
                  <Icon name="alert" size={18} />
                  <span>Produkt niewskazany w dzienniku: <b>{foodPl(t.food)}</b> — {t.count}×</span>
                </div>
              ))}
            </>
          )}

          <h3 className="vet-sec">Higiena i opieka</h3>
          <div className="vet-grid">
            <div className="vet-tile">
              <b>{cleanEvery === null ? '—' : `co ${numPl(cleanEvery, 1)} dnia`}</b>
              <span>sprzątanie klatki · ostatnio {cleanings[0] ? fmtDatePlShort(cleanings[0].cleaned_at) : '—'}</span>
            </div>
            <div className="vet-tile">
              <b>{cleanMaxGap === null ? '—' : `${numPl(cleanMaxGap)} dni`}</b>
              <span>najdłuższa przerwa w sprzątaniu (60 dni)</span>
            </div>
            <div className="vet-tile">
              <b>{waterEvery === null ? '—' : `co ${numPl(waterEvery, 1)} dnia`}</b>
              <span>wymiana wody · ostatnio {waterings[0] ? fmtDatePlShort(waterings[0].changed_at) : '—'}</span>
            </div>
            <div className="vet-tile">
              <b>{waterMaxGap === null ? '—' : `${numPl(waterMaxGap)} dni`}</b>
              <span>najdłuższa przerwa w wymianie wody (60 dni)</span>
            </div>
          </div>

          <p className="vet-footer">
            Raport wygenerowany automatycznie przez aplikację Yuki · {fmtDatePl(today)}. Dane pochodzą z domowego dziennika
            opieki (waga, karmienie, witamina C, higiena); dni bez zapisu nie oznaczają braku karmienia.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
