import { useMemo, useState } from 'react'
import { useData } from '../data.jsx'
import WeightChart from '../components/WeightChart.jsx'
import CoachCard from '../components/CoachCard.jsx'
import Icon from '../components/Icon.jsx'
import { useConfirm } from '../components/Confirm.jsx'
import { cheerWeight } from '../lib/cheers.js'
import { todayISO, fmtDateFull, ageString, daysWord, isoOf, MS_DAY } from '../lib/dates.js'

const NORM = [900, 1200]
const RANGES = [
  { id: '3m', label: '3 мес', days: 92 },
  { id: 'all', label: 'Всё', days: 0 },
]

export default function WeightTab() {
  const { weights, addWeight, delWeight, status, pet } = useData()
  const { needsWeigh, dSinceWeigh, lastWeight } = status
  const confirm = useConfirm()
  const [date, setDate] = useState(todayISO())
  const [grams, setGrams] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [range, setRange] = useState('3m')
  const [shown, setShown] = useState(8)

  const sorted = useMemo(() => [...weights].sort((a, b) => (a.measured_on < b.measured_on ? 1 : -1)), [weights])
  const latest = sorted[0] || null
  const prev = sorted[1] || null
  const delta = latest && prev ? Number(latest.grams) - Number(prev.grams) : null

  // change over ~a month: the number a vet actually asks about
  const month = useMemo(() => {
    if (!latest) return null
    const cut = isoOf(new Date(Date.parse(latest.measured_on) - 25 * MS_DAY))
    const base = sorted.find((w) => w.measured_on <= cut)
    if (!base) return null
    const ch = Number(latest.grams) - Number(base.grams)
    return { ch, pct: (ch / Number(base.grams)) * 100 }
  }, [sorted, latest])

  const chartData = useMemo(() => {
    const asc = sorted.slice().reverse()
    const r = RANGES.find((x) => x.id === range)
    if (!r.days) return asc
    const cut = isoOf(new Date(Date.now() - r.days * MS_DAY))
    const f = asc.filter((w) => w.measured_on >= cut)
    return f.length >= 2 ? f : asc.slice(-6)
  }, [sorted, range])

  const g = latest ? Number(latest.grams) : null
  const norm = g === null ? '' : g < NORM[0] ? 'ниже нормы' : g > NORM[1] ? 'выше нормы' : g > NORM[1] - 60 ? 'у верхней границы' : 'в норме'
  const normCls = g === null ? '' : g < NORM[0] || g > NORM[1] ? 'bad' : g > NORM[1] - 60 ? 'warn' : 'ok'

  async function removeWeight(w) {
    if (await confirm({ title: 'Удалить взвешивание?', message: `${fmtDateFull(w.measured_on)} — ${Number(w.grams)} г` })) delWeight(w.id)
  }

  async function submit(e) {
    e.preventDefault()
    if (!grams) return
    setBusy(true)
    try {
      await addWeight({ measured_on: date, grams, note: note.trim() || null })
      cheerWeight(Number(grams))
      setGrams('')
      setNote('')
      setDate(todayISO())
    } catch {
      /* handled in data layer */
    }
    setBusy(false)
  }

  return (
    <div className="tab">
      <div className="page-head">
        <h2>Вес</h2>
        <span>норма {NORM[0]}–{NORM[1]} г</span>
      </div>

      {needsWeigh && (
        <div className="task tone-ink">
          <span className="task-ico"><Icon name="scale" /></span>
          <span className="task-txt">
            <b>Пора на весы</b>
            <small>{lastWeight ? `не взвешивали ${dSinceWeigh} ${daysWord(dSinceWeigh)}` : 'ещё не было взвешиваний'}</small>
          </span>
        </div>
      )}

      <section className="card weight-card">
        <div className="weight-head">
          <div>
            <div className="kicker">Текущий вес</div>
            <div className="big-num">
              {g ?? '—'}
              <small> г</small>
            </div>
          </div>
          {norm && <span className={`badge ${normCls}`}>{norm}</span>}
        </div>
        <div className="stat-row">
          <div>
            <b className={delta > 0 ? 'up' : delta < 0 ? 'down' : ''}>{delta === null ? '—' : `${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10} г`}</b>
            <span>к прошлому</span>
          </div>
          <div>
            <b className={month && month.pct <= -5 ? 'down' : ''}>{month ? `${month.ch > 0 ? '+' : ''}${Math.round(month.ch)} г` : '—'}</b>
            <span>за месяц{month ? ` · ${month.pct > 0 ? '+' : ''}${month.pct.toFixed(1).replace('.', ',')}%` : ''}</span>
          </div>
          <div>
            <b>{ageString(pet.birthdate, todayISO())}</b>
            <span>возраст</span>
          </div>
        </div>
        <div className="chart-wrap">
          <WeightChart data={chartData} />
        </div>
        <div className="chart-foot">
          <span className="legend"><i /> норма самца {NORM[0]}–{NORM[1]} г</span>
          <div className="seg-switch">
            {RANGES.map((r) => (
              <button key={r.id} className={range === r.id ? 'on' : ''} onClick={() => setRange(r.id)}>{r.label}</button>
            ))}
          </div>
        </div>
      </section>

      {latest && <CoachCard scope="weight" signature={status.sigs.weight} extra={{ measured_on: latest.measured_on }} label="ИИ про вес" />}

      <form className="card form" onSubmit={submit}>
        <h3 className="card-title">Записать вес</h3>
        <div className="form-2">
          <label className="field">
            <span>Вес, граммы</span>
            <input type="number" inputMode="decimal" step="1" min="1" value={grams} onChange={(e) => setGrams(e.target.value)} placeholder={g ? String(g) : '950'} />
          </label>
          <label className="field">
            <span>Дата</span>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Заметка (необязательно)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="после ужина…" />
        </label>
        <button className="btn btn-primary btn-block has-badge" disabled={busy || !grams} type="submit">
          <span className="btn-badge"><Icon name="scale" /></span>
          <span className="btn-txt">{busy ? 'Сохраняем…' : 'Сохранить вес'}</span>
        </button>
      </form>

      <h3 className="sec-title">История взвешиваний</h3>
      {sorted.length === 0 && <div className="empty">Пока нет взвешиваний.</div>}
      <ul className="log">
        {sorted.slice(0, shown).map((w, i) => {
          const p = sorted[i + 1]
          const d = p ? Number(w.grams) - Number(p.grams) : null
          return (
            <li key={w.id} className="log-row">
              <span className="log-main">
                <span className="log-when">{fmtDateFull(w.measured_on)}</span>
                {w.note && <span className="log-by">{w.note}</span>}
              </span>
              <span className="log-val">
                <b>{Number(w.grams)} г</b>
                {d !== null && <em className={d > 0 ? 'up' : d < 0 ? 'down' : ''}>{d > 0 ? '+' : ''}{Math.round(d * 10) / 10}</em>}
              </span>
              <button className="icon-del" onClick={() => removeWeight(w)} aria-label="Удалить">
                <Icon name="x" size={16} />
              </button>
            </li>
          )
        })}
      </ul>
      {sorted.length > shown && (
        <button className="btn btn-ghost btn-block" onClick={() => setShown((n) => n + 20)}>
          Показать ещё ({sorted.length - shown})
        </button>
      )}
    </div>
  )
}
