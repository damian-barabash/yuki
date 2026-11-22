import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import YukiModel from './YukiModel.jsx'
import FoodIcon from './FoodIcon.jsx'
import Icon from './Icon.jsx'
import Dossier from './Dossier.jsx'
import Paws from './Paws.jsx'
import { useData } from '../data.jsx'
import { bus, yukiCheer, yukiHop } from '../lib/bus.js'
import { WASH, HOT, WEIGH, IDLE, HUNGRY, NIGHT, TAP, PET, pick } from '../lib/phrases.js'
import { wheek, buzz, isBirthday } from '../lib/eggs.js'

// fixed dirt blotches over the model when the cage is dirty
const SPOTS = [
  { top: '34%', left: '38%', s: 22 },
  { top: '52%', left: '58%', s: 30 },
  { top: '60%', left: '40%', s: 18 },
  { top: '44%', left: '64%', s: 16 },
  { top: '66%', left: '52%', s: 24 },
  { top: '48%', left: '46%', s: 14 },
]
// sweat drops sliding off Yuki when the water is stale
const SWEAT = [
  { top: '30%', left: '42%', d: 0 },
  { top: '36%', left: '58%', d: 0.7 },
  { top: '28%', left: '52%', d: 1.3 },
  { top: '42%', left: '36%', d: 1.9 },
  { top: '38%', left: '66%', d: 2.5 },
]

