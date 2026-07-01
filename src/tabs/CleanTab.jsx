import { useState } from 'react'
import { useData } from '../data.jsx'
import { yukiSay } from '../lib/bus.js'
import { fmtDateTime, daysWord } from '../lib/dates.js'

export default function CleanTab() {
  const { cleanings, addCleaning, delCleaning, status } = useData()
  const { dirty, dSinceClean } = status
  const [when, setWhen] = useState('')

  function cleanNow() {
    addCleaning()
    yukiSay('Ура, чистенько! Спасибо, ты лучший 🥰', 4200)
  }

  function addPast(e) {
    e.preventDefault()
    if (!when) return
    // datetime-local → ISO
    addCleaning(new Date(when).toISOString())
    setWhen('')
  }

  return (
    <div className="tab">
      <div className={`banner ${dirty ? 'banner-bad' : 'banner-good'}`}>
        {dirty ? (
          <>
            <b>Пора убирать!</b> Клетку не чистили{' '}
            {isFinite(dSinceClean) ? `${dSinceClean} ${daysWord(dSinceClean)}` : 'давно'}. Юки просит уборку.
          </>
        ) : (
          <>
            <b>Чисто и уютно.</b>{' '}
            {dSinceClean === 0 ? 'Убрано сегодня.' : `Последняя уборка ${dSinceClean} ${daysWord(dSinceClean)} назад.`}
          </>
        )}
      </div>

      <button className="btn btn-primary btn-block btn-xl" onClick={cleanNow}>
        🧹 Убрали сейчас
      </button>

      <form className="past-row" onSubmit={addPast}>
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        <button className="btn btn-ghost" type="submit" disabled={!when}>
          + за другую дату
        </button>
      </form>

      <h3 className="list-title">История уборок</h3>
      {cleanings.length === 0 && <div className="empty">Пока нет записей об уборке.</div>}
      <ul className="log">
        {cleanings.map((c) => (
          <li key={c.id} className="log-row">
            <span className="log-ico">🧹</span>
            <span className="log-main">
              <span className="log-when">{fmtDateTime(c.cleaned_at)}</span>
              {c.created_by && <span className="log-by">· {c.created_by}</span>}
            </span>
            <button className="icon-del" onClick={() => delCleaning(c.id)} title="Удалить">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
