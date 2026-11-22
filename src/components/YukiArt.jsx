// Hand-drawn Yuki: tricolour (black / white blaze / ginger), ink outline.
// One parametric drawing → every mood and prop used in popups and easter eggs.
//   mood: idle | happy | love | sad | hot | hungry | sleep | wow
//   prop: dill | party | crown | tunnel | sparkle | drops | scale
import { useId } from 'react'

const INK = '#141B3D'
const BLACK = '#2A2623'
const WHITE = '#FFFAF0'
const GINGER = '#E28B3D'
const PINK = '#F4A6A0'

const BODY = 'M100 30c46 0 80 30 80 76 0 40-30 58-80 58s-80-18-80-58c0-46 34-76 80-76Z'

function Eyes({ mood }) {
  const L = 63, R = 137, Y = 92
  if (mood === 'happy')
    return (
      <g fill="none" stroke={WHITE} strokeWidth="5" strokeLinecap="round">
        <path d={`M${L - 9} ${Y + 3}q9-11 18 0`} />
        <path d={`M${R - 9} ${Y + 3}q9-11 18 0`} />
      </g>
    )
  if (mood === 'sleep')
    return (
      <g fill="none" stroke={WHITE} strokeWidth="5" strokeLinecap="round">
        <path d={`M${L - 9} ${Y}q9 8 18 0`} />
        <path d={`M${R - 9} ${Y}q9 8 18 0`} />
      </g>
    )
  if (mood === 'love')
    return (
      <g fill="#F0564F" stroke={WHITE} strokeWidth="2.5" strokeLinejoin="round">
        {[L, R].map((x) => (
          <path key={x} d={`M${x} ${Y + 10}c-12-7-13-18-6-20 3-1 5 1 6 3 1-2 3-4 6-3 7 2 6 13-6 20Z`} />
        ))}
      </g>
    )
  const big = mood === 'hungry' || mood === 'wow'
  const r = big ? 11 : 8.5
  return (
    <g>
      {[L, R].map((x) => (
        <g key={x}>
          <circle cx={x} cy={Y} r={r + 2.5} fill={WHITE} />
          <circle cx={x} cy={Y} r={r} fill={INK} />
          <circle cx={x - r * 0.3} cy={Y - r * 0.35} r={r * 0.36} fill="#fff" />
          {big && <circle cx={x + r * 0.35} cy={Y + r * 0.35} r={r * 0.18} fill="#fff" />}
        </g>
      ))}
      {mood === 'sad' && (
        <g fill="none" stroke={WHITE} strokeWidth="4.5" strokeLinecap="round">
          <path d={`M${L - 13} ${Y - 17}l17-6`} />
          <path d={`M${R + 13} ${Y - 17}l-17-6`} />
        </g>
      )}
      {mood === 'sad' && <path d={`M${L - 3} ${Y + 13}c-5 8-5 13 0 13s5-5 0-13Z`} fill="#7CC4F2" stroke={INK} strokeWidth="2" />}
    </g>
  )
}

