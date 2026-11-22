import { useMemo, useState } from 'react'
import { useData } from '../data.jsx'
import { useConfirm } from '../components/Confirm.jsx'
import FoodIcon from '../components/FoodIcon.jsx'
import Icon from '../components/Icon.jsx'
import CoachCard from '../components/CoachCard.jsx'
import { RangeBar, Segments } from '../components/Viz.jsx'
import { cheerFeed } from '../lib/cheers.js'
import { yukiSay, yukiHop } from '../lib/bus.js'
import { wheek } from '../lib/eggs.js'
import { SAFETY, FREQ, weekLimit, unitLabel } from '../lib/food.js'
import { todayISO, fmtDateFull, fmtDate, weekday, isoOf, MS_DAY } from '../lib/dates.js'

const MS_WEEK = 7 * MS_DAY
const FRESH = [80, 150]

const CATS = [
  { key: 'vegetable', label: 'Овощи' },
  { key: 'fruit', label: 'Фрукты' },
  { key: 'green', label: 'Зелень' },
  { key: 'herb', label: 'Травы' },
  { key: 'treat', label: 'Лакомства' },
]

function dayLabel(iso, today) {
  const y = isoOf(new Date(Date.now() - MS_DAY))
  if (iso === today) return 'сегодня'
  if (iso === y) return 'вчера'
  return `${fmtDate(iso)} (${weekday(iso)})`
}