function greeting(h) {
  if (h < 6) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

let flyKey = 0

export default function PetStage({ tab, setTab }) {
  const { status, pet } = useData()
  const { dirty, hot, hungry, needsWeigh, night } = status

  const [bubble, setBubble] = useState('')
  const [flies, setFlies] = useState([])
  const [hearts, setHearts] = useState([])
  const [dossier, setDossier] = useState(false)
  const transientUntil = useRef(0)
  const statusRef = useRef(status)
  statusRef.current = status
  const lastRef = useRef('')

  // the "background" line depends on what Yuki needs most right now
  function persistentLine() {
    const s = statusRef.current
    const pools = []
    if (s.dirty) pools.push(WASH)
    if (s.hot) pools.push(HOT)
    if (s.hungry) pools.push(HUNGRY)
    if (pools.length) return pick(pools[Math.floor(Math.random() * pools.length)], lastRef.current)
    if (s.night) return pick(NIGHT, lastRef.current)
    if (s.needsWeigh) return pick(WEIGH, lastRef.current)
    return pick(IDLE, lastRef.current)
  }

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

  useEffect(() => {
    if (Date.now() < transientUntil.current) return
    setBubble(persistentLine())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, hot, hungry, needsWeigh, night])

  function say(text, ms = 3600) {
    transientUntil.current = Date.now() + ms
    setBubble(text)
  }

  useEffect(() => {
    const off1 = bus.on('say', ({ text, ms }) => say(text, ms || 3600))
    const off2 = bus.on('feed', ({ food }) => {
      const k = ++flyKey
      setFlies((f) => [...f, { k, food }])
      setTimeout(() => setFlies((f) => f.filter((x) => x.k !== k)), 1100)
      yukiHop('hop')
    })
    return () => {
      off1()
      off2()
    }
  }, [])

  // birthday: once a day, on the day
  useEffect(() => {
    if (!isBirthday(pet.birthdate)) return
    const key = 'yuki_bday_' + new Date().toISOString().slice(0, 10)
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch {
      /* show it anyway */
    }
    const id = setTimeout(() => {
      yukiCheer({ mood: 'love', prop: 'party', title: `С днём рождения, ${pet.name || 'Юки'}!`, text: 'Сегодня можно лишний кусочек перчика.', confetti: true, ms: 5200 })
      yukiHop('popcorn')
    }, 900)
    return () => clearTimeout(id)
  }, [pet.birthdate, pet.name])

  // ---- touch toys: tap = hop, 5 quick taps = popcorning, long press = petting ----
  const taps = useRef([])
  const press = useRef(null)
  const longDone = useRef(false)

  function down() {
    longDone.current = false
    clearTimeout(press.current)
    press.current = setTimeout(() => {
      longDone.current = true
      buzz([10, 40, 10])
      say(pick(PET, lastRef.current), 3200)
      const base = Date.now()
      const hs = Array.from({ length: 7 }).map((_, i) => ({ k: base + i, x: 22 + ((i * 53) % 56), d: i * 0.12 }))
      setHearts(hs)
      setTimeout(() => setHearts([]), 2200)
    }, 520)
  }
  function up() {
    clearTimeout(press.current)
    if (longDone.current) return
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < 2400), now]
    if (taps.current.length >= 5) {
      taps.current = []
      yukiHop('popcorn')
      wheek(4)
      buzz([15, 30, 15, 30, 40])
      yukiCheer({ mood: 'wow', prop: 'sparkle', title: 'Попкорнинг!', text: 'Так свинки прыгают, когда очень счастливы.', confetti: true, ms: 3000 })
      say('ВИК-ВИК-ВИК!', 3000)
    } else {
      yukiHop('hop')
      buzz(8)
      say(pick(TAP, lastRef.current), 1800)
    }
  }
  function cancel() {
    clearTimeout(press.current)
  }

  // tapping the name seven times opens the secret dossier
  const nameTaps = useRef([])
  function nameTap() {
    const now = Date.now()
    nameTaps.current = [...nameTaps.current.filter((t) => now - t < 2600), now]
    if (nameTaps.current.length >= 7) {
      nameTaps.current = []
      buzz([20, 40, 20])
      setDossier(true)
    }
  }

  const alarm = dirty || hot || hungry
  const hour = new Date().getHours()

  return (
    <section className="hero">
      <Paws />

      <header className="hero-top">
        <div className="hero-id" onClick={nameTap}>
          <span className="hero-hello">{greeting(hour)}</span>
          <h1 className="hero-name">{pet.name || 'Юки'}</h1>
        </div>
        <button className={`round-btn ${tab === 'settings' ? 'on' : ''}`} onClick={() => setTab(tab === 'settings' ? 'home' : 'settings')} aria-label={tab === 'settings' ? 'Закрыть настройки' : 'Настройки'}>
          <Icon name={tab === 'settings' ? 'x' : 'gear'} />
        </button>
      </header>

      <div className="stage">
        <div className="bubble-slot">
          {bubble && (
            <div className={`bubble ${alarm ? 'bubble-alarm' : ''}`} key={bubble}>
              <span>{bubble}</span>
            </div>
          )}
        </div>

        <div
          className={`canvas-holder ${dirty ? 'is-dirty' : ''} ${hot ? 'is-hot' : ''}`}
          onPointerDown={down}
          onPointerUp={up}
          onPointerLeave={cancel}
          onPointerCancel={cancel}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Canvas camera={{ position: [0, 0.1, 3.7], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
            <Suspense fallback={null}>
              <YukiModel dirty={dirty} />
            </Suspense>
          </Canvas>

          {dirty && SPOTS.map((sp, i) => <span key={i} className="dirt-spot" style={{ top: sp.top, left: sp.left, width: sp.s, height: sp.s }} />)}

          {hot && (
            <>
              {SWEAT.map((sw, i) => (
                <span key={i} className="sweat-drop" style={{ top: sw.top, left: sw.left, animationDelay: `${sw.d}s` }} />
              ))}
              <span className="heat-wave" style={{ left: '30%' }} />
              <span className="heat-wave" style={{ left: '50%', animationDelay: '0.9s' }} />
              <span className="heat-wave" style={{ left: '70%', animationDelay: '1.7s' }} />
            </>
          )}

          {night && !alarm && (
            <span className="zzz" aria-hidden>
              <b>z</b>
              <b>z</b>
              <b>z</b>
            </span>
          )}

          {hearts.map((h) => (
            <span key={h.k} className="heart-fly" style={{ left: `${h.x}%`, animationDelay: `${h.d}s` }}>
              <Icon name="heart" size={20} />
            </span>
          ))}

          {flies.map((f) => (
            <span key={f.k} className="food-fly">
              <FoodIcon food={f.food} size={38} />
            </span>
          ))}
        </div>
      </div>

      {dossier && <Dossier onClose={() => setDossier(false)} />}
    </section>
  )
}
