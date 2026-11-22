import { useMemo } from 'react'
import { useData } from '../data.jsx'
import Icon from '../components/Icon.jsx'
import FoodIcon from '../components/FoodIcon.jsx'
import YukiArt from '../components/YukiArt.jsx'
import CoachCard from '../components/CoachCard.jsx'
import { Sparkline, Segments, RangeBar } from '../components/Viz.jsx'
import { cheerClean, cheerWater, cheerFeed } from '../lib/cheers.js'
import { todayISO, daysWord, fmtDate } from '../lib/dates.js'

const FRESH = [80, 150]

function ago(d, zero) {
  if (!isFinite(d)) return 'нет записей'
  return d === 0 ? zero : `${d} ${daysWord(d)} назад`
}

export default function HomeTab({ setTab }) {
  const { status, weights, feedings, foods, addCleaning, addWatering, addFeeding } = useData()
  const { dirty, hot, hungry, needsWeigh, dSinceClean, dSinceWater, dSinceWeigh, dSinceFeed, lastWeight, vitToday, vitTarget, freshToday, feedToday } = status
  const today = todayISO()

  const vitItem = foods.find((f) => f.kind === 'vitamin_c')
  const byId = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods])
  const eaten = useMemo(() => {
    const m = new Map()
    for (const f of feedings) {
      if (f.fed_on !== today) continue
      const food = byId[f.food_id]
      if (!food || food.kind !== 'produce') continue
      m.set(food.id, { food, g: (m.get(food.id)?.g || 0) + Number(f.amount || 0) })
    }
    return [...m.values()].sort((a, b) => b.g - a.g)
  }, [feedings, byId, today])

  const series = weights.slice(-10).map((w) => Number(w.grams))
  const prev = weights.length > 1 ? Number(weights[weights.length - 2].grams) : null
  const delta = lastWeight && prev !== null ? Number(lastWeight.grams) - prev : null

  function giveVit() {
    if (!vitItem) return
    addFeeding({ food_id: vitItem.id, amount: 1, unit: 'pcs', fed_on: today })
    cheerFeed(vitItem, { vitNow: vitToday + 1, vitTarget })
  }

  // what needs doing right now, most urgent first
  const tasks = []
  if (dirty)
    tasks.push({ id: 'clean', tone: 'red', icon: 'broom', title: 'Пора убирать клетку', sub: isFinite(dSinceClean) ? `не убирали ${dSinceClean} ${daysWord(dSinceClean)}` : 'уборок ещё не было', cta: 'Убрали', run: () => { addCleaning(); cheerClean() } })
  if (hot)
    tasks.push({ id: 'water', tone: 'orange', icon: 'drop', title: 'Смени воду', sub: isFinite(dSinceWater) ? `вода стоит ${dSinceWater} ${daysWord(dSinceWater)}` : 'смен воды ещё не было', cta: 'Сменили', run: () => { addWatering(); cheerWater() } })
  if (hungry)
    tasks.push({ id: 'feed', tone: 'blue', icon: 'food', title: 'Еда не записана', sub: isFinite(dSinceFeed) ? (dSinceFeed === 1 ? 'сегодня в дневнике пусто' : `записей нет ${dSinceFeed} ${daysWord(dSinceFeed)}`) : 'дневник еды пуст', cta: 'Записать', run: () => setTab('feed') })
  if (vitToday < vitTarget)
    tasks.push({ id: 'vit', tone: 'peach', icon: 'pill', title: 'Витамин C', sub: `дано ${vitToday} из ${vitTarget} сегодня`, cta: '+1 таблетка', run: giveVit })
  if (needsWeigh)
    tasks.push({ id: 'weigh', tone: 'ink', icon: 'scale', title: 'Пора на весы', sub: lastWeight ? `не взвешивали ${dSinceWeigh} ${daysWord(dSinceWeigh)}` : 'веса ещё нет', cta: 'Взвесить', run: () => setTab('weight') })

  const perfect = tasks.length === 0

  const dateLbl = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  const Go = () => <i className="go"><Icon name="right" size={16} /></i>

  return (
    <div className="tab">
      <div className="page-head">
        <h2>Сегодня</h2>
        <span>{dateLbl}</span>
      </div>

      {perfect ? (
        <div className="perfect">
          <YukiArt mood="happy" prop="crown" size={86} />
          <div>
            <div className="perfect-title">Идеальный день</div>
            <div className="perfect-sub">Накормлен, напоен, в чистоте и с витаминами. Так держать.</div>
          </div>
        </div>
      ) : (
        <div className="tasks">
          {tasks.map((t) => (
            <div key={t.id} className={`task tone-${t.tone}`}>
              <span className="task-ico"><Icon name={t.icon} /></span>
              <span className="task-txt">
                <b>{t.title}</b>
                <small>{t.sub}</small>
              </span>
              <button className="task-cta" onClick={t.run}>{t.cta}</button>
            </div>
          ))}
        </div>
      )}

      <div className="bento">
        <button className={`tile ${dirty ? 'is-bad' : ''}`} onClick={() => setTab('clean')}>
          <span className="tile-top">
            <span className="tile-ico"><Icon name="broom" size={20} /></span>
            <span className="tile-label">Уборка</span>
            <Go />
          </span>
          <span className="tile-val">{ago(dSinceClean, 'сегодня')}</span>
        </button>

        <button className={`tile ${hot ? 'is-bad' : ''}`} onClick={() => setTab('water')}>
          <span className="tile-top">
            <span className="tile-ico"><Icon name="drop" size={20} /></span>
            <span className="tile-label">Вода</span>
            <Go />
          </span>
          <span className="tile-val">{ago(dSinceWater, 'сегодня')}</span>
        </button>
      </div>

      <CoachCard scope="home" signature={status.sigs.home} label="Разбор дня от ИИ" />

      <div className="bento">
        <button className={`tile tile-wide ${hungry ? 'is-bad' : ''}`} onClick={() => setTab('feed')}>
          <span className="tile-top">
            <span className="tile-ico"><Icon name="food" size={20} /></span>
            <span className="tile-label">Еда сегодня</span>
            <Go />
          </span>
          <span className="tile-num">
            {Math.round(freshToday)}
            <small> г свежего</small>
          </span>
          <RangeBar value={freshToday} min={FRESH[0]} max={FRESH[1]} />
          <span className="tile-icons">
            {eaten.slice(0, 7).map((e) => (
              <i key={e.food.id}><FoodIcon food={e.food} size={22} /></i>
            ))}
            {eaten.length === 0 && <em>пока ничего не записано</em>}
            {eaten.length > 7 && <em>+{eaten.length - 7}</em>}
          </span>
          <span className="tile-foot">ориентир {FRESH[0]}–{FRESH[1]} г в день · корм {feedToday} порц.</span>
        </button>

        <button className="tile tile-weight" onClick={() => setTab('weight')}>
          <span className="tile-top">
            <span className="tile-ico"><Icon name="scale" size={20} /></span>
            <span className="tile-label">Вес</span>
            <Go />
          </span>
          <span className="tile-num">
            {lastWeight ? Number(lastWeight.grams) : '—'}
            <small> г</small>
          </span>
          <Sparkline values={series} />
          <span className="tile-foot">
            {delta !== null ? `${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10} г к прошлому · ` : ''}
            {lastWeight ? fmtDate(lastWeight.measured_on) : 'нет взвешиваний'}
          </span>
        </button>

        <button className="tile tile-vit" onClick={() => setTab('feed')}>
          <span className="tile-top">
            <span className="tile-ico"><Icon name="pill" size={20} /></span>
            <span className="tile-label">Вит. C</span>
            <Go />
          </span>
          <span className="tile-num">
            {vitToday}
            <small> из {vitTarget}</small>
          </span>
          <Segments value={vitToday} total={vitTarget} />
          <span className="tile-foot">{vitToday >= vitTarget ? 'на сегодня всё' : `осталось дать ${vitTarget - vitToday}`}</span>
        </button>
      </div>
    </div>
  )
}
