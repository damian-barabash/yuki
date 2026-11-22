import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import YukiArt from './YukiArt.jsx'
import FoodIcon from './FoodIcon.jsx'
import { bus } from '../lib/bus.js'

const CONFETTI = ['#F7B581', '#2549D8', '#F0564F', '#F6C445', '#1E9E6A', '#FFFAF0']

// Celebration popup: a drawn Yuki pops up from the bottom, says thanks, leaves.
// Fired through the bus (yukiCheer) so any tab can trigger it; a new cheer
// replaces the current one, so fast repeated feeding never stacks popups.
export default function Cheer() {
  const [c, setC] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const timers = useRef([])
  const n = useRef(0)

  function clear() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  function close() {
    clear()
    setLeaving(true)
    timers.current.push(setTimeout(() => setC(null), 260))
  }

  useEffect(() => {
    const off = bus.on('cheer', (p) => {
      clear()
      setLeaving(false)
      setC({ ...p, k: ++n.current })
      timers.current.push(setTimeout(close, p.ms || 2600))
    })
    return () => {
      off()
      clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!c) return null
  return createPortal(
    <div className={`cheer-wrap ${leaving ? 'out' : ''}`} onClick={close} role="status" aria-live="polite">
      {c.confetti && (
        <div className="confetti" key={'c' + c.k} aria-hidden>
          {Array.from({ length: 26 }).map((_, i) => (
            <i
              key={i}
              style={{
                left: `${4 + ((i * 37) % 92)}%`,
                background: CONFETTI[i % CONFETTI.length],
                animationDelay: `${(i % 9) * 0.05}s`,
                animationDuration: `${1.5 + (i % 5) * 0.22}s`,
                transform: `rotate(${i * 47}deg)`,
              }}
            />
          ))}
        </div>
      )}
      <div className="cheer" key={c.k}>
        <div className="cheer-art">
          <YukiArt mood={c.mood || 'happy'} prop={c.prop || ''} size={112} />
          {c.food && (
            <span className="cheer-food">
              <FoodIcon food={c.food} size={34} />
            </span>
          )}
        </div>
        <div className="cheer-txt">
          {c.title && <div className="cheer-title">{c.title}</div>}
          {c.text && <div className="cheer-text">{c.text}</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
