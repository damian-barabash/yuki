import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../data.jsx'
import { sel } from '../lib/supabase.js'
import { todayISO, isoOf, MS_DAY } from '../lib/dates.js'
import {
  foodPl, fmtDatePl, fmtDatePlShort, fmtMonthPl, monthShortPl, agePl, numPl, CATEGORY_PL,
} from '../lib/vetPl.js'

const NORM_MIN = 700
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
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Wykres masy ciała">
      {view.band && (
        <rect x={pad.l} y={view.band.y} width={W - pad.l - pad.r} height={view.band.h} className="vet-norm-band" />
      )}
      {view.yticks.map((t, i) => (
        <g key={`y${i}`}>
          <line x1={pad.l} x2={W - pad.r} y1={view.sy(t)} y2={view.sy(t)} className="chart-grid" />
          <text x={6} y={view.sy(t) + 3.5} className="chart-ylabel vet-axis">{t} g</text>
        </g>
      ))}
      {view.xshow.map((t, i) => (
        <g key={`x${i}`}>
          <line x1={t.x} x2={t.x} y1={pad.t} y2={H - pad.b} className="chart-grid vet-grid-v" />
          <text x={t.x} y={H - 10} className="chart-xlabel vet-axis" textAnchor="middle">{t.label}</text>
        </g>
      ))}
      {view.xshow.length === 0 && (
        <text x={view.pts[0].x} y={H - 10} className="chart-xlabel vet-axis" textAnchor="middle">
          {fmtDatePlShort(view.pts[0].d.measured_on)}
        </text>
      )}
      <path d={view.area} className="chart-area" />
      <path d={view.line} className="chart-line" />
      {view.pts.map((p, i) => {
        const edge = i === 0 || i === view.pts.length - 1
        if (many && !edge) return null
        return <circle key={i} cx={p.x} cy={p.y} r={many ? 3.6 : 3} className="chart-dot" />
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

  const cleanEvery = avgIntervalDays(cleanings.map((c) => c.cleaned_at))
  const waterEvery = avgIntervalDays(waterings.map((w) => w.changed_at))

  const shownWeights = showAllWeights || printAll ? wDesc : wDesc.slice(0, 6)
  const rapidLoss = weightStats?.change30pct !== null && weightStats?.change30pct <= -10

  function itemAmount(it) {
    if (it.food.kind === 'feed') return `${numPl(it.amount, 1)} porcji`
    if (it.food.kind === 'vitamin_c') return `${numPl(it.amount)} szt.`
    return `${numPl(it.grams)} g`
  }

  return createPortal(
    <div className="vet-scrim" onClick={onClose}>
      <div className="vet" onClick={(e) => e.stopPropagation()}>
        <div className="vet-top">
          <span className="vet-top-ico">🩺</span>
          <h2>Raport weterynaryjny</h2>
          <div className="vet-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                // expand everything first, then print on the next frame so the DOM is complete
                setPrintAll(true)
                setTimeout(() => window.print(), 60)
              }}
            >
              🖨 Drukuj / PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={onClose}>✕ Zamknij</button>
          </div>
        </div>

        <div className="vet-body">
          <div className="vet-info">
            <div><span>Pacjent</span><b>{pet.name || 'Yuki'}</b></div>
            <div><span>Gatunek</span><b>Świnka morska (Cavia porcellus)</b></div>
            <div><span>Płeć</span><b>Samiec</b></div>
            <div><span>Data urodzenia</span><b>{fmtDatePl(pet.birthdate)}</b></div>
            <div><span>Wiek</span><b>{agePl(pet.birthdate, today)}</b></div>
            <div><span>Data raportu</span><b>{fmtDatePl(today)}</b></div>
          </div>

          <h3 className="vet-sec">Kluczowe wskaźniki</h3>
          <div className="vet-grid">
            <div className="vet-tile">
              <b>{weightStats ? `${numPl(weightStats.cur)} g` : '—'}</b>
              <span>masa aktualna{current ? ` (${fmtDatePlShort(current.measured_on)})` : ''}</span>
            </div>
            <div className={`vet-tile ${rapidLoss ? 'bad' : weightStats?.change30 > 0 ? 'good' : ''}`}>
              <b>
                {weightStats?.change30 === null || !weightStats
                  ? '—'
                  : `${weightStats.change30 > 0 ? '+' : ''}${numPl(weightStats.change30)} g`}
                {weightStats?.change30pct !== null && weightStats?.change30 !== null
                  ? ` (${weightStats.change30pct > 0 ? '+' : ''}${numPl(weightStats.change30pct, 1)}%)`
                  : ''}
              </b>
              <span>zmiana masy — 30 dni</span>
            </div>
            <div className={`vet-tile ${weightStats?.norm === 'ok' ? 'good' : weightStats ? 'warn' : ''}`}>
              <b>{!weightStats ? '—' : weightStats.norm === 'ok' ? 'w normie' : weightStats.norm === 'below' ? 'poniżej normy' : 'powyżej normy'}</b>
              <span>norma dorosłego samca: {NORM_MIN}–{NORM_MAX} g</span>
            </div>
            <div className="vet-tile">
              <b>{numPl(diet30.freshPerDay)} g</b>
              <span>świeży pokarm śr. / dzień (30 dni)</span>
            </div>
            <div className={`vet-tile ${diet30.daysFullVit >= 24 ? 'good' : diet30.daysFullVit >= 12 ? 'warn' : 'bad'}`}>
              <b>{diet30.daysFullVit}/30 dni</b>
              <span>pełna dawka wit. C ({diet30.vitTarget}×/dzień)</span>
            </div>
            <div className="vet-tile">
              <b>{cleanEvery === null ? '—' : `co ${numPl(cleanEvery, 1)} dnia`}</b>
              <span>sprzątanie klatki (średnio)</span>
            </div>
          </div>
          {rapidLoss && (
            <div className="vet-alert">
              ⚠️ Szybka utrata masy ciała (≥10% w 30 dni) — wymaga uwagi weterynarza.
            </div>
          )}

          <h3 className="vet-sec">Dynamika masy ciała</h3>
          <div className="vet-chart-card">
            <BigWeightChart data={wAsc} />
            <div className="vet-chart-legend">
              <i className="vet-legend-band" /> norma {NORM_MIN}–{NORM_MAX} g
              {weightStats && (
                <em>
                  min {numPl(weightStats.min)} g · śr. {numPl(weightStats.avg)} g · maks {numPl(weightStats.max)} g ·{' '}
                  {weightStats.count} pomiarów od {fmtDatePl(weightStats.firstDate)}
                </em>
              )}
            </div>
          </div>

          <h3 className="vet-sec">Pomiary wagi</h3>
          {wDesc.length === 0 && <div className="empty">Brak pomiarów.</div>}
          <ul className="log vet-log">
            {shownWeights.map((w, i) => {
              const prev = wDesc[i + 1]
              const d = prev ? Number(w.grams) - Number(prev.grams) : null
              return (
                <li key={w.id} className="log-row vet-w-row">
                  <span className="log-main">
                    <span className="log-when">{fmtDatePl(w.measured_on)}</span>
                    {w.note && <span className="log-by">{w.note}</span>}
                  </span>
                  <b className="vet-w-val">{numPl(w.grams)} g</b>
                  <span className={`vet-w-delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`}>
                    {d === null ? '' : `${d > 0 ? '+' : ''}${numPl(d)} g`}
                  </span>
                </li>
              )
            })}
          </ul>
          {wDesc.length > 6 && (
            <button className="btn btn-ghost btn-block vet-expand" onClick={() => setShowAllWeights((v) => !v)}>
              {showAllWeights ? 'Zwiń listę' : `Pokaż wszystkie pomiary (${wDesc.length})`}
            </button>
          )}

          <h3 className="vet-sec">Żywienie — miesiącami</h3>
          {allFeedings === null && <div className="hint">Wczytywanie pełnej historii żywienia…</div>}
          {months.length === 0 && allFeedings !== null && <div className="empty">Brak zapisów karmienia.</div>}
          {months.map((mo, idx) => {
            // the newest month starts expanded; a toggle flips whatever the default is
            const open = printAll || openMonths.has(mo.key) !== (idx === 0)
            return (
              <div key={mo.key} className={`vet-month ${open ? 'open' : ''}`}>
                <button className="vet-month-head" onClick={() => toggleMonth(mo.key)}>
                  <b>{fmtMonthPl(mo.key)}</b>
                  <span className="vet-month-sum">
                    🥬 {numPl(mo.freshG)} g · 🌾 {numPl(mo.pellets, 1)} porcji · 🍊 wit. C {numPl(mo.vit)} szt.
                  </span>
                  <i className="vet-chev">{open ? '▾' : '▸'}</i>
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

          <h3 className="vet-sec">Podsumowanie diety (ostatnie 30 dni)</h3>
          <div className="vet-two">
            <div className="vet-panel">
              <h4>Struktura świeżego pokarmu</h4>
              {Object.keys(diet30.catG).length === 0 && <div className="empty">Brak danych.</div>}
              {Object.entries(diet30.catG)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, g]) => (
                  <div key={cat} className="vet-food-row">
                    <span className="vet-food-name">{CATEGORY_PL[cat] || cat}</span>
                    <span className="vet-food-amt">{numPl(g)} g</span>
                    <span className="vet-food-cnt">{numPl((g / (diet30.freshG || 1)) * 100)}%</span>
                  </div>
                ))}
              <div className="hint vet-hint">
                Różnorodność: {diet30.diversity} różnych produktów · granulat śr. {numPl(diet30.pelletsPerDay, 1)} porcji/dzień
              </div>
            </div>
            <div className="vet-panel">
              <h4>Najczęściej podawane (cała historia)</h4>
              {tops.byCount.length === 0 && <div className="empty">Brak danych.</div>}
              {tops.byCount.map((t) => (
                <div key={t.food.id} className="vet-food-row">
                  <span className="vet-food-name">{foodPl(t.food)}</span>
                  <span className="vet-food-amt">{numPl(t.grams)} g</span>
                  <span className="vet-food-cnt">{t.count}×</span>
                </div>
              ))}
            </div>
          </div>

          <h3 className="vet-sec">Sygnały ostrzegawcze</h3>
          {tops.forbidden.length === 0 && !rapidLoss ? (
            <div className="vet-ok">✓ Brak produktów zakazanych w dzienniku żywienia. Bez sygnałów alarmowych.</div>
          ) : (
            <>
              {tops.forbidden.map((t) => (
                <div key={t.food.id} className="vet-alert">
                  ⚠️ Produkt niewskazany w dzienniku: <b>{foodPl(t.food)}</b> — {t.count}×
                </div>
              ))}
            </>
          )}

          <h3 className="vet-sec">Higiena i opieka</h3>
          <div className="vet-grid">
            <div className="vet-tile">
              <b>{cleanEvery === null ? '—' : `co ${numPl(cleanEvery, 1)} dnia`}</b>
              <span>sprzątanie klatki · ostatnio {cleanings[0] ? fmtDatePl(cleanings[0].cleaned_at) : '—'}</span>
            </div>
            <div className="vet-tile">
              <b>{waterEvery === null ? '—' : `co ${numPl(waterEvery, 1)} dnia`}</b>
              <span>wymiana wody · ostatnio {waterings[0] ? fmtDatePl(waterings[0].changed_at) : '—'}</span>
            </div>
            <div className="vet-tile">
              <b>{weightStats ? `${numPl(weightStats.count)}` : '0'}</b>
              <span>pomiarów wagi łącznie</span>
            </div>
          </div>

          <p className="vet-footer">
            Raport wygenerowany automatycznie przez aplikację Yuki · {fmtDatePl(today)}. Dane pochodzą z domowego
            dziennika opieki (waga, karmienie, witamina C, higiena).
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
