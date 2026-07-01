import { useMemo, useState } from 'react'
import { useData } from '../data.jsx'
import { yukiFeed } from '../lib/bus.js'
import { SAFETY, FREQ, weekLimit, unitLabel } from '../lib/food.js'
import { todayISO, fmtDateFull, fmtDate, weekday } from '../lib/dates.js'

const MS_WEEK = 7 * 86400000

function dayLabel(iso, today) {
  const y = new Date(Date.parse(today) - 86400000).toISOString().slice(0, 10)
  if (iso === today) return 'сегодня'
  if (iso === y) return 'вчера'
  return `${fmtDate(iso)} (${weekday(iso)})`
}

export default function FeedTab() {
  const { foods, feedings, addFeeding, delFeeding } = useData()
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const [grams, setGrams] = useState('')
  const today = todayISO()
  const [day, setDay] = useState(today) // which day we log / view
  const isToday = day === today
  const lbl = dayLabel(day, today)

  const staples = foods.filter((f) => f.is_staple)
  const feedItem = staples.find((f) => f.kind === 'feed')
  const vitItem = staples.find((f) => f.kind === 'vitamin_c')
  const produce = useMemo(() => foods.filter((f) => f.kind === 'produce'), [foods])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return produce.filter((f) => f.name_ru.toLowerCase().includes(s)).slice(0, 40)
  }, [q, produce])

  const byId = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods])
  const dayFeeds = feedings.filter((f) => f.fed_on === day)
  const vitDay = dayFeeds.filter((f) => f.food_id === vitItem?.id).reduce((s, f) => s + Number(f.amount || 0), 0)
  const feedDay = dayFeeds.filter((f) => f.food_id === feedItem?.id).reduce((s, f) => s + Number(f.amount || 0), 0)

  function weekCount(foodId) {
    const since = Date.now() - MS_WEEK
    return feedings.filter((f) => f.food_id === foodId && Date.parse(f.fed_on) >= since).length
  }

  function giveFeed() {
    if (!feedItem) return
    addFeeding({ food_id: feedItem.id, amount: 1, unit: 'portion', fed_on: day })
    if (isToday) yukiFeed(feedItem.emoji || '🥣')
  }
  function giveVitamin() {
    if (!vitItem) return
    addFeeding({ food_id: vitItem.id, amount: 1, unit: 'pcs', fed_on: day })
    if (isToday) yukiFeed(vitItem.emoji || '💊')
  }
  function removeLastVitamin() {
    const mine = dayFeeds.filter((f) => f.food_id === vitItem?.id)
    if (mine[0]) delFeeding(mine[0].id)
  }

  function addProduce(food) {
    const g = Number(grams)
    if (!g || g <= 0) return
    addFeeding({ food_id: food.id, amount: g, unit: 'g', fed_on: day })
    if (isToday) yukiFeed(food.emoji || '🥗')
    setOpenId(null)
    setGrams('')
    setQ('')
  }

  // items eaten on the selected day (produce, excluding staples)
  const producedDay = useMemo(() => {
    const map = {}
    for (const f of dayFeeds) {
      const food = byId[f.food_id]
      if (!food || food.is_staple) continue
      if (!map[f.food_id]) map[f.food_id] = { food, total: 0, ids: [] }
      map[f.food_id].total += Number(f.amount || 0)
      map[f.food_id].ids.push(f.id)
    }
    return Object.values(map)
  }, [dayFeeds, byId])

  // history: every other day, newest first (tap to open)
  const history = useMemo(() => {
    const days = {}
    for (const f of feedings) {
      if (f.fed_on === day) continue
      ;(days[f.fed_on] ||= []).push(f)
    }
    return Object.entries(days)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 60)
  }, [feedings, day])

  return (
    <div className="tab">
      {/* day selector */}
      <div className="day-bar">
        <span className="day-ico">📅</span>
        <input type="date" value={day} max={today} onChange={(e) => setDay(e.target.value || today)} />
        {!isToday && (
          <button className="btn btn-ghost btn-sm" onClick={() => setDay(today)}>
            Сегодня
          </button>
        )}
      </div>

      {/* pinned staples */}
      <div className="staples">
        <div className="staple">
          <div className="staple-emoji">{feedItem?.emoji || '🥣'}</div>
          <div className="staple-info">
            <div className="staple-name">Корм</div>
            <div className="staple-sub">
              {lbl}: {feedDay} порц.
            </div>
          </div>
          <button className="btn btn-primary" onClick={giveFeed}>
            + порция
          </button>
        </div>

        <div className={`staple ${vitDay >= (vitItem?.daily_target || 3) ? 'staple-done' : ''}`}>
          <div className="staple-emoji">{vitItem?.emoji || '💊'}</div>
          <div className="staple-info">
            <div className="staple-name">Витамин C</div>
            <div className="staple-sub">
              {vitDay} из {vitItem?.daily_target || 3} шт · {lbl}
            </div>
            <div className="vit-dots">
              {Array.from({ length: vitItem?.daily_target || 3 }).map((_, i) => (
                <span key={i} className={`vit-dot ${i < vitDay ? 'on' : ''}`} />
              ))}
            </div>
          </div>
          <div className="staple-actions">
            {vitDay > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={removeLastVitamin}>
                −
              </button>
            )}
            <button className="btn btn-primary" onClick={giveVitamin}>
              + шт
            </button>
          </div>
        </div>
      </div>

      {/* search produce */}
      <div className="search-wrap">
        <input
          className="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpenId(null)
          }}
          placeholder="🔎 Найти фрукт или овощ…"
        />
      </div>

      {q && (
        <ul className="food-list">
          {results.length === 0 && <div className="empty">Ничего не найдено.</div>}
          {results.map((f) => {
            const saf = SAFETY[f.safety] || SAFETY.safe
            const cnt = weekCount(f.id)
            const lim = weekLimit(f.frequency)
            const over = f.safety !== 'safe' && cnt >= lim
            const open = openId === f.id
            return (
              <li key={f.id} className={`food-item ${open ? 'open' : ''}`}>
                <button className="food-head" onClick={() => setOpenId(open ? null : f.id)}>
                  <span className="food-emoji">{f.emoji}</span>
                  <span className="food-texts">
                    <span className="food-name">{f.name_ru}</span>
                    <span className="food-note">{f.freq_note_ru}</span>
                  </span>
                  <span className={`safety-badge ${saf.cls}`}>{saf.txt}</span>
                </button>

                {open && (
                  <div className="food-add">
                    <div className="food-meta">
                      Частота: <b>{FREQ[f.frequency] || '—'}</b>
                      {f.portion_ru ? <> · порция: {f.portion_ru}</> : null}
                      {' · '}за неделю дали: {cnt} раз
                    </div>
                    {f.safety === 'forbidden' && (
                      <div className="warn warn-bad">⚠️ Этот продукт свинкам нельзя. {f.freq_note_ru}</div>
                    )}
                    {over && f.safety !== 'forbidden' && (
                      <div className="warn">⚠️ На этой неделе уже давали {cnt} раз — лучше сделать паузу.</div>
                    )}
                    <div className="food-add-row">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="1"
                        step="1"
                        value={grams}
                        onChange={(e) => setGrams(e.target.value)}
                        placeholder="граммы"
                        autoFocus
                      />
                      <button
                        className={`btn ${f.safety === 'forbidden' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => addProduce(f)}
                        disabled={!grams}
                      >
                        Дать {grams || ''} г
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* selected day's log */}
      <h3 className="list-title">
        {lbl[0].toUpperCase() + lbl.slice(1)} — съедено
      </h3>
      {producedDay.length === 0 && vitDay === 0 && feedDay === 0 && (
        <div className="empty">В этот день ничего не давали.</div>
      )}
      <ul className="log">
        {feedDay > 0 && (
          <li className="log-row">
            <span className="log-ico">{feedItem?.emoji || '🥣'}</span>
            <span className="log-main">
              <span className="log-when">Корм — {feedDay} порц.</span>
            </span>
          </li>
        )}
        {vitDay > 0 && (
          <li className="log-row">
            <span className="log-ico">{vitItem?.emoji || '💊'}</span>
            <span className="log-main">
              <span className="log-when">
                Витамин C — {vitDay}/{vitItem?.daily_target || 3} шт
              </span>
            </span>
          </li>
        )}
        {producedDay.map((p) => (
          <li key={p.food.id} className="log-row">
            <span className="log-ico">{p.food.emoji}</span>
            <span className="log-main">
              <span className="log-when">
                {p.food.name_ru} — <b>{p.total} г</b>
              </span>
            </span>
            <button className="icon-del" onClick={() => p.ids.forEach(delFeeding)} title="Убрать">
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* other days */}
      {history.length > 0 && (
        <>
          <h3 className="list-title">Другие дни</h3>
          <div className="history">
            {history.map(([d, list]) => {
              const map = {}
              for (const f of list) {
                const food = byId[f.food_id]
                if (!food) continue
                if (!map[f.food_id]) map[f.food_id] = { food, total: 0, unit: f.unit }
                map[f.food_id].total += Number(f.amount || 0)
              }
              return (
                <button key={d} className="hist-day" onClick={() => setDay(d)}>
                  <div className="hist-date">
                    {fmtDateFull(d)} · {weekday(d)}
                  </div>
                  <div className="hist-items">
                    {Object.values(map).map((m) => (
                      <span key={m.food.id} className="hist-chip">
                        {m.food.emoji} {m.food.name_ru} · {m.total} {unitLabel(m.unit)}
                      </span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
