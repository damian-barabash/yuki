import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import YukiModel from './YukiModel.jsx'
import { useData } from '../data.jsx'
import { bus } from '../lib/bus.js'
import { WASH, WEIGH, IDLE, pick } from '../lib/phrases.js'
import { daysWord } from '../lib/dates.js'

// fixed dirt blotches over the model when the cage is dirty
const SPOTS = [
  { top: '34%', left: '38%', s: 22 },
  { top: '52%', left: '58%', s: 30 },
  { top: '60%', left: '40%', s: 18 },
  { top: '44%', left: '64%', s: 16 },
  { top: '66%', left: '52%', s: 24 },
  { top: '48%', left: '46%', s: 14 },
]

let flyKey = 0

export default function PetStage({ tab }) {
  const { status } = useData()
  const { dirty, needsWeigh, dSinceClean, lastWeight, vitToday, vitTarget } = status

  const [bubble, setBubble] = useState('')
  const [flies, setFlies] = useState([])
  const transientUntil = useRef(0)
  const statusRef = useRef(status)
  statusRef.current = status
  const lastRef = useRef('')

  // choose the current "background" nag depending on state
  function persistentLine() {
    const s = statusRef.current
    if (s.dirty) return pick(WASH, lastRef.current)
    if (s.needsWeigh) return pick(WEIGH, lastRef.current)
    return pick(IDLE, lastRef.current)
  }

  // rotate the nag every few seconds unless a transient message is showing
  useEffect(() => {
    setBubble(persistentLine())
    const id = setInterval(() => {
      if (Date.now() < transientUntil.current) return
      const line = persistentLine()
      lastRef.current = line
      setBubble(line)
    }, 5200)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // react instantly when dirty/weigh state flips
  useEffect(() => {
    if (Date.now() < transientUntil.current) return
    setBubble(persistentLine())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, needsWeigh])

  // event bus: manual speak + feeding
  useEffect(() => {
    const off1 = bus.on('say', ({ text, ms }) => {
      transientUntil.current = Date.now() + (ms || 3600)
      setBubble(text)
    })
    const off2 = bus.on('feed', ({ emoji }) => {
      const k = ++flyKey
      setFlies((f) => [...f, { k, emoji }])
      setTimeout(() => setFlies((f) => f.filter((x) => x.k !== k)), 1100)
    })
    return () => {
      off1()
      off2()
    }
  }, [])

  return (
    <section className={`stage ${dirty ? 'stage-dirty' : ''}`}>
      <div className="stage-canvas">
        <div className="bubble-slot">
          {bubble && (
            <div className={`bubble ${dirty ? 'bubble-alarm' : ''}`} key={bubble}>
              {bubble}
            </div>
          )}
        </div>

        <div className="canvas-holder">
          <Canvas camera={{ position: [0, 0.15, 4.4], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
            <Suspense fallback={null}>
              <YukiModel dirty={dirty} />
            </Suspense>
          </Canvas>

          {dirty &&
            SPOTS.map((sp, i) => (
              <span
                key={i}
                className="dirt-spot"
                style={{ top: sp.top, left: sp.left, width: sp.s, height: sp.s }}
              />
            ))}

          {flies.map((f) => (
            <span key={f.k} className="food-fly">
              {f.emoji}
            </span>
          ))}
        </div>
      </div>

      {/* mini stats around Yuki */}
      <div className="hud">
        <div className={`hud-chip ${dirty ? 'chip-alarm' : ''}`}>
          <span className="hud-ico">🧹</span>
          <span className="hud-val">
            {isFinite(dSinceClean)
              ? dSinceClean === 0
                ? 'убрано сегодня'
                : `${dSinceClean} ${daysWord(dSinceClean)} назад`
              : 'ещё не убирали'}
          </span>
        </div>
        <div className={`hud-chip ${needsWeigh ? 'chip-alarm' : ''}`}>
          <span className="hud-ico">⚖️</span>
          <span className="hud-val">{lastWeight ? `${lastWeight.grams} г` : 'нет веса'}</span>
        </div>
        <div className="hud-chip">
          <span className="hud-ico">💊</span>
          <span className="hud-val">
            вит. C {vitToday}/{vitTarget}
          </span>
        </div>
      </div>

    </section>
  )
}