function Mouth({ mood }) {
  const s = { fill: 'none', stroke: INK, strokeWidth: 3.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (mood === 'happy' || mood === 'love' || mood === 'wow')
    return (
      <g>
        <path d="M100 120v5" {...s} />
        <path d="M88 126c2 13 22 13 24 0Z" fill="#E4575A" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />
        <path d="M94 133c3 3 9 3 12 0" fill="none" stroke="#FFB0A8" strokeWidth="3.4" strokeLinecap="round" />
      </g>
    )
  if (mood === 'sad') return <path d="M100 120v6M89 134c5-8 17-8 22 0" {...s} />
  if (mood === 'hot')
    return (
      <g>
        <path d="M100 120v5M90 126c4 4 16 4 20 0" {...s} />
        <path d="M95 128h10v8a5 5 0 0 1-10 0Z" fill="#F0787A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </g>
    )
  if (mood === 'hungry')
    return (
      <g>
        <path d="M100 120v5" {...s} />
        <ellipse cx="100" cy="131" rx="6" ry="5" fill="#E4575A" stroke={INK} strokeWidth="3.2" />
        <path d="M110 134c-3 6-3 9 0 9s3-3 0-9Z" fill="#7CC4F2" stroke={INK} strokeWidth="2" />
      </g>
    )
  return <path d="M100 120v6M100 126q-7 8-13 2M100 126q7 8 13 2" {...s} />
}

export default function YukiArt({ mood = 'idle', prop = '', size = 140, className = '', title }) {
  const id = useId().replace(/:/g, '')
  const tunnel = prop === 'tunnel'
  return (
    <svg
      className={`yuki-art ${className}`}
      width={size}
      height={(size * 190) / 200}
      viewBox="0 0 200 190"
      role="img"
      aria-label={title || 'Юки'}
      style={{ display: 'block', flex: '0 0 auto', overflow: 'visible' }}
    >
      <defs>
        <clipPath id={`b${id}`}>
          <path d={BODY} />
        </clipPath>
        {tunnel && (
          <clipPath id={`t${id}`}>
            <ellipse cx="100" cy="104" rx="74" ry="70" />
          </clipPath>
        )}
      </defs>

      {tunnel && (
        <g>
          <ellipse cx="100" cy="104" rx="94" ry="84" fill="#2FBF8F" stroke={INK} strokeWidth="5" />
          <path d="M22 62c20-34 60-48 100-42" fill="none" stroke="#1FA6C9" strokeWidth="13" strokeLinecap="round" />
          <ellipse cx="100" cy="104" rx="74" ry="70" fill="#DCE6F2" stroke={INK} strokeWidth="5" />
          <g fill="none" stroke="#B8C7DC" strokeWidth="5" strokeLinecap="round">
            <path d="M40 80q8-8 16 0M150 70q8-8 16 0M46 132q8-8 16 0M140 140q8-8 16 0M92 46q8-8 16 0" />
          </g>
        </g>
      )}

      <g clipPath={tunnel ? `url(#t${id})` : undefined} transform={tunnel ? 'translate(12 30) scale(0.88)' : undefined}>
        {/* shadow + feet */}
        {!tunnel && <ellipse cx="100" cy="170" rx="70" ry="9" fill={INK} opacity=".12" />}
        <g fill="#F3B68E" stroke={INK} strokeWidth="4" strokeLinejoin="round">
          <ellipse cx="70" cy="164" rx="15" ry="8" />
          <ellipse cx="130" cy="164" rx="15" ry="8" />
        </g>
        {/* ears */}
        <ellipse cx="38" cy="62" rx="19" ry="13" transform="rotate(-32 38 62)" fill={GINGER} stroke={INK} strokeWidth="5" />
        <ellipse cx="162" cy="62" rx="19" ry="13" transform="rotate(32 162 62)" fill={BLACK} stroke={INK} strokeWidth="5" />

        {/* coat */}
        <g clipPath={`url(#b${id})`}>
          <rect x="0" y="0" width="200" height="190" fill={BLACK} />
          <ellipse cx="34" cy="118" rx="40" ry="50" fill={GINGER} />
          <ellipse cx="172" cy="146" rx="36" ry="34" fill={GINGER} />
          <path d="M92 24c-1 30-14 46-16 70-3 30 8 50 24 50s27-20 24-50c-2-24-15-40-16-70Z" fill={WHITE} />
          <ellipse cx="100" cy="170" rx="50" ry="26" fill={WHITE} />
          {mood === 'hot' && <rect x="0" y="0" width="200" height="190" fill="#F0564F" opacity=".14" />}
        </g>
        <path d={BODY} fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />

        {/* face */}
        <g opacity=".55" fill={PINK}>
          <circle cx="52" cy="114" r="9" />
          <circle cx="148" cy="114" r="9" />
        </g>
        <Eyes mood={mood} />
        <ellipse cx="100" cy="114" rx="9.5" ry="6.5" fill={PINK} stroke={INK} strokeWidth="3.4" />
        <Mouth mood={mood} />
        <g fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" opacity=".5">
          <path d="M76 118 44 110M76 124l-34 2M124 118l32-8M124 124l34 2" />
        </g>
      </g>

      {/* props */}
      {prop === 'dill' && (
        <g fill="none" stroke="#3E9B4F" strokeLinecap="round" strokeLinejoin="round">
          <path d="M104 96C98 70 100 44 112 14" strokeWidth="6" stroke="#57B45F" />
          <g strokeWidth="3.4">
            <path d="M108 40C96 30 90 22 88 10M109 34c10-8 18-12 28-12M104 58C92 50 84 44 78 32M105 54c12-6 22-8 34-6M112 22c-4-8-4-12-2-18M114 18c6-6 10-8 18-8M96 26c-6-2-12-2-16 2M124 24c4 0 8 2 10 6M86 44c-6 0-10 2-12 6M128 46c4 2 6 4 8 8" />
          </g>
        </g>
      )}
      {prop === 'party' && (
        <g stroke={INK} strokeWidth="4.5" strokeLinejoin="round">
          <path d="M100 -8 74 40c16 8 36 8 52 0Z" fill="#2549D8" />
          <path d="M88 14c8 4 16 4 24 0M81 28c12 6 26 6 38 0" fill="none" stroke="#F7B581" strokeWidth="5" />
          <circle cx="100" cy="-10" r="8" fill="#F0564F" />
        </g>
      )}
      {prop === 'crown' && (
        <path d="M66 36 60 4l22 16L100-4l18 24 22-16-6 32c-22 8-46 8-68 0Z" fill="#F6C445" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      )}
      {prop === 'sparkle' && (
        <g fill="#F6C445" stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <path d="M22 26l5 13 13 5-13 5-5 13-5-13-13-5 13-5Z" />
          <path d="M178 12l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" />
          <path d="M186 108l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
        </g>
      )}
      {prop === 'drops' && (
        <g fill="#7CC4F2" stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <path d="M22 20c-9 13-9 21 0 21s9-8 0-21Z" />
          <path d="M180 8c-8 12-8 19 0 19s8-7 0-19Z" />
          <path d="M190 90c-6 9-6 14 0 14s6-5 0-14Z" />
        </g>
      )}
      {prop === 'scale' && (
        <g stroke={INK} strokeWidth="4.5" strokeLinejoin="round">
          <rect x="34" y="166" width="132" height="22" rx="10" fill="#F7B581" />
          <path d="M86 177h28" fill="none" strokeLinecap="round" />
        </g>
      )}
      {mood === 'love' && (
        <g fill="#F0564F" stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <path d="M22 44c-12-7-13-18-6-20 3-1 5 1 6 3 1-2 3-4 6-3 7 2 6 13-6 20Z" />
          <path d="M180 30c-9-5-10-13-5-15 2-1 4 1 5 2 1-1 3-3 5-2 5 2 4 10-5 15Z" />
        </g>
      )}
      {mood === 'sleep' && (
        <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M150 30h16l-16 18h16" />
          <path d="M174 4h11L174 17h11" strokeWidth="3.6" />
        </g>
      )}
      {mood === 'hot' && (
        <g fill="#7CC4F2" stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <path d="M28 40c-7 10-7 16 0 16s7-6 0-16Z" />
          <path d="M172 34c-7 10-7 16 0 16s7-6 0-16Z" />
        </g>
      )}
    </svg>
  )
}
