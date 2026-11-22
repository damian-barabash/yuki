import { useState } from 'react'
import { useData } from '../data.jsx'
import { useConfirm } from '../components/Confirm.jsx'
import Icon from '../components/Icon.jsx'
import CoachCard from '../components/CoachCard.jsx'
import { DotStrip, avgGapDays } from '../components/Viz.jsx'
import { cheerClean, cheerWater } from '../lib/cheers.js'
import { fmtDateTime, daysWord } from '../lib/dates.js'

// Cleaning and water share one screen: status, one big button, rhythm, history.
const KIND = {
  clean: {
    icon: 'broom',
    title: 'Уборка клетки',
    okTitle: 'Чисто и уютно',
    badTitle: 'Пора убирать',
    cta: 'Убрали сейчас',
    history: 'История уборок',
    empty: 'Пока нет записей об уборке.',
    confirm: 'Удалить запись об уборке?',
    goal: 'цель — раз в 2 дня',
    label: 'ИИ про уборку',
  },
  water: {
    icon: 'drop',
    title: 'Свежая вода',
    okTitle: 'Водичка свежая',
    badTitle: 'Воду пора менять',
    cta: 'Сменили воду сейчас',
    history: 'История смены воды',
    empty: 'Пока нет записей о смене воды.',
    confirm: 'Удалить запись о смене воды?',
    goal: 'цель — каждый день',
    label: 'ИИ про воду',
  },
}

export default function CareTab({ kind }) {
  const k = KIND[kind]
  const d = useData()
  const confirm = useConfirm()
  const [when, setWhen] = useState('')
  const [pastOpen, setPastOpen] = useState(false)
  const [shown, setShown] = useState(8)

  const isClean = kind === 'clean'
  const rows = isClean ? d.cleanings : d.waterings
  const tsOf = (r) => (isClean ? r.cleaned_at : r.changed_at)
  const add = isClean ? d.addCleaning : d.addWatering
  const remove = isClean ? d.delCleaning : d.delWatering
  const bad = isClean ? d.status.dirty : d.status.hot
  const days = isClean ? d.status.dSinceClean : d.status.dSinceWater
  const gap = avgGapDays(rows.map(tsOf))

  function now() {
    add()
    ;(isClean ? cheerClean : cheerWater)()
  }
  function addPast(e) {
    e.preventDefault()
    if (!when) return
    add(new Date(when).toISOString())
    setWhen('')
    setPastOpen(false)
  }
  async function del(r) {
    if (await confirm({ title: k.confirm, message: fmtDateTime(tsOf(r)) })) remove(r.id)
  }

  return (
    <div className="tab">
      <section className={`status-card ${bad ? 'is-bad' : 'is-ok'}`}>
        <div className="status-top">
          <span className="status-ico"><Icon name={k.icon} size={26} /></span>
          <div>
            <div className="status-kicker">{k.title}</div>
            <div className="status-title">{bad ? k.badTitle : k.okTitle}</div>
          </div>
        </div>
        <div className="status-nums">
          <div>
            <b>{isFinite(days) ? (days === 0 ? 'сегодня' : days) : '—'}</b>
            <span>{isFinite(days) ? (days === 0 ? 'последний раз' : `${daysWord(days)} назад`) : 'нет записей'}</span>
          </div>
          <div>
            <b>{gap === null ? '—' : gap.toFixed(1).replace('.', ',')}</b>
            <span>дня в среднем · {k.goal}</span>
          </div>
        </div>
        <DotStrip timestamps={rows.map(tsOf)} days={21} />
      </section>

      <button className="btn btn-primary btn-xl" onClick={now}>
        <Icon name="check" stroke={2.6} /> {k.cta}
      </button>

      {pastOpen ? (
        <form className="past-row" onSubmit={addPast}>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Дата и время" />
          <button className="btn btn-ink" type="submit" disabled={!when}>Записать</button>
        </form>
      ) : (
        <button className="btn btn-ghost btn-block" onClick={() => setPastOpen(true)}>
          <Icon name="clock" size={18} /> Записать за другое время
        </button>
      )}

      <CoachCard scope={kind} signature={d.status.sigs[kind]} label={k.label} />

      <h3 className="sec-title">{k.history}</h3>
      {rows.length === 0 && <div className="empty">{k.empty}</div>}
      <ul className="log">
        {rows.slice(0, shown).map((r) => (
          <li key={r.id} className="log-row">
            <span className="log-ico"><Icon name={k.icon} size={18} /></span>
            <span className="log-main">
              <span className="log-when">{fmtDateTime(tsOf(r))}</span>
              {r.created_by && <span className="log-by">{r.created_by}</span>}
            </span>
            <button className="icon-del" onClick={() => del(r)} aria-label="Удалить">
              <Icon name="x" size={16} />
            </button>
          </li>
        ))}
      </ul>
      {rows.length > shown && (
        <button className="btn btn-ghost btn-block" onClick={() => setShown((n) => n + 20)}>
          Показать ещё ({rows.length - shown})
        </button>
      )}
    </div>
  )
}
