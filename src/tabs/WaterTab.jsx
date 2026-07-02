import { useEffect, useState } from 'react'
import { useData } from '../data.jsx'
import { yukiSay } from '../lib/bus.js'
import { callFn } from '../lib/supabase.js'
import { useConfirm } from '../components/Confirm.jsx'
import { fmtDateTime, daysWord } from '../lib/dates.js'

export default function WaterTab() {
  const { waterings, addWatering, delWatering, status } = useData()
  const { hot, dSinceWater } = status
  const confirm = useConfirm()
  const [when, setWhen] = useState('')
  const [tip, setTip] = useState('')
  const [tipHidden, setTipHidden] = useState(false)

  // gentle AI water tip (loads once, dismissible)
  useEffect(() => {
    let alive = true
    callFn('ai-water-tip', {})
      .then((r) => {
        if (alive && r.ok && r.data?.tip) setTip(r.data.tip)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  function waterNow() {
    addWatering()
    yukiSay('Буль-буль! Свежая водичка, спасибо! 💧', 4200)
  }

  function addPast(e) {
    e.preventDefault()
    if (!when) return
    // datetime-local → ISO
    addWatering(new Date(when).toISOString())
    setWhen('')
  }

  async function removeWater(w) {
    if (await confirm({ emoji: '💧', title: 'Удалить запись о смене воды?', message: fmtDateTime(w.changed_at) })) delWatering(w.id)
  }

  return (
    <div className="tab">
      <div className={`banner ${hot ? 'banner-bad' : 'banner-good'}`}>
        {hot ? (
          <>
            <b>Юки жарко!</b> Воду не меняли{' '}
            {isFinite(dSinceWater) ? `${dSinceWater} ${daysWord(dSinceWater)}` : 'давно'}. Пора налить свежей.
          </>
        ) : (
          <>
            <b>Водичка свежая.</b>{' '}
            {dSinceWater === 0 ? 'Меняли сегодня.' : `Последняя смена ${dSinceWater} ${daysWord(dSinceWater)} назад.`}
          </>
        )}
      </div>

      {tip && !tipHidden && (
        <div className="food-tip">
          <span className="food-tip-ico">🤖</span>
          <span className="food-tip-text">{tip}</span>
          <button className="food-tip-x" onClick={() => setTipHidden(true)} title="Скрыть">
            ✕
          </button>
        </div>
      )}

      <button className="btn btn-primary btn-block btn-xl" onClick={waterNow}>
        💧 Сменили воду сейчас
      </button>

      <form className="past-row" onSubmit={addPast}>
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        <button className="btn btn-ghost" type="submit" disabled={!when}>
          + за другую дату
        </button>
      </form>

      <h3 className="list-title">История смены воды</h3>
      {waterings.length === 0 && <div className="empty">Пока нет записей о смене воды.</div>}
      <ul className="log">
        {waterings.map((w) => (
          <li key={w.id} className="log-row">
            <span className="log-ico">💧</span>
            <span className="log-main">
              <span className="log-when">{fmtDateTime(w.changed_at)}</span>
              {w.created_by && <span className="log-by">· {w.created_by}</span>}
            </span>
            <button className="icon-del" onClick={() => removeWater(w)} title="Удалить">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
