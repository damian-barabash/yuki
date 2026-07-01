import { useMemo, useState } from 'react'
import { useData } from '../data.jsx'
import WeightChart from '../components/WeightChart.jsx'
import { todayISO, fmtDateFull, ageString, daysWord } from '../lib/dates.js'

export default function WeightTab() {
  const { weights, addWeight, delWeight, status, pet } = useData()
  const { needsWeigh, dSinceWeigh, lastWeight } = status
  const [date, setDate] = useState(todayISO())
  const [grams, setGrams] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const sorted = useMemo(() => [...weights].sort((a, b) => (a.measured_on < b.measured_on ? 1 : -1)), [weights])
  const latest = sorted[0] || null
  const prev = sorted[1] || null
  const delta = latest && prev ? Number(latest.grams) - Number(prev.grams) : null

  async function submit(e) {
    e.preventDefault()
    if (!grams) return
    setBusy(true)
    try {
      await addWeight({ measured_on: date, grams, note: note.trim() || null })
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
      {needsWeigh && (
        <div className="banner banner-bad">
          <b>Пора на весы!</b> {lastWeight ? `Не взвешивали ${dSinceWeigh} ${daysWord(dSinceWeigh)}.` : 'Ещё не было взвешиваний.'}
        </div>
      )}

      <div className="wcards">
        <div className="wcard">
          <div className="wcard-val">{latest ? `${latest.grams} г` : '—'}</div>
          <div className="wcard-lbl">текущий вес</div>
        </div>
        <div className="wcard">
          <div className={`wcard-val ${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}`}>
            {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta} г`}
          </div>
          <div className="wcard-lbl">к прошлому</div>
        </div>
        <div className="wcard">
          <div className="wcard-val">{ageString(pet.birthdate, todayISO())}</div>
          <div className="wcard-lbl">возраст</div>
        </div>
      </div>

      <div className="card chart-card">
        <WeightChart data={sorted.slice().reverse()} />
      </div>

      {latest?.ai_rec || latest?.ai_status === 'pending' ? (
        <div className="ai-rec">
          <div className="ai-rec-head">
            <span className="ai-rec-ico">🤖</span> Совет ИИ
          </div>
          <div className="ai-rec-body">
            {latest.ai_status === 'pending' ? <span className="ai-typing">Думаю над рекомендацией…</span> : latest.ai_rec}
          </div>
        </div>
      ) : null}

      <form className="card form-grid" onSubmit={submit}>
        <h3 className="list-title">Записать вес</h3>
        <label className="field">
          <span>Дата</span>
          <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Вес, граммы</span>
          <input
            type="number"
            inputMode="decimal"
            step="1"
            min="1"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            placeholder="напр. 950"
          />
        </label>
        <label className="field">
          <span>Заметка (необязательно)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="после ужина…" />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy || !grams} type="submit">
          {busy ? 'Сохраняем…' : '⚖️ Сохранить вес'}
        </button>
      </form>

      <h3 className="list-title">История взвешиваний</h3>
      {sorted.length === 0 && <div className="empty">Пока нет взвешиваний.</div>}
      <ul className="log">
        {sorted.map((w) => (
          <li key={w.id} className="log-row">
            <span className="log-ico">⚖️</span>
            <span className="log-main">
              <span className="log-when">
                {fmtDateFull(w.measured_on)} — <b>{w.grams} г</b>
              </span>
              {w.note && <span className="log-by">{w.note}</span>}
            </span>
            <button className="icon-del" onClick={() => delWeight(w.id)} title="Удалить">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