export default function FeedTab() {
  const { foods, feedings, foodPrefs, addFeeding, delFeeding, setFoodDefault, clearFoodDefault, status } = useData()
  const confirm = useConfirm()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [openId, setOpenId] = useState(null)
  const [grams, setGrams] = useState('')
  const today = todayISO()
  const [day, setDay] = useState(today) // which day we log / view
  const [histN, setHistN] = useState(7)
  const isToday = day === today
  const lbl = dayLabel(day, today)

  const staples = foods.filter((f) => f.is_staple)
  const feedItem = staples.find((f) => f.kind === 'feed')
  const vitItem = staples.find((f) => f.kind === 'vitamin_c')
  const vitTarget = vitItem?.daily_target || 3
  const produce = useMemo(() => foods.filter((f) => f.kind === 'produce'), [foods])
  const byId = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods])

  // last 7 days as tappable chips
  const week = useMemo(() => {
    const logged = new Set(feedings.map((f) => f.fed_on))
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * MS_DAY)
      const iso = isoOf(d)
      return { iso, wd: weekday(iso), n: d.getDate(), has: logged.has(iso) }
    })
  }, [feedings])

  const squeak = /^(вик|уик|wheek|хрю|пи-?пи)/i.test(q.trim())
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s) return produce.filter((f) => f.name_ru.toLowerCase().includes(s)).slice(0, 60)
    if (cat) return produce.filter((f) => f.category === cat)
    return []
  }, [q, cat, produce])

  const dayFeeds = feedings.filter((f) => f.fed_on === day)
  const vitDay = dayFeeds.filter((f) => f.food_id === vitItem?.id).reduce((s, f) => s + Number(f.amount || 0), 0)
  const feedDay = dayFeeds.filter((f) => f.food_id === feedItem?.id).reduce((s, f) => s + Number(f.amount || 0), 0)

  const favorites = useMemo(
    () => produce.filter((f) => foodPrefs[f.id] > 0).sort((a, b) => a.name_ru.localeCompare(b.name_ru)),
    [produce, foodPrefs],
  )

  function weekCount(foodId) {
    const since = Date.now() - MS_WEEK
    return feedings.filter((f) => f.food_id === foodId && Date.parse(f.fed_on) >= since).length
  }

  function give(food, amount, unit) {
    addFeeding({ food_id: food.id, amount, unit, fed_on: day })
    if (isToday) cheerFeed(food, { vitNow: vitDay + 1, vitTarget, count: feedings.length + 1 })
  }
  const giveFeed = () => feedItem && give(feedItem, 1, 'portion')
  const giveVitamin = () => vitItem && give(vitItem, 1, 'pcs')
  function removeLast(item) {
    const mine = dayFeeds.filter((f) => f.food_id === item?.id)
    if (mine[0]) delFeeding(mine[0].id)
  }

  function feedProduce(food, g) {
    g = Number(g)
    if (!g || g <= 0) return
    give(food, g, 'g')
  }
  function addFromPanel(food) {
    if (!Number(grams)) return
    feedProduce(food, grams)
    setOpenId(null)
    setGrams('')
  }
  function openFood(food) {
    const willOpen = openId !== food.id
    setOpenId(willOpen ? food.id : null)
    setGrams(willOpen && foodPrefs[food.id] > 0 ? String(foodPrefs[food.id]) : '')
  }

  async function removeProduce(p) {
    const ok = await confirm({ title: `Убрать «${p.food.name_ru}»?`, message: `${p.total} г за ${lbl}. Запись удалится.` })
    if (ok) p.ids.forEach(delFeeding)
  }

  const producedDay = useMemo(() => {
    const map = {}
    for (const f of dayFeeds) {
      const food = byId[f.food_id]
      if (!food || food.is_staple) continue
      if (!map[f.food_id]) map[f.food_id] = { food, total: 0, ids: [] }
      map[f.food_id].total += Number(f.amount || 0)
      map[f.food_id].ids.push(f.id)
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [dayFeeds, byId])
  const freshDay = producedDay.reduce((s, p) => s + p.total, 0)

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

  const listMode = q.trim() ? 'search' : cat ? 'cat' : 'none'
  const freshState = freshDay > FRESH[1] * 1.35 ? 'много' : freshDay >= FRESH[0] ? 'в норме' : 'мало'

  return (
    <div className="tab">
      <div className="page-head">
        <h2>Питание</h2>
        <span>{isToday ? 'сегодня' : fmtDateFull(day)}</span>
      </div>

      {/* day picker */}
      <div className="daystrip">
        {week.map((d) => (
          <button key={d.iso} className={`daychip ${day === d.iso ? 'on' : ''} ${d.has ? 'has' : ''}`} onClick={() => setDay(d.iso)}>
            <small>{d.wd}</small>
            <b>{d.n}</b>
            <i />
          </button>
        ))}
        <label className={`daychip daychip-cal ${week.some((d) => d.iso === day) ? '' : 'on'}`} aria-label="Выбрать другую дату">
          <Icon name="calendar" size={20} />
          <input type="date" value={day} max={today} onChange={(e) => setDay(e.target.value || today)} />
        </label>
      </div>

      {/* the day at a glance */}
      <section className="card day-card">
        <div className="day-head">
          <div>
            <div className="kicker">Свежее · {lbl}</div>
            <div className="big-num">
              {Math.round(freshDay)}
              <small> г</small>
            </div>
          </div>
          <span className={`badge ${freshState === 'в норме' ? 'ok' : freshState === 'много' ? 'bad' : 'warn'}`}>{freshState}</span>
        </div>
        <RangeBar value={freshDay} min={FRESH[0]} max={FRESH[1]} />
        <div className="range-legend">
          <span>ориентир {FRESH[0]}–{FRESH[1]} г в день</span>
          <span>{producedDay.length} {producedDay.length === 1 ? 'продукт' : producedDay.length >= 2 && producedDay.length <= 4 ? 'продукта' : 'продуктов'}</span>
        </div>

        <div className="staple">
          <span className="staple-ico"><FoodIcon food={feedItem} size={32} /></span>
          <div className="staple-info">
            <b>Корм</b>
            <small>{feedDay} порц. · {lbl}</small>
          </div>
          <div className="stepper">
            {feedDay > 0 && (
              <button className="step" onClick={() => removeLast(feedItem)} aria-label="Убрать порцию"><Icon name="minus" size={18} /></button>
            )}
            <button className="step step-add" onClick={giveFeed} aria-label="Добавить порцию корма"><Icon name="plus" size={18} /></button>
          </div>
        </div>

        <div className={`staple ${vitDay >= vitTarget ? 'done' : ''}`}>
          <span className="staple-ico"><FoodIcon food={vitItem} size={32} /></span>
          <div className="staple-info">
            <b>Витамин C</b>
            <Segments value={vitDay} total={vitTarget} />
            <small>{vitDay} из {vitTarget} таблеток</small>
          </div>
          <div className="stepper">
            {vitDay > 0 && (
              <button className="step" onClick={() => removeLast(vitItem)} aria-label="Убрать таблетку"><Icon name="minus" size={18} /></button>
            )}
            <button className="step step-add" onClick={giveVitamin} aria-label="Добавить таблетку"><Icon name="plus" size={18} /></button>
          </div>
        </div>
      </section>

      {isToday && <CoachCard scope="food" signature={status.sigs.food} label="ИИ про питание" />}

      {/* saved portions → one tap */}
      {favorites.length > 0 && (
        <section>
          <h3 className="sec-title">Мои порции <small>нажми, чтобы дать</small></h3>
          <div className="fav-chips">
            {favorites.map((f) => (
              <button key={f.id} className="fav-chip" onClick={() => feedProduce(f, foodPrefs[f.id])}>
                <FoodIcon food={f} size={26} />
                <span className="fav-name">{f.name_ru}</span>
                <span className="fav-g">+{foodPrefs[f.id]} г</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* catalog */}
      <section>
        <h3 className="sec-title">Дать что-то ещё <small>найди или выбери раздел</small></h3>
        <label className="search">
          <Icon name="search" size={20} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpenId(null)
            }}
            placeholder="Найти овощ, фрукт или травку"
            enterKeyHint="search"
          />
          {q && (
            <button type="button" className="search-x" onClick={() => setQ('')} aria-label="Очистить"><Icon name="x" size={16} /></button>
          )}
        </label>

        {!q.trim() && (
          <div className="cat-row">
            {CATS.map((c) => (
              <button
                key={c.key}
                className={`cat-chip ${cat === c.key ? 'on' : ''}`}
                onClick={() => {
                  setCat(cat === c.key ? '' : c.key)
                  setOpenId(null)
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {squeak && (
          <button
            className="egg-row"
            onClick={() => {
              wheek(5)
              yukiHop('popcorn')
              yukiSay('ВИК-ВИК-ВИК! Ты говоришь по-свински?!', 4000)
            }}
          >
            Вик-вик! Нажми, если понимаешь по-свински
          </button>
        )}

        {listMode !== 'none' && (
          <ul className="food-list">
            {results.length === 0 && !squeak && <div className="empty">Ничего не найдено.</div>}
            {results.map((f) => {
              const saf = SAFETY[f.safety] || SAFETY.safe
              const cnt = weekCount(f.id)
              const lim = weekLimit(f.frequency)
              const over = f.safety !== 'safe' && cnt >= lim
              const open = openId === f.id
              const def = foodPrefs[f.id] > 0 ? foodPrefs[f.id] : null
              return (
                <li key={f.id} className={`food-item ${open ? 'open' : ''} saf-${saf.cls}`}>
                  <div className="food-head-row">
                    <button className="food-head" onClick={() => openFood(f)} aria-expanded={open}>
                      <span className="food-ico"><FoodIcon food={f} size={34} /></span>
                      <span className="food-texts">
                        <span className="food-name">{f.name_ru}</span>
                        <span className="food-note">{f.freq_note_ru}</span>
                      </span>
                      <span className={`safety ${saf.cls}`}>{saf.txt}</span>
                      <i className={`food-chev ${open ? 'up' : ''}`}><Icon name="down" size={18} /></i>
                    </button>
                    {def && f.safety !== 'forbidden' && (
                      <button className="quick-give" onClick={() => feedProduce(f, def)} aria-label={`Дать ${def} г`}>
                        +{def} г
                      </button>
                    )}
                  </div>

                  {open && (
                    <div className="food-add">
                      <div className="food-meta">
                        <span><b>{FREQ[f.frequency] || '—'}</b></span>
                        {f.portion_ru ? <span>порция: {f.portion_ru}</span> : null}
                        <span>за неделю: {cnt} раз</span>
                      </div>
                      {f.safety === 'forbidden' && (
                        <div className="warn warn-bad"><Icon name="alert" size={18} /> Этот продукт свинкам нельзя. {f.freq_note_ru}</div>
                      )}
                      {over && f.safety !== 'forbidden' && (
                        <div className="warn"><Icon name="alert" size={18} /> На этой неделе уже давали {cnt} раз — лучше сделать паузу.</div>
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
                          aria-label="Граммы"
                          autoFocus
                        />
                        <button className={`btn ${f.safety === 'forbidden' ? 'btn-danger' : 'btn-primary'}`} onClick={() => addFromPanel(f)} disabled={!grams}>
                          Дать {grams || ''} г
                        </button>
                      </div>
                      <div className="def-row">
                        {def ? (
                          <>
                            <span className="def-note">Обычная порция: <b>{def} г</b></span>
                            {Number(grams) > 0 && Number(grams) !== def && (
                              <button className="def-btn" onClick={() => setFoodDefault(f.id, grams)}>Сделать {grams} г обычной</button>
                            )}
                            <button className="def-btn def-clear" onClick={() => clearFoodDefault(f.id)}>Убрать шаблон</button>
                          </>
                        ) : (
                          Number(grams) > 0 && (
                            <button className="def-btn" onClick={() => setFoodDefault(f.id, grams)}>
                              <Icon name="star" size={14} /> Запомнить {grams} г как обычную порцию
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* selected day's log */}
      <h3 className="sec-title">Съедено · {lbl}</h3>
      {producedDay.length === 0 && vitDay === 0 && feedDay === 0 && <div className="empty">В этот день ничего не записано.</div>}
      <ul className="log">
        {feedDay > 0 && (
          <li className="log-row">
            <span className="log-ico"><FoodIcon food={feedItem} size={26} /></span>
            <span className="log-main"><span className="log-when">Корм</span></span>
            <span className="log-val"><b>{feedDay} порц.</b></span>
          </li>
        )}
        {vitDay > 0 && (
          <li className="log-row">
            <span className="log-ico"><FoodIcon food={vitItem} size={26} /></span>
            <span className="log-main"><span className="log-when">Витамин C</span></span>
            <span className="log-val"><b>{vitDay}/{vitTarget} шт</b></span>
          </li>
        )}
        {producedDay.map((p) => (
          <li key={p.food.id} className="log-row">
            <span className="log-ico"><FoodIcon food={p.food} size={26} /></span>
            <span className="log-main"><span className="log-when">{p.food.name_ru}</span></span>
            <span className="log-val"><b>{p.total} г</b></span>
            <button className="icon-del" onClick={() => removeProduce(p)} aria-label="Убрать">
              <Icon name="x" size={16} />
            </button>
          </li>
        ))}
      </ul>

      {/* other days */}
      {history.length > 0 && (
        <>
          <h3 className="sec-title">Другие дни</h3>
          <div className="history">
            {history.slice(0, histN).map(([d, list]) => {
              const map = {}
              for (const f of list) {
                const food = byId[f.food_id]
                if (!food) continue
                if (!map[f.food_id]) map[f.food_id] = { food, total: 0, unit: f.unit }
                map[f.food_id].total += Number(f.amount || 0)
              }
              return (
                <button key={d} className="hist-day" onClick={() => { setDay(d); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                  <div className="hist-date">
                    <b>{fmtDateFull(d)}</b> <span>{weekday(d)}</span>
                    <i className="go"><Icon name="right" size={16} /></i>
                  </div>
                  <div className="hist-items">
                    {Object.values(map).map((m) => (
                      <span key={m.food.id} className="hist-chip">
                        <FoodIcon food={m.food} size={18} />
                        {m.food.name_ru} · {m.total} {unitLabel(m.unit)}
                      </span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
          {history.length > histN && (
            <button className="btn btn-ghost btn-block" onClick={() => setHistN((n) => n + 14)}>
              Показать ещё ({history.length - histN})
            </button>
          )}
        </>
      )}
    </div>
  )
}
