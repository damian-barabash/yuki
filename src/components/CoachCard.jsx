import { useState } from 'react'
import Icon from './Icon.jsx'
import { useCoach } from '../lib/coach.js'

const AREA = { food: 'Еда', weight: 'Вес', clean: 'Уборка', water: 'Вода' }

// The AI analyst card: headline + a short human explanation written by the model,
// a "what to do" checklist and — on demand — every observation the analysis made,
// so it's clear the advice comes from the actual diary.
export default function CoachCard({ scope, signature, extra, label = 'Разбор от ИИ' }) {
  const { data, loading, error, refresh } = useCoach(scope, signature, extra)
  const [open, setOpen] = useState(false)

  if (!data) {
    return (
      <section className="coach coach-loading">
        <div className="coach-head">
          <span className="coach-badge"><Icon name="spark" size={16} /> {label}</span>
        </div>
        {error ? (
          <p className="coach-text">
            Не получилось связаться с ИИ.{' '}
            <button className="link" onClick={refresh}>Попробовать ещё раз</button>
          </p>
        ) : (
          <div className="skeleton" aria-label="Юки анализирует дневник">
            <i /><i /><i />
          </div>
        )}
      </section>
    )
  }

  const problems = (data.findings || []).filter((f) => f.sev > 0)
  const good = (data.findings || []).filter((f) => f.sev === 0)

  return (
    <section className={`coach ${loading ? 'is-refreshing' : ''}`}>
      <div className="coach-head">
        <span className="coach-badge"><Icon name="spark" size={16} /> {label}</span>
        <button className="coach-refresh" onClick={refresh} disabled={loading}>
          <Icon name="refresh" size={16} /> {loading ? 'Думаю…' : 'Обновить'}
        </button>
      </div>
      <h3 className="coach-title">{data.title}</h3>
      <p className="coach-text">{data.text}</p>

      {data.actions?.length > 0 && <div className="coach-sub">Что сделать</div>}
      {data.actions?.length > 0 && (
        <ul className="coach-actions">
          {data.actions.map((a, i) => (
            <li key={i}>
              <span className="coach-tick"><Icon name="check" size={14} stroke={3} /></span>
              {a}
            </li>
          ))}
        </ul>
      )}

      {(data.findings || []).length > 0 && (
        <>
          <button className="coach-more" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <Icon name="eye" size={16} />
            <span>{open ? 'Скрыть наблюдения' : `Все наблюдения · ${problems.length ? `${problems.length} на заметку` : 'всё хорошо'}`}</span>
            <i className={`go ${open ? 'up' : ''}`}><Icon name="down" size={16} /></i>
          </button>
          {open && (
            <ul className="findings">
              {[...problems, ...good].map((f) => (
                <li key={f.id} className={`finding sev${f.sev}`}>
                  <span className="finding-dot" />
                  <span>
                    {scope === 'home' && <b className="finding-area">{AREA[f.area]} · </b>}
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
