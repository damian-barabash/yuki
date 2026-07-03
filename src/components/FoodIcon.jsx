// Hand-rolled flat SVG icon set for every food. One cohesive look instead of
// mismatched emoji — and, crucially, colour-coded variants (each pepper / berry
// / citrus / root gets its own tint on a shared shape). Tiny, tree-shakeable,
// zero deps. Resolve with iconFor(food); render with <FoodIcon food={...} />.

const G = '#5cb974' // leaf green
const GD = '#3f9a58' // leaf green dark
const STEM = '#9c7b4d'

// darken a hex by ratio (for outlines / shading)
function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16)
  let r = n >> 16,
    g = (n >> 8) & 255,
    b = n & 255
  r = Math.round(r * (1 - p))
  g = Math.round(g * (1 - p))
  b = Math.round(b * (1 - p))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

const leaf = (x, y, flip) => (
  <path
    d={`M${x} ${y}c${flip ? '-' : ''}3 -3 ${flip ? '-' : ''}6 -2 ${flip ? '-' : ''}6 -2s0 4 ${flip ? '-' : ''}-4 4c-1 0-2 -1 -2 -2z`}
    fill={G}
  />
)
const stemTop = (x = 15) => <rect x={x} y="4" width="2.4" height="6" rx="1.2" fill={STEM} />

// each shape: (c = main colour, a = accent colour) => svg children on a 32×32 grid
const SHAPES = {
  apple: (c) => (
    <>
      {stemTop()}
      {leaf(17, 7)}
      <path d="M16 10c-3-2.5-11-1.5-11 7 0 6.5 5 12 8 12 1.5 0 2-.8 3-.8s1.5.8 3 .8c3 0 8-5.5 8-12 0-8.5-8-9.5-11-7z" fill={c} />
      <ellipse cx="11" cy="16" rx="2" ry="3" fill="#fff" opacity=".25" />
    </>
  ),
  pear: (c) => (
    <>
      {stemTop(15)}
      {leaf(17, 7)}
      <path d="M16 9c-1.4 0-2.2 1.2-2.2 3.2 0 2-4.3 3.4-4.3 9.3 0 5 3.2 8.2 6.5 8.2s6.5-3.2 6.5-8.2c0-5.9-4.3-7.3-4.3-9.3 0-2-.8-3.2-2.2-3.2z" fill={c} />
      <ellipse cx="12.5" cy="20" rx="1.6" ry="2.6" fill="#fff" opacity=".25" />
    </>
  ),
  banana: (c) => (
    <>
      <path d="M7 9c1 8 6 15 15 16 2 .2 3-.3 3-1.6 0-.8-.7-1.1-1.7-1.2C16 21 12 15 11 8.4 10.8 7.2 10.2 6.7 9 6.9 7.7 7.1 6.9 7.8 7 9z" fill={c} />
      <path d="M22.7 23.4c-6-1-10.4-6.4-11.6-13" fill="none" stroke={shade(c, 0.25)} strokeWidth="1.3" strokeLinecap="round" opacity=".6" />
      <path d="M8 8l1.8-1.2" stroke={shade(c, 0.4)} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  grape: (c) => (
    <>
      {stemTop(15)}
      {leaf(17, 6)}
      {[
        [16, 12],
        [12, 15],
        [20, 15],
        [14, 19],
        [18, 19],
        [16, 23],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.4" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.6" />
      ))}
    </>
  ),
  strawberry: (c) => (
    <>
      <path d="M9 5c1.5 1.5 4 2 7 2s5.5-.5 7-2c-.5 2-2 3.2-3.5 3.6" fill={G} />
      <path d="M16 8c-6 0-9 3.5-9 8 0 5 5 11 9 11s9-6 9-11c0-4.5-3-8-9-8z" fill={c} />
      {[
        [12, 13],
        [16, 12],
        [20, 13],
        [13, 18],
        [19, 18],
        [16, 21],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.9" fill="#ffe9a8" />
      ))}
    </>
  ),
  cherry: (c) => (
    <>
      <path d="M16 6c-3 4-9 3-9 3" fill="none" stroke={GD} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 6c2 4 7 4 7 4" fill="none" stroke={GD} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="21" r="6" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.6" />
      <circle cx="22" cy="21" r="6" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.6" />
      <circle cx="7" cy="19" r="1.4" fill="#fff" opacity=".3" />
    </>
  ),
  citrus: (c) => (
    <>
      <circle cx="16" cy="17" r="11" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.8" />
      <circle cx="16" cy="17" r="7.5" fill="#fff" opacity=".55" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2
        return <line key={i} x1="16" y1="17" x2={16 + Math.cos(a) * 7.5} y2={17 + Math.sin(a) * 7.5} stroke={c} strokeWidth="1" opacity=".7" />
      })}
      {leaf(19, 6)}
    </>
  ),
  watermelon: (c) => (
    <>
      <path d="M4 24c3 5 21 5 24 0L16 9z" fill="#e05a6b" />
      <path d="M4 24c3 5 21 5 24 0" fill="none" stroke={c} strokeWidth="3" />
      <path d="M5.5 22.5c3 4 18 4 21 0" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".7" />
      {[
        [12, 20],
        [16, 22],
        [20, 20],
        [16, 18],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="0.9" ry="1.4" fill="#3a3a3a" />
      ))}
    </>
  ),
  melon: (c) => (
    <>
      {leaf(19, 6)}
      <circle cx="16" cy="18" r="11" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.8" />
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} d={`M${8 + i * 4} 9c-1 6-1 12 0 18`} fill="none" stroke={shade(c, 0.28)} strokeWidth="0.8" opacity=".6" />
      ))}
    </>
  ),
  pineapple: (c) => (
    <>
      <path d="M16 3c-1 3-3 4-3 4s3 0 3 2c0-2 3-2 3-2s-2-1-3-4z" fill={GD} />
      <path d="M11 5c1 2 3 4 5 4s4-2 5-4c0 3-1 5-1 5h-8s-1-2-1-5z" fill={G} />
      <ellipse cx="16" cy="19" rx="9" ry="10" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.8" />
      {Array.from({ length: 4 }).map((_, i) =>
        Array.from({ length: 3 }).map((_, j) => <circle key={i + '-' + j} cx={11 + j * 5 + (i % 2) * 2.5} cy={13 + i * 4} r="1.1" fill={shade(c, 0.28)} />),
      )}
    </>
  ),
  mango: (c) => (
    <>
      {leaf(20, 6)}
      <path d="M14 9c-6 1-9 6-9 11 0 4 4 7 9 7 7 0 12-5 12-11 0-5-6-8-12-7z" fill={c} />
      <ellipse cx="12" cy="16" rx="2.4" ry="3.4" fill="#fff" opacity=".22" />
    </>
  ),
  stonefruit: (c) => (
    <>
      {stemTop(15)}
      {leaf(17, 6)}
      <circle cx="16" cy="19" r="10" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.7" />
      <path d="M16 10c-2 4-2 14 0 18" fill="none" stroke={shade(c, 0.3)} strokeWidth="1" opacity=".5" />
      <ellipse cx="12" cy="16" rx="2" ry="3" fill="#fff" opacity=".28" />
    </>
  ),
  kiwi: (c) => (
    <>
      <circle cx="16" cy="16" r="11" fill="#8a5a2b" />
      <circle cx="16" cy="16" r="9" fill={c} />
      <circle cx="16" cy="16" r="3.2" fill="#f4f4e0" />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2
        return <circle key={i} cx={16 + Math.cos(a) * 6} cy={16 + Math.sin(a) * 6} r="0.7" fill="#2f2f2f" />
      })}
    </>
  ),
  pomegranate: (c) => (
    <>
      <path d="M16 6c1 0 1.5.8 1.5 2 2 0 3 1 3 1" fill="none" stroke={GD} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 8c1-1.6-.6-2-1.4-1" fill="none" stroke={shade(c, 0.3)} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="18" r="10.5" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.7" />
      <path d="M13 8l1.5 2M19 8l-1.5 2M16 7v2.5" stroke={shade(c, 0.35)} strokeWidth="1.2" strokeLinecap="round" />
      {[
        [13, 17],
        [16, 15],
        [19, 17],
        [14, 21],
        [18, 21],
        [16, 19],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#9e1b2e" opacity=".85" />
      ))}
    </>
  ),
  fig: (c) => (
    <>
      {stemTop(15)}
      {leaf(17, 6)}
      <path d="M16 9c-5 0-9 4-9 9 0 5 4 9 9 9s9-4 9-9c0-5-4-9-9-9z" fill={c} />
      <path d="M16 12v13M11 16h10M12 21h8" stroke={shade(c, 0.3)} strokeWidth="0.7" opacity=".5" />
      <circle cx="16" cy="19" r="3" fill="#c0506a" opacity=".5" />
    </>
  ),
  persimmon: (c) => (
    <>
      <path d="M16 8c-6 0-10 4-10 9s4 8 10 8 10-3 10-8-4-9-10-9z" fill={c} />
      <path d="M10 9c1.5-2 4-2.5 6-2.5s4.5.5 6 2.5c-1.5 1.2-3.5 1.5-6 1.5s-4.5-.3-6-1.5z" fill={GD} />
      <path d="M16 6v3" stroke={STEM} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  avocado: (c) => (
    <>
      <path d="M16 6c-4 0-6 4-6 8 0 6 3 12 6 12s6-6 6-12c0-4-2-8-6-8z" fill={GD} />
      <path d="M16 9c-3 0-4.5 3.2-4.5 6.5 0 5 2.2 9.5 4.5 9.5s4.5-4.5 4.5-9.5C20.5 12.2 19 9 16 9z" fill={c} />
      <circle cx="16" cy="19" r="3.4" fill="#a9743f" />
    </>
  ),
  coconut: (c) => (
    <>
      <circle cx="16" cy="17" r="11" fill="#7a4a2b" />
      <circle cx="16" cy="17" r="8" fill={c} />
      {[
        [13, 15],
        [19, 15],
        [16, 20],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.4" fill="#5a3418" />
      ))}
    </>
  ),
  papaya: (c) => (
    <>
      <path d="M8 8c8 2 14 8 16 16 .5 2-1 3-3 2C13 24 8 17 6 10 5.5 8 6 7 8 8z" fill={c} />
      {[
        [12, 13],
        [15, 15],
        [18, 17],
        [14, 12],
        [17, 14],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#3a3a3a" opacity=".6" />
      ))}
    </>
  ),
  dragonfruit: (c) => (
    <>
      <path d="M16 6c-5 1-9 5-9 10s4 9 9 10c5-1 9-5 9-10s-4-9-9-10z" fill={c} />
      {[
        [10, 8],
        [22, 8],
        [8, 16],
        [24, 16],
        [12, 25],
        [20, 25],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y}l2 2-2 2-2-2z`} fill={GD} />
      ))}
      <ellipse cx="16" cy="16" rx="4" ry="5" fill="#fff" opacity=".7" />
    </>
  ),
  berry: (c) => (
    <>
      {leaf(18, 5)}
      <circle cx="12" cy="17" r="4.2" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.6" />
      <circle cx="20" cy="17" r="4.2" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.6" />
      <circle cx="16" cy="22" r="4.2" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.6" />
      <circle cx="10.5" cy="15.5" r="1" fill="#fff" opacity=".4" />
    </>
  ),
  raspberry: (c) => (
    <>
      {leaf(18, 4)}
      {[
        [16, 12],
        [13, 15],
        [19, 15],
        [12, 19],
        [16, 19],
        [20, 19],
        [14, 23],
        [18, 23],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.4" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.5" />
      ))}
    </>
  ),
  starfruit: (c) => (
    <>
      <path d="M16 4l3 8 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.7" strokeLinejoin="round" />
    </>
  ),
  lychee: (c) => (
    <>
      {stemTop(15)}
      <circle cx="16" cy="18" r="10" fill={c} />
      {Array.from({ length: 5 }).map((_, i) =>
        Array.from({ length: 4 }).map((_, j) => <path key={i + '-' + j} d={`M${10 + j * 4} ${11 + i * 3.4}l1.4 1.4-1.4 1.4-1.4-1.4z`} fill={shade(c, 0.3)} />),
      )}
    </>
  ),
  dates: (c) => (
    <>
      {[
        [12, 16],
        [17, 15],
        [15, 20],
        [20, 19],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="3" ry="4.6" fill={c} transform={`rotate(${18 - i * 12} ${x} ${y})`} stroke={shade(c, 0.3)} strokeWidth="0.5" />
      ))}
    </>
  ),

  // ---- vegetables ----
  carrot: (c) => (
    <>
      <path d="M9 8c2-1 4 0 4 0M12 6c1 1 1 3 1 3M15 7c2-1 4 0 4 0" stroke={GD} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M13 10c3 0 5 1 5 2 0 3-6 15-8 15-1 0-2-1-2-3 0-5 2-14 5-14z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <path d="M12 15l3 .5M11 19l3 .5M10 23l2.5.5" stroke={shade(c, 0.28)} strokeWidth="0.9" strokeLinecap="round" />
    </>
  ),
  root: (c) => (
    <>
      <path d="M11 6c1 2 3 3 5 3s4-1 5-3c-1 3-3 4-5 4s-4-1-5-4z" fill={G} />
      <path d="M16 9c-5 0-8 4-8 8s3 8 8 8 8-4 8-8-3-8-8-8z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <ellipse cx="12.5" cy="15" rx="1.8" ry="2.6" fill="#fff" opacity=".22" />
    </>
  ),
  radish: (c) => (
    <>
      <path d="M12 5c1 2 3 3 5 3s3-1 4-3c-1 3-2 4-4 4" fill="none" stroke={G} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 8c-5 0-8 4-8 9 0 4 3 8 8 8s8-4 8-8c0-5-3-9-8-9z" fill={c} />
      <path d="M8 20c3 3 13 3 16 0-2 4-14 4-16 0z" fill="#f4ecd8" />
      <path d="M16 24c-.5 2-1 4-1 4" stroke="#e8dcbf" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  potato: (c) => (
    <>
      <path d="M8 15c0-4 4-7 9-7s9 2 9 6c0 5-4 9-10 9-5 0-8-3-8-8z" fill={c} stroke={shade(c, 0.18)} strokeWidth="0.6" />
      {[
        [12, 13],
        [18, 12],
        [20, 18],
        [13, 19],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.8" fill={shade(c, 0.25)} />
      ))}
    </>
  ),
  tomato: (c) => (
    <>
      <path d="M16 8c-6 0-10 4-10 9s4 8 10 8 10-3 10-8-4-9-10-9z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <path d="M16 9c0-2-1-3-1-3M16 9c1-2 3-2.5 4-2 0 1.5-1.5 2-4 2M16 9c-1-2-3-2.5-4-2 0 1.5 1.5 2 4 2" fill={GD} />
      <ellipse cx="12" cy="14" rx="2" ry="2.8" fill="#fff" opacity=".22" />
    </>
  ),
  cucumber: (c) => (
    <>
      <rect x="9" y="6" width="7" height="22" rx="3.5" fill={c} transform="rotate(24 12 17)" stroke={shade(c, 0.22)} strokeWidth="0.6" />
      <path d="M20 8l-9 16" stroke={shade(c, 0.28)} strokeWidth="0.8" opacity=".6" />
      <path d="M22 10l-9 16" stroke={shade(c, 0.28)} strokeWidth="0.8" opacity=".4" />
    </>
  ),
  pepper: (c) => (
    <>
      <path d="M16 8c-1-2-3-2-4-1M16 8c1-2 3-2 4-1" fill="none" stroke={GD} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="15" y="5" width="2" height="4" rx="1" fill={GD} />
      <path d="M9 12c0-2 2-3 3-3 1 0 1.5.6 2 1.4.5-.8 1-1.4 2-1.4 1 0 3 1 3 3 0 2 1 3 1 6 0 5-3 9-6 9s-6-4-6-9c0-3 1-4 1-6z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <ellipse cx="12" cy="18" rx="1.6" ry="3" fill="#fff" opacity=".28" />
    </>
  ),
  chili: (c) => (
    <>
      <path d="M13 6c0 2 1 3 2 3" fill="none" stroke={GD} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 9c3 0 5 2 5 6 0 6-4 11-9 11-2 0-3-1-3-2 0-1 1-1.5 2.5-1.7C18 27 17 12 15 9z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
    </>
  ),
  broccoli: (c) => (
    <>
      <rect x="14" y="17" width="4" height="9" rx="2" fill="#cbe0a8" />
      {[
        [10, 12],
        [16, 9],
        [22, 12],
        [13, 15],
        [19, 15],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4.5" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.5" />
      ))}
    </>
  ),
  cabbage: (c) => (
    <>
      <circle cx="16" cy="17" r="11" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.7" />
      <path d="M16 6c4 2 6 6 6 11s-2 9-6 11M16 6c-4 2-6 6-6 11s2 9 6 11M6 17c3-1.5 7-2 10-2s7 .5 10 2" fill="none" stroke={shade(c, 0.28)} strokeWidth="0.9" opacity=".6" />
      <ellipse cx="16" cy="17" rx="3" ry="4" fill={shade(c, -0.15)} opacity=".5" />
    </>
  ),
  leaf: (c) => (
    <>
      <path d="M16 5c-7 2-11 8-11 15 0 4 2 6 4 6 7 0 12-9 12-19 0-1.5-2-2.6-5-2z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <path d="M14 8c-3 5-4 12-4 17" fill="none" stroke={shade(c, 0.28)} strokeWidth="1" strokeLinecap="round" opacity=".6" />
      <path d="M13 14l-4 1M12 19l-3 1" stroke={shade(c, 0.28)} strokeWidth="0.7" opacity=".5" />
    </>
  ),
  corn: (c) => (
    <>
      <path d="M8 8c4-2 8 0 8 0s4-2 8 0c-2 2-4 2-4 2s2 3 0 6" fill={G} />
      <path d="M16 7c4 0 6 3 6 9 0 7-3 11-6 11s-6-4-6-11c0-6 2-9 6-9z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.5" />
      {Array.from({ length: 4 }).map((_, i) =>
        Array.from({ length: 3 }).map((_, j) => <circle key={i + '-' + j} cx={13 + j * 3} cy={12 + i * 3.6} r="1.1" fill={shade(c, 0.22)} />),
      )}
    </>
  ),
  pumpkin: (c) => (
    <>
      <rect x="15" y="5" width="2.4" height="5" rx="1.2" fill={GD} />
      <ellipse cx="16" cy="19" rx="12" ry="9" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <path d="M16 11v16M11 12c-1.5 4-1.5 10 0 14M21 12c1.5 4 1.5 10 0 14" fill="none" stroke={shade(c, 0.28)} strokeWidth="0.9" opacity=".55" />
    </>
  ),
  eggplant: (c) => (
    <>
      <path d="M13 6c0 2 1 3 2 4M17 5c-1 2-1 4 0 5" fill="none" stroke={GD} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 10c-1.5-1.5-3-1.5-4-1s-1.5 1-1.5 1-2-1.5-4 0c-2 1.5-3 4-3 7 0 6 4 10 9 10s8-4 8-9c0-4-1-6-3.5-8z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <ellipse cx="12" cy="19" rx="1.8" ry="3.4" fill="#fff" opacity=".2" />
    </>
  ),
  pod: (c) => (
    <>
      <path d="M8 24c-2-8 3-17 9-19 2-.6 3 .4 2.4 2.4C17 14 12 22 9.6 25c-1 1.2-1.4 0-1.6-1z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      {[
        [11, 18],
        [13, 14],
        [15, 10],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill={shade(c, -0.12)} opacity=".7" />
      ))}
    </>
  ),
  mushroom: (c) => (
    <>
      <path d="M6 15c0-5 4-8 10-8s10 3 10 8c0 1-1 1.5-2 1.5H8c-1 0-2-.5-2-1.5z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <path d="M13 16v7c0 2 1 3 3 3s3-1 3-3v-7z" fill="#f2ead6" />
      {[
        [11, 12],
        [16, 11],
        [21, 12],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="1.6" ry="1" fill="#fff" opacity=".45" />
      ))}
    </>
  ),
  onion: (c) => (
    <>
      <path d="M16 8c2-3 4-4 4-4M16 8c-1-2.5-2.5-3.5-2.5-3.5" fill="none" stroke={G} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 8c-5 0-8 4-8 9s3 8 8 8 8-3 8-8-3-9-8-9z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <path d="M16 8c-2 3-2 14 0 17M12 10c-1.5 3-1.5 11 0 14M20 10c1.5 3 1.5 11 0 14" fill="none" stroke={shade(c, 0.22)} strokeWidth="0.8" opacity=".5" />
    </>
  ),
  garlic: (c) => (
    <>
      <path d="M16 5c1 2 1 3 1 4M16 5c-.5 2-.5 3-.5 4" fill="none" stroke="#cdd6bf" strokeWidth="1" />
      <path d="M16 8c-5 0-8 4-8 9s3 9 8 9 8-4 8-9-3-9-8-9z" fill={c} stroke={shade(c, 0.12)} strokeWidth="0.6" />
      <path d="M16 8c-2 3-2 15 0 18M11 11c-1 3-1 11 0 14M21 11c1 3 1 11 0 14" fill="none" stroke={shade(c, 0.1)} strokeWidth="0.9" opacity=".7" />
    </>
  ),
  leek: (c) => (
    <>
      <path d="M13 4c-1 3-1 6 0 8M16 3c-1 3-1 6 0 8M19 4c-1 3-1 6 0 8" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 12h8v11c0 3-1.5 5-4 5s-4-2-4-5z" fill="#eef2e0" stroke={shade('#eef2e0', 0.12)} strokeWidth="0.5" />
      <path d="M12 12h8l-.5 5h-7z" fill={c} opacity=".5" />
    </>
  ),
  celery: (c) => (
    <>
      {[10, 14, 18].map((x, i) => (
        <path key={i} d={`M${x} 26c-1-6 0-14 ${1 - i} -18`} fill="none" stroke={c} strokeWidth="3.4" strokeLinecap="round" />
      ))}
      <path d="M7 8c3-3 12-3 15 0-2 2-13 2-15 0z" fill={G} />
    </>
  ),
  asparagus: (c) => (
    <>
      {[11, 15, 19].map((x, i) => (
        <g key={i}>
          <path d={`M${x} 27c-1-7-1-14 ${i - 1} -19`} fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
          <path d={`M${x + i - 1} 8l0 -2`} stroke={GD} strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  artichoke: (c) => (
    <>
      <path d="M16 6c-6 2-9 7-9 12 0 5 4 8 9 8s9-3 9-8c0-5-3-10-9-12z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      {[
        [12, 14],
        [20, 14],
        [16, 12],
        [10, 20],
        [22, 20],
        [16, 18],
        [13, 23],
        [19, 23],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y}c-2 0-3 2-3 3 2 0 4-1 6 0 0-2-1-3-3-3z`} fill={shade(c, 0.18)} opacity=".8" />
      ))}
    </>
  ),
  fennel: (c) => (
    <>
      <path d="M11 6c1 3 3 4 5 4s4-1 5-4M13 5c0 3 1 4 3 5M19 5c0 3-1 4-3 5" fill="none" stroke={G} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 14c0-2 3-3 6-3s6 1 6 3c0 6-3 11-6 11s-6-5-6-11z" fill="#eef2e0" stroke={shade('#eef2e0', 0.14)} strokeWidth="0.5" />
      <path d="M13 13c1 5 1 9 0 11M19 13c-1 5-1 9 0 11" fill="none" stroke="#d7e0bf" strokeWidth="0.9" />
    </>
  ),
  sprig: (c) => (
    <>
      <path d="M16 28c0-10 0-18 0-22" fill="none" stroke={shade(c, 0.15)} strokeWidth="1.6" strokeLinecap="round" />
      {[8, 12, 16, 20].map((y, i) => (
        <g key={i}>
          <path d={`M16 ${y}c-3-1-5-3-6-5`} fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <path d={`M16 ${y + 1.5}c3-1 5-3 6-5`} fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="16" cy="6" r="2.4" fill={c} />
    </>
  ),
  needle: (c) => (
    <>
      <path d="M16 28V5" fill="none" stroke={shade(c, 0.2)} strokeWidth="1.6" strokeLinecap="round" />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <path d={`M16 ${7 + i * 2.6}l-4-2`} stroke={c} strokeWidth="1.4" strokeLinecap="round" />
          <path d={`M16 ${7 + i * 2.6}l4-2`} stroke={c} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  grass: (c) => (
    <>
      {[7, 11, 15, 19, 23].map((x, i) => (
        <path key={i} d={`M${x} 28c${i % 2 ? '-' : ''}2-8 ${i % 2 ? '-' : ''}1-16 ${i % 2 ? '2' : '-2'}-20`} fill="none" stroke={i % 2 ? shade(c, 0.15) : c} strokeWidth="2.2" strokeLinecap="round" />
      ))}
    </>
  ),
  rhubarb: (c) => (
    <>
      <path d="M18 6c5-1 8 2 8 2s-3 5-8 4c-2-.4-2-5 0-6z" fill={G} />
      <path d="M14 9c1 0 2 1 2 3 0 6-1 13-2 15-.6 1.2-2 1-2.4-.3C11 22 10 14 11 11c.4-1.4 1.8-2 3-2z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
    </>
  ),
  bowl: (c) => (
    <>
      <path d="M5 15h22c0 7-5 11-11 11S5 22 5 15z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.7" />
      <ellipse cx="16" cy="15" rx="11" ry="3" fill={shade(c, -0.12)} />
      {[
        [12, 12],
        [16, 11],
        [20, 12],
        [14, 13.5],
        [18, 13.5],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill="#c98a4a" />
      ))}
    </>
  ),
  pill: (c) => (
    <>
      <rect x="6" y="12" width="20" height="9" rx="4.5" fill={c} transform="rotate(-18 16 16)" stroke={shade(c, 0.2)} strokeWidth="0.7" />
      <path d="M13.5 8.5l6.5 19" stroke="#fff" strokeWidth="1.3" opacity=".8" transform="rotate(-18 16 16)" />
      <rect x="6" y="12" width="10" height="9" rx="4.5" fill="#fff" opacity=".35" transform="rotate(-18 16 16)" />
    </>
  ),
  bread: (c) => (
    <>
      <path d="M6 16c0-5 4-8 10-8s10 3 10 8v6c0 2-1 3-3 3H9c-2 0-3-1-3-3z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <path d="M10 13c1-1 2-1 3 0M17 13c1-1 2-1 3 0" stroke={shade(c, 0.28)} strokeWidth="1" strokeLinecap="round" />
    </>
  ),
  meat: (c) => (
    <>
      <path d="M9 9c5-4 14-2 15 5 .6 4-2 8-7 9-6 1-11-2-11-7 0-3 1-5 3-7z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <circle cx="14" cy="15" r="3.4" fill="#f0d6d0" />
      <path d="M22 24l3 3" stroke="#e7e0d0" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  dairy: (c) => (
    <>
      <path d="M10 6h12l2 6v13c0 1-1 2-2 2H10c-1 0-2-1-2-2V12z" fill={c} stroke={shade(c, 0.15)} strokeWidth="0.6" />
      <path d="M8 12h16" stroke={shade(c, 0.2)} strokeWidth="1" />
      <rect x="13" y="15" width="6" height="5" rx="1" fill="#f4c95b" opacity=".8" />
    </>
  ),
  chocolate: (c) => (
    <>
      <rect x="8" y="8" width="16" height="18" rx="2" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.6" />
      <path d="M16 8v18M8 14h16M8 20h16" stroke={shade(c, 0.3)} strokeWidth="1" />
    </>
  ),
  nuts: (c) => (
    <>
      <path d="M16 6c-4 0-7 3-7 8 0 3 1 6 3 9 1 1.5 2 3 4 3s3-1.5 4-3c2-3 3-6 3-9 0-5-3-8-7-8z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <path d="M16 6v20M11 12c2 1 8 1 10 0M11 18c2 1 8 1 10 0" fill="none" stroke={shade(c, 0.28)} strokeWidth="0.9" opacity=".6" />
    </>
  ),
  seeds: (c) => (
    <>
      {[
        [12, 12, 20],
        [18, 14, -15],
        [14, 19, 40],
        [20, 20, -30],
        [16, 24, 10],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="2" ry="3.4" fill={c} transform={`rotate(${r} ${x} ${y})`} stroke={shade(c, 0.25)} strokeWidth="0.5" />
      ))}
    </>
  ),
}

// slug → [shape, mainColour, accentColour?]
const MAP = {
  // staples
  feed: ['bowl', '#e6b877'],
  'vitamin-c': ['pill', '#f0913e'],

  // fruit
  apple: ['apple', '#e0574f'],
  pear: ['pear', '#a8cf5e'],
  banana: ['banana', '#f2ce4a'],
  grape: ['grape', '#8b5ca8'],
  strawberry: ['strawberry', '#e0483f'],
  blueberry: ['berry', '#5a7fc4'],
  raspberry: ['raspberry', '#d24d78'],
  blackberry: ['raspberry', '#4a3357'],
  redcurrant: ['berry', '#d8474f'],
  blackcurrant: ['berry', '#3a2b45'],
  gooseberry: ['berry', '#b7cf63'],
  cranberry: ['berry', '#c62f45'],
  lingonberry: ['berry', '#d24455'],
  'highbush-blueberry': ['berry', '#7d9bd6'],
  'wild-strawberry': ['strawberry', '#e0605a'],
  mulberry: ['raspberry', '#5c3a66'],
  'sea-buckthorn': ['berry', '#f09a2e'],
  saskatoon: ['berry', '#6a5a9e'],
  haskap: ['berry', '#4a5aa8'],
  cloudberry: ['raspberry', '#f2a85c'],
  aronia: ['berry', '#33283d'],
  physalis: ['berry', '#f5c04a'],
  viburnum: ['berry', '#e05545'],
  rowan: ['berry', '#e2703a'],
  elderberry: ['berry', '#2e2440'],
  orange: ['citrus', '#f0913e'],
  mandarin: ['citrus', '#f0842e'],
  clementine: ['citrus', '#f2822a'],
  grapefruit: ['citrus', '#ef7d78'],
  lemon: ['citrus', '#f4d43a'],
  lime: ['citrus', '#9ccf3e'],
  pomelo: ['citrus', '#c7d97a'],
  kiwi: ['kiwi', '#7fb24a'],
  melon: ['melon', '#c7e07a'],
  watermelon: ['watermelon', '#4caf5a'],
  cherry: ['cherry', '#c62f45'],
  peach: ['stonefruit', '#f0a862'],
  apricot: ['stonefruit', '#f0b24a'],
  plum: ['stonefruit', '#8b5ca8'],
  nectarine: ['stonefruit', '#e8794f'],
  mango: ['mango', '#f0a83a'],
  pineapple: ['pineapple', '#f0c93a'],
  papaya: ['papaya', '#f0913e'],
  pomegranate: ['pomegranate', '#c62f45'],
  fig: ['fig', '#8a5f8f'],
  persimmon: ['persimmon', '#f0842e'],
  guava: ['stonefruit', '#e88a7a'],
  lychee: ['lychee', '#e0574f'],
  'passion-fruit': ['stonefruit', '#7a4a7f'],
  starfruit: ['starfruit', '#e8c94a'],
  'dragon-fruit': ['dragonfruit', '#e0507a'],
  coconut: ['coconut', '#f2ead6'],
  avocado: ['avocado', '#8fae4a'],
  dates: ['dates', '#8a5a34'],
  raisins: ['dates', '#6a3f57'],
  'fruit-seeds-pits': ['seeds', '#8a6a4a'],
  nuts: ['nuts', '#c79a5a'],

  // greens / leaves
  'romaine-lettuce': ['leaf', '#7bbf5a'],
  'green-leaf-lettuce': ['leaf', '#82c25a'],
  'red-leaf-lettuce': ['leaf', '#c05a6a'],
  'butterhead-lettuce': ['leaf', '#9ccf6a'],
  'iceberg-lettuce': ['leaf', '#bfe0a0'],
  endive: ['leaf', '#b6cf6a'],
  spinach: ['leaf', '#4f9a52'],
  kale: ['leaf', '#3f7a4a'],
  'swiss-chard': ['leaf', '#5aac5a'],
  'dandelion-greens': ['leaf', '#9cc24a'],
  arugula: ['leaf', '#6aac54'],
  watercress: ['sprig', '#5aac5a'],
  'bok-choy': ['leaf', '#a8cf6a'],
  'collard-greens': ['leaf', '#4f9a52'],
  'turnip-greens': ['leaf', '#6aac54'],
  'mustard-greens': ['leaf', '#7bbf4a'],
  'beet-greens': ['leaf', '#8a6a8f'],
  'carrot-tops': ['sprig', '#5aac5a'],
  'napa-cabbage': ['leaf', '#c7e0a0'],
  sorrel: ['leaf', '#7bbf4a'],
  sprouts: ['sprig', '#8ac25a'],
  clover: ['sprig', '#5aac5a'],
  plantain: ['leaf', '#6aac54'],
  nettle: ['sprig', '#4f9a52'],
  'meadow-grass': ['grass', '#6aac54'],
  timothy: ['grass', '#7bbf5a'],
  hay: ['grass', '#c9b46a'],

  // herbs
  cilantro: ['sprig', '#5aac5a'],
  parsley: ['sprig', '#4f9a52'],
  basil: ['sprig', '#4f9a52'],
  dill: ['needle', '#6aac54'],
  mint: ['sprig', '#5aac5a'],
  oregano: ['sprig', '#6a9a4a'],
  thyme: ['needle', '#6a9a4a'],
  rosemary: ['needle', '#4f8a5a'],
  sage: ['sprig', '#8aae7a'],
  chives: ['needle', '#5aac5a'],
  'lemon-balm': ['sprig', '#7bbf5a'],
  tarragon: ['needle', '#6aac54'],
  marjoram: ['sprig', '#7a9a5a'],

  // vegetables
  'bell-pepper-green': ['pepper', '#5aac5a'],
  'bell-pepper-red': ['pepper', '#e0574f'],
  'bell-pepper-yellow': ['pepper', '#f2c53d'],
  'bell-pepper-orange': ['pepper', '#f0913e'],
  'chili-pepper': ['chili', '#d64545'],
  cucumber: ['cucumber', '#5aac5a'],
  zucchini: ['cucumber', '#4f9a52'],
  okra: ['pod', '#6aac54'],
  carrot: ['carrot', '#f0913e'],
  parsnip: ['carrot', '#f2ead6'],
  daikon: ['carrot', '#f4f4ec'],
  celery: ['celery', '#8ac25a'],
  broccoli: ['broccoli', '#4f9a52'],
  cauliflower: ['broccoli', '#f2ead6'],
  cabbage: ['cabbage', '#9ccf6a'],
  'red-cabbage': ['cabbage', '#9a5aa8'],
  'savoy-cabbage': ['cabbage', '#6aac54'],
  'brussels-sprouts': ['cabbage', '#6aac54'],
  kohlrabi: ['root', '#a8cf7a'],
  tomato: ['tomato', '#e0574f'],
  corn: ['corn', '#f2ce4a'],
  peas: ['pod', '#6aac54'],
  'green-beans': ['pod', '#7bbf5a'],
  pumpkin: ['pumpkin', '#f0913e'],
  squash: ['pumpkin', '#f0b24a'],
  pattypan: ['pumpkin', '#e8e0a0'],
  'sweet-potato': ['potato', '#e08a5a'],
  'potato-raw': ['potato', '#d8b87a'],
  radish: ['radish', '#e0483f'],
  beetroot: ['root', '#a83f6a'],
  turnip: ['root', '#c8a8d0'],
  rutabaga: ['root', '#e0c07a'],
  artichoke: ['artichoke', '#7a9a5a'],
  eggplant: ['eggplant', '#6a3f7f'],
  asparagus: ['asparagus', '#7bbf5a'],
  fennel: ['fennel', '#d7e0bf'],
  onion: ['onion', '#d8b87a'],
  garlic: ['garlic', '#f2ead6'],
  leek: ['leek', '#8ac25a'],
  'green-onion': ['leek', '#7bbf5a'],
  rhubarb: ['rhubarb', '#d24d5a'],
  mushrooms: ['mushroom', '#c8a878'],
  'tomato-leaves': ['leaf', '#4f9a52'],
  'jerusalem-artichoke': ['potato', '#d8b87a'],

  // treats / forbidden
  chocolate: ['chocolate', '#7a4a2b'],
  dairy: ['dairy', '#f0ead6'],
  meat: ['meat', '#d47a6a'],
  bread: ['bread', '#e0b87a'],
}

const CAT_FALLBACK = {
  fruit: ['apple', '#e0574f'],
  vegetable: ['tomato', '#e0574f'],
  green: ['leaf', '#5aac5a'],
  herb: ['sprig', '#5aac5a'],
  treat: ['bread', '#d47a6a'],
  staple: ['bowl', '#e6b877'],
}

export function iconFor(food) {
  if (!food) return ['tomato', '#e0574f']
  if (food.kind === 'feed') return MAP.feed
  if (food.kind === 'vitamin_c') return MAP['vitamin-c']
  return MAP[food.slug] || CAT_FALLBACK[food.category] || ['tomato', '#e0574f']
}

export default function FoodIcon({ food, size = 30, shape, color, className = '' }) {
  const [s, c, a] = shape ? [shape, color] : iconFor(food)
  const draw = SHAPES[s] || SHAPES.tomato
  return (
    <svg
      className={`food-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label={food?.name_ru || ''}
      style={{ display: 'block', flex: '0 0 auto' }}
    >
      {draw(c || '#e0574f', a)}
    </svg>
  )
}
