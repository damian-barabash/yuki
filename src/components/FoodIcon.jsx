// Hand-rolled flat SVG icon set for every food. One cohesive look instead of
// mismatched emoji. Every food in the catalog has its own entry in MAP and no
// two foods share a look: similar foods (berries, citrus, lettuces, herbs) get
// their own silhouette, and where a shape is reused (bell peppers, currants)
// the colours are far apart. Tiny, tree-shakeable, zero deps.
// Resolve with iconFor(food); render with <FoodIcon food={...} />.

const G = '#5cb974' // leaf green
const GD = '#3f9a58' // leaf green dark
const STEM = '#9c7b4d'
const PALE = '#f4f6e6' // white stalks / ribs

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
const hex = (r, g, b) => '#' + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1)
const rgb = (h) => {
  const n = parseInt(h.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

// darken a hex by ratio (for outlines / shading); negative ratio brightens
function shade(h, p) {
  const [r, g, b] = rgb(h)
  return hex(r * (1 - p), g * (1 - p), b * (1 - p))
}
// mix a hex towards white by ratio
function tint(h, p) {
  const [r, g, b] = rgb(h)
  return hex(r + (255 - r) * p, g + (255 - g) * p, b + (255 - b) * p)
}

const leaf = (x, y, flip) => (
  <path
    d={`M${x} ${y}c${flip ? '-' : ''}3 -3 ${flip ? '-' : ''}6 -2 ${flip ? '-' : ''}6 -2s0 4 ${flip ? '-' : ''}-4 4c-1 0-2 -1 -2 -2z`}
    fill={G}
  />
)
const stemTop = (x = 15) => <rect x={x} y="4" width="2.4" height="6" rx="1.2" fill={STEM} />

const n1 = (v) => Math.round(v * 10) / 10

// almond leaf from base (x1,y1) to tip (x2,y2); w = full width at the middle
const lf = (x1, y1, x2, y2, w, fill, key, vein) => {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const l = Math.hypot(dx, dy) || 1
  const px = (-dy / l) * w
  const py = (dx / l) * w
  return (
    <g key={key}>
      <path d={`M${x1} ${y1}Q${n1(mx + px)} ${n1(my + py)} ${x2} ${y2}Q${n1(mx - px)} ${n1(my - py)} ${x1} ${y1}z`} fill={fill} />
      {vein && <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={vein} strokeWidth="0.6" opacity=".7" />}
    </g>
  )
}

// serrated leaf: base (x,y), direction in degrees (0 = right, 90 = down)
const serr = (x, y, deg, len, w, fill, key, n = 5) => {
  const a = (deg * Math.PI) / 180
  const ca = Math.cos(a)
  const sa = Math.sin(a)
  const side = []
  for (let i = 1; i < n * 2; i++) {
    const t = i / (n * 2)
    side.push([t * len, Math.sin(Math.PI * Math.pow(t, 0.65)) * w * (i % 2 ? 1 : 0.68)])
  }
  const pts = [[0, 0], ...side, [len, 0], ...side.slice().reverse().map(([u, v]) => [u, -v])]
  const P = pts.map(([u, v]) => `${n1(x + u * ca - v * sa)},${n1(y + u * sa + v * ca)}`).join(' ')
  return (
    <g key={key}>
      <polygon points={P} fill={fill} stroke={shade(fill, 0.25)} strokeWidth="0.5" strokeLinejoin="round" />
      <line x1={x} y1={y} x2={n1(x + len * ca * 0.88)} y2={n1(y + len * sa * 0.88)} stroke={shade(fill, 0.32)} strokeWidth="0.6" opacity=".7" />
    </g>
  )
}

// glossy round berry
const ball = (x, y, r, c, key) => (
  <g key={key}>
    <circle cx={x} cy={y} r={r} fill={c} stroke={shade(c, 0.28)} strokeWidth="0.6" />
    <circle cx={x - r * 0.35} cy={y - r * 0.38} r={r * 0.26} fill="#fff" opacity=".35" />
  </g>
)

const star = (x, y, r, fill, key, n = 5) => {
  const pts = []
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 ? r * 0.42 : r
    pts.push(`${n1(x + Math.cos(a) * rr)},${n1(y + Math.sin(a) * rr)}`)
  }
  return <polygon key={key} points={pts.join(' ')} fill={fill} />
}

// union of circles ([x,y,r]) and paths (string) drawn as one outlined silhouette
const union = (parts, fill, key, sw = 1.2) => {
  const draw = (p, i, stroked) =>
    typeof p === 'string' ? (
      <path key={(stroked ? 's' : 'f') + i} d={p} fill={fill} stroke={stroked ? shade(fill, 0.24) : 'none'} strokeWidth={sw} strokeLinejoin="round" />
    ) : (
      <circle key={(stroked ? 's' : 'f') + i} cx={p[0]} cy={p[1]} r={p[2]} fill={fill} stroke={stroked ? shade(fill, 0.24) : 'none'} strokeWidth={sw} />
    )
  return (
    <g key={key}>
      {parts.map((p, i) => draw(p, i, true))}
      {parts.map((p, i) => draw(p, i, false))}
    </g>
  )
}

const ring = (cx, cy, r, n, rr, off = 0) =>
  Array.from({ length: n }).map((_, i) => {
    const a = (i / n) * Math.PI * 2 + off
    return [n1(cx + Math.cos(a) * r), n1(cy + Math.sin(a) * r), rr]
  })

const PEAR_D = 'M16 9c-1.4 0-2.2 1.2-2.2 3.2 0 2-4.3 3.4-4.3 9.3 0 5 3.2 8.2 6.5 8.2s6.5-3.2 6.5-8.2c0-5.9-4.3-7.3-4.3-9.3 0-2-.8-3.2-2.2-3.2z'
const FIG_D = 'M16 5c1 0 1.6 1 2 2.6.8 3 7 5.4 7 12 0 5-4 8.4-9 8.4s-9-3.4-9-8.4c0-6.6 6.2-9 7-12 .4-1.6 1-2.6 2-2.6z'
const GUAVA_D = 'M16 4.5c3 0 4 2.5 6 5 2.5 3 4.5 5.5 4.5 9.5 0 5.5-4.7 9-10.5 9S5.5 24.5 5.5 19c0-4 2-6.5 4.5-9.5 2-2.5 3-5 6-5z'
const scaleAt = (cx, cy, s) => `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`

// each shape: (c = main colour, a = accent colour) => svg children on a 32×32 grid
const SHAPES = {
  // ---- fruit ----
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
      <path d={PEAR_D} fill={c} />
      <ellipse cx="12.5" cy="20" rx="1.6" ry="2.6" fill="#fff" opacity=".25" />
    </>
  ),
  banana: (c) => (
    <g transform="translate(16 16) scale(1.28) translate(-16 -16.2)">
      <path d="M7 9c1 8 6 15 15 16 2 .2 3-.3 3-1.6 0-.8-.7-1.1-1.7-1.2C16 21 12 15 11 8.4 10.8 7.2 10.2 6.7 9 6.9 7.7 7.1 6.9 7.8 7 9z" fill={c} />
      <path d="M22.7 23.4c-6-1-10.4-6.4-11.6-13" fill="none" stroke={shade(c, 0.25)} strokeWidth="1.3" strokeLinecap="round" opacity=".6" />
      <path d="M8 8l1.8-1.2" stroke={shade(c, 0.4)} strokeWidth="2" strokeLinecap="round" />
    </g>
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
  // two small berries dangling from a forked stalk
  wildstrawberry: (c) => (
    <>
      <path d="M17 3c-1 4-6 4-7.5 8M17 3c1 3 4 4 5 6.5" fill="none" stroke={GD} strokeWidth="1.3" strokeLinecap="round" />
      {lf(17, 3.5, 26, 2.5, 4.5, G, 'l')}
      <path d="M9.5 11.5c-3.3 0-4.8 2-4.8 4.5 0 3.2 2.9 8 4.8 8s4.8-4.8 4.8-8c0-2.5-1.5-4.5-4.8-4.5z" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.5" />
      <path d="M5.3 12.6c1.3.9 2.7 1.2 4.2 1.2s2.9-.3 4.2-1.2c-.9-1.3-2.3-1.9-4.2-1.9s-3.3.6-4.2 1.9z" fill={G} />
      <path d="M22 10c-3.7 0-5.4 2.3-5.4 5.2 0 3.7 3.3 9.8 5.4 9.8s5.4-6.1 5.4-9.8c0-2.9-1.7-5.2-5.4-5.2z" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.5" />
      <path d="M17.3 11.2c1.4 1 3 1.4 4.7 1.4s3.3-.4 4.7-1.4C25.7 9.7 24.1 9 22 9s-3.7.7-4.7 2.2z" fill={G} />
      {[
        [8, 16.5],
        [11, 16.5],
        [9.5, 19.5],
        [20, 15.5],
        [24, 15.5],
        [22, 18.5],
        [20.8, 21.5],
        [23.4, 21.5],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.7" fill="#ffe9a8" />
      ))}
    </>
  ),
  cherry: (c) => (
    <>
      <path d="M18 4c-5 3-8.5 7-9.5 12M18 4c.5 4.5 2 8.5 4.5 11.5" fill="none" stroke={GD} strokeWidth="1.5" strokeLinecap="round" />
      {lf(18, 4.5, 27.5, 3.5, 5, G, 'l', GD)}
      <circle cx="9" cy="21.5" r="6.5" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.6" />
      <circle cx="22.5" cy="20.5" r="6.5" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.6" />
      <circle cx="6.8" cy="19.2" r="1.5" fill="#fff" opacity=".35" />
      <circle cx="20.3" cy="18.2" r="1.5" fill="#fff" opacity=".35" />
    </>
  ),
  // cut slice; a = flesh colour (defaults to a pale tint of the rind)
  citrus: (c, a) => (
    <>
      <circle cx="16" cy="17" r="11" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.8" />
      <circle cx="16" cy="17" r="9" fill="#fff8e6" />
      <circle cx="16" cy="17" r="8" fill={a || tint(c, 0.35)} />
      {Array.from({ length: 8 }).map((_, i) => {
        const t = (i / 8) * Math.PI * 2
        return <line key={i} x1="16" y1="17" x2={n1(16 + Math.cos(t) * 8.4)} y2={n1(17 + Math.sin(t) * 8.4)} stroke="#fff8e6" strokeWidth="1.1" />
      })}
      <circle cx="16" cy="17" r="1.3" fill="#fff8e6" />
      {leaf(19, 6)}
    </>
  ),
  // whole squat fruit with a leaf
  mandarin: (c) => (
    <>
      <ellipse cx="16" cy="19" rx="11.5" ry="9.5" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.8" />
      {[
        [12, 22],
        [17, 24.5],
        [21, 21],
        [23.5, 16.5],
        [15, 18],
        [8.5, 20.5],
        [19.5, 15],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.6" fill={shade(c, 0.25)} opacity=".6" />
      ))}
      {lf(16, 10.5, 26.5, 5, 6.5, G, 'l', GD)}
      {star(16, 10.6, 2.6, GD, 's')}
      <rect x="15.2" y="6" width="1.6" height="4" rx=".8" fill={STEM} />
      <ellipse cx="10" cy="16" rx="2.4" ry="3" fill="#fff" opacity=".3" />
    </>
  ),
  // peeled fruit: segments sitting in a curl of peel
  segments: (c) => (
    <>
      <circle cx="16" cy="15.5" r="10" fill={tint(c, 0.12)} stroke={shade(c, 0.22)} strokeWidth="0.7" />
      <path d="M16 5.5v20M16 5.5c-5 3-5.5 16 0 20M16 5.5c5 3 5.5 16 0 20M16 5.5C7 8 6.5 22 16 25.5M16 5.5c9 2.5 9.5 16.5 0 20" fill="none" stroke="#fff3d6" strokeWidth="1" opacity=".9" />
      <path d="M3.5 19c1 5.5 6 9.5 12.5 9.5S27.5 24.5 28.5 19c-2 3.5-6.5 5.5-12.5 5.5S5.5 22.5 3.5 19z" fill={shade(c, 0.12)} stroke={shade(c, 0.3)} strokeWidth="0.6" strokeLinejoin="round" />
      <ellipse cx="11.5" cy="11.5" rx="1.6" ry="2.6" fill="#fff" opacity=".3" />
    </>
  ),
  lemon: (c) => (
    <g transform="rotate(-20 16 17)">
      <path
        d="M4 17c1.5-1 2.5-1.5 3.5-3 2-4 5.5-6 9-6 4.5 0 8 2.5 9.5 6 .5 1 1.5 1.6 2.5 2-.3 1.2-1.5 1.6-2.5 2.6-1.5 4-5 6.4-9.5 6.4-3.5 0-7-2-9-6-.8-1.2-2-1.5-3.5-2z"
        fill={c}
        stroke={shade(c, 0.25)}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {[
        [12, 19],
        [16, 21],
        [20, 19],
        [18, 14],
        [22, 16],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.6" fill={shade(c, 0.25)} opacity=".6" />
      ))}
      <ellipse cx="12" cy="13" rx="3.2" ry="1.6" fill="#fff" opacity=".35" transform="rotate(-25 12 13)" />
      {lf(21, 9.5, 26.5, 5.5, 4.5, G, 'l', GD)}
    </g>
  ),
  // half-moon wedge
  wedge: (c) => (
    <g transform="rotate(-14 16 16) translate(0 1)">
      <path d="M4 11h24a12 12 0 0 1-24 0z" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M5.8 11.6h20.4a10.2 10.2 0 0 1-20.4 0z" fill="#fbfbe8" />
      <path d="M7 11.6h18a9 9 0 0 1-18 0z" fill={tint(c, 0.4)} />
      {[30, 60, 90, 120, 150].map((d, i) => {
        const t = (d * Math.PI) / 180
        return <line key={i} x1="16" y1="11.6" x2={n1(16 + Math.cos(t) * 9.2)} y2={n1(11.6 + Math.sin(t) * 9.2)} stroke="#fbfbe8" strokeWidth="1" />
      })}
    </g>
  ),
  // big whole citrus plus a thick-skinned wedge; a = flesh
  pomelo: (c, a) => (
    <>
      <path
        d="M14 4.5c2 0 3.2 1.3 4.6 2.8 3.2 2.8 5.4 6 5.4 10.2 0 5.2-4.4 8.8-10 8.8S4 22.7 4 17.5c0-4.2 2.2-7.4 5.4-10.2 1.4-1.5 2.6-2.8 4.6-2.8z"
        fill={c}
        stroke={shade(c, 0.22)}
        strokeWidth="0.8"
      />
      {[
        [9, 15],
        [12, 19],
        [8, 20],
        [15, 13],
        [12, 10.5],
        [17, 9.5],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.6" fill={shade(c, 0.25)} opacity=".55" />
      ))}
      {lf(14.5, 5, 22.5, 2.5, 4.5, G, 'l')}
      <g transform="rotate(-18 22 23)">
        <path d="M14.5 21h15a7.5 7.5 0 0 1-15 0z" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M15.6 21.5h12.8a6.4 6.4 0 0 1-12.8 0z" fill="#fffbe8" />
        <path d="M17.8 21.5h8.4a4.2 4.2 0 0 1-8.4 0z" fill={a || '#f0868c'} />
        <path d="M22 21.5v4M22 21.5l-2.8 2.9M22 21.5l2.8 2.9" stroke="#fffbe8" strokeWidth="0.8" />
      </g>
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
      <rect x="14.8" y="3.5" width="2.4" height="5" rx="1.2" fill={STEM} />
      <ellipse cx="16" cy="18" rx="11.5" ry="10" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.8" />
      <path d="M16 8v20M11 9c-2.5 5-2.5 13 0 18M21 9c2.5 5 2.5 13 0 18M7 12c-2 4-2 8 0 12M25 12c2 4 2 8 0 12" fill="none" stroke={tint(c, 0.6)} strokeWidth="1" opacity=".9" />
      <path d="M5.5 15c6 2 15 2 21 0M5.5 21c6 2 15 2 21 0" fill="none" stroke={tint(c, 0.6)} strokeWidth="0.7" opacity=".7" />
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
  // peach: round with a cleft; a = blush
  stonefruit: (c, a) => (
    <>
      {stemTop(15)}
      {leaf(17, 6)}
      <circle cx="16" cy="19" r="10" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.7" />
      {a && <path d="M17 9.5c5 .5 9 4.5 9 9.5 0 4.5-3 8.3-7.2 9.6 2.4-5.5 2.2-13-1.8-19.1z" fill={a} opacity=".55" />}
      <path d="M16 10c-2 4-2 14 0 18" fill="none" stroke={shade(c, 0.3)} strokeWidth="1" opacity=".5" />
      <ellipse cx="12" cy="16" rx="2" ry="3" fill="#fff" opacity=".28" />
    </>
  ),
  // nectarine: cut half with the stone; a = flesh
  halfstone: (c, a) => (
    <>
      {lf(17, 7, 26, 3, 5, G, 'l', GD)}
      <circle cx="16" cy="18" r="11" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.8" />
      <circle cx="16" cy="18" r="9.2" fill={a || '#f8cf6a'} />
      <circle cx="16" cy="18.3" r="5.6" fill={c} opacity=".3" />
      <ellipse cx="16" cy="18.4" rx="3.7" ry="4.9" fill="#8a4f2b" stroke="#6a3a1e" strokeWidth="0.6" />
      <path d="M15 15.5c-.8 2-.8 4 0 6M17.3 15.8c.6 1.6.6 3.6 0 5.2" fill="none" stroke="#5a3018" strokeWidth="0.7" strokeLinecap="round" />
    </>
  ),
  // a pair of small fruits
  apricot: (c) => (
    <>
      <path d="M17 9.5V6" stroke={STEM} strokeWidth="1.5" strokeLinecap="round" />
      {lf(17, 7.5, 26, 4, 5, G, 'l', GD)}
      <circle cx="21.5" cy="18" r="7.5" fill={shade(c, 0.1)} stroke={shade(c, 0.3)} strokeWidth="0.6" />
      <circle cx="12" cy="19.5" r="8.5" fill={c} stroke={shade(c, 0.24)} strokeWidth="0.7" />
      <path d="M13 11.2c-2 4-2 12.5 0 16.6" fill="none" stroke={shade(c, 0.3)} strokeWidth="0.9" opacity=".55" />
      <ellipse cx="8.5" cy="17" rx="1.7" ry="2.7" fill="#fff" opacity=".3" />
      <circle cx="15.5" cy="22" r="3.2" fill="#e8604a" opacity=".22" />
    </>
  ),
  plum: (c) => (
    <>
      <path d="M19 8c.5-2 1.5-3.5 3-4.5" fill="none" stroke={STEM} strokeWidth="1.5" strokeLinecap="round" />
      {lf(20, 6.5, 28, 7, 4.5, G, 'l', GD)}
      <g transform="rotate(22 16 18)">
        <ellipse cx="16" cy="18" rx="8.5" ry="10.5" fill={c} stroke={shade(c, 0.25)} strokeWidth="0.7" />
        <path d="M16.5 7.8c-2.5 5-2.5 15 0 20.4" fill="none" stroke={shade(c, 0.32)} strokeWidth="1" opacity=".6" />
        <ellipse cx="11.8" cy="14" rx="2" ry="4" fill="#fff" opacity=".3" />
      </g>
    </>
  ),
  kiwi: (c) => (
    <>
      <circle cx="16" cy="16" r="11" fill="#8a5a2b" />
      <circle cx="16" cy="16" r="9" fill={c} />
      <circle cx="16" cy="16" r="3.2" fill="#f4f4e0" />
      {Array.from({ length: 10 }).map((_, i) => {
        const t = (i / 10) * Math.PI * 2
        return <circle key={i} cx={n1(16 + Math.cos(t) * 6)} cy={n1(16 + Math.sin(t) * 6)} r="0.7" fill="#2f2f2f" />
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
  // cut teardrop: skin, pale rim, seedy flesh
  fig: (c) => (
    <>
      <rect x="15" y="2.5" width="2" height="4" rx="1" fill={GD} />
      <path d={FIG_D} fill={c} stroke={shade(c, 0.25)} strokeWidth="0.7" />
      <path d={FIG_D} fill="#f6e3c0" transform={scaleAt(16, 19, 0.8)} />
      <path d={FIG_D} fill="#d2556a" transform={scaleAt(16, 19.5, 0.62)} />
      {[
        [14, 18],
        [18, 18],
        [16, 15.5],
        [13.5, 21.5],
        [18.5, 21.5],
        [16, 20],
        [16, 23.5],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.7" fill="#ffe2a0" />
      ))}
    </>
  ),
  persimmon: (c) => (
    <>
      <path d="M16 9c-6.5 0-11 3.6-11 8.8 0 5.4 4.5 9.2 11 9.2s11-3.8 11-9.2C27 12.6 22.5 9 16 9z" fill={c} stroke={shade(c, 0.24)} strokeWidth="0.7" />
      <path d="M16 10.5l-7.5-3 3 5.2-5 1.8 6.3 1.2L16 19l3.2-3.3 6.3-1.2-5-1.8 3-5.2z" fill="#7a8f3a" stroke="#5c6e28" strokeWidth="0.5" strokeLinejoin="round" />
      <rect x="15" y="6.5" width="2" height="5" rx="1" fill={STEM} />
      <ellipse cx="9.5" cy="20.5" rx="1.8" ry="2.8" fill="#fff" opacity=".3" />
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
  // lengthwise half: a = skin, c = flesh, dark seeds in the hollow
  papaya: (c, a) => (
    <g transform="rotate(38 16 16)">
      <path
        d="M16 2.5c3 0 4.5 3 5.5 6.5 1.3 4.5 3 7.5 3 11.5 0 5.5-3.8 9-8.5 9s-8.5-3.5-8.5-9c0-4 1.7-7 3-11.5 1-3.5 2.5-6.5 5.5-6.5z"
        fill={a || '#a9c04a'}
        stroke={shade(a || '#a9c04a', 0.25)}
        strokeWidth="0.7"
      />
      <path d="M16 4.5c2.2 0 3.3 2.6 4.2 5.6 1.1 4 2.6 6.7 2.6 10.2 0 4.6-3 7.5-6.8 7.5s-6.8-2.9-6.8-7.5c0-3.5 1.5-6.2 2.6-10.2.9-3 2-5.6 4.2-5.6z" fill={c} />
      <ellipse cx="16" cy="19.5" rx="3.3" ry="6" fill={shade(c, 0.28)} />
      {[
        [15, 15.5],
        [17, 17],
        [15, 18.5],
        [17, 20.5],
        [15, 22],
        [16.6, 23.8],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#2f2a2a" />
      ))}
    </g>
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
  // cut half: skin c, flesh a, ring of seeds
  guava: (c, a) => (
    <>
      <rect x="15" y="2" width="2" height="3.5" rx="1" fill={STEM} />
      <path d={GUAVA_D} fill={c} stroke={shade(c, 0.24)} strokeWidth="0.8" />
      <path d={GUAVA_D} fill={a || '#f48a94'} transform={scaleAt(16, 18, 0.82)} />
      <circle cx="16" cy="19.5" r="5.4" fill={tint(a || '#f48a94', 0.35)} />
      {ring(16, 19.5, 3.4, 7, 0.85).map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff3d0" stroke="#d9a070" strokeWidth="0.35" />
      ))}
      <circle cx="16" cy="19.5" r="0.85" fill="#fff3d0" stroke="#d9a070" strokeWidth="0.35" />
    </>
  ),
  // cut half: dark rind c, pulp a, black seeds
  passionfruit: (c, a) => (
    <>
      <circle cx="16" cy="16.5" r="11.5" fill={c} stroke={shade(c, 0.3)} strokeWidth="0.8" />
      <circle cx="16" cy="16.5" r="9.6" fill="#f6ecd2" />
      <circle cx="16" cy="16.5" r="8.2" fill={a || '#f4b730'} />
      {[...ring(16, 16.5, 5.2, 8, 1), ...ring(16, 16.5, 2, 3, 1, 0.5)].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="1.15" ry="1.6" fill="#2b2230" transform={`rotate(${i * 47} ${x} ${y})`} />
      ))}
      <ellipse cx="11.5" cy="11.5" rx="1.5" ry="2.2" fill="#fff" opacity=".35" transform="rotate(40 11.5 11.5)" />
    </>
  ),
  // trio of round berries (aronia)
  berry: (c) => (
    <>
      {leaf(18, 5)}
      {ball(12, 17, 4.6, c, 1)}
      {ball(20.5, 17, 4.6, c, 2)}
      {ball(16, 23, 4.6, c, 3)}
      <path d="M16 6v6M16 12l-3.5 2M16 12l4 2" fill="none" stroke={STEM} strokeWidth="1" strokeLinecap="round" />
    </>
  ),
  // hanging raceme (red / black currant)
  currant: (c) => (
    <>
      {lf(9.5, 4.5, 21, 3, 5.5, G, 'l', GD)}
      <path d="M9 4c4 3 8 10 8.5 23" fill="none" stroke={STEM} strokeWidth="1.1" strokeLinecap="round" />
      {[
        [12, 10.5, 3.5],
        [19.5, 12, 3.5],
        [12.8, 17.2, 3.3],
        [20.3, 18.5, 3.2],
        [14.6, 23.3, 2.9],
        [20.5, 24.5, 2.5],
        [17, 28, 2],
      ].map(([x, y, r], i) => (
        <g key={i}>
          {ball(x, y, r, c)}
          <circle cx={x + r * 0.2} cy={y + r * 0.72} r="0.55" fill={shade(c, 0.5)} />
        </g>
      ))}
    </>
  ),
  // wild bilberry: leafy twig with two dark berries
  bilberry: (c) => (
    <>
      <path d="M4 8.5c7-2.5 16-2 24 1" fill="none" stroke={STEM} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 7.2c-.8 2-.8 3.5 0 5M21 7.5c.8 1.6.9 3 .4 4.5" fill="none" stroke={STEM} strokeWidth="0.9" />
      {lf(7, 7.6, 3, 3, 4.5, G, 'a')}
      {lf(14, 6.8, 13, 1.8, 4.5, GD, 'b')}
      {lf(18, 7, 22, 2.5, 4.5, G, 'c')}
      {lf(25, 8.5, 30, 6, 4, GD, 'd')}
      {ball(11, 19, 6.8, c, 1)}
      {ball(22, 18, 6, c, 2)}
      <circle cx="12" cy="23" r="2" fill={shade(c, 0.4)} />
      <circle cx="12" cy="23" r="1" fill={c} />
      <circle cx="22.8" cy="21.5" r="1.8" fill={shade(c, 0.4)} />
      <circle cx="22.8" cy="21.5" r="0.9" fill={c} />
    </>
  ),
  // highbush blueberry: cluster with star crowns
  blueberry: (c) => (
    <>
      {lf(14, 7.5, 23, 2.5, 5.5, G, 'l', GD)}
      {[
        [10.5, 13.5, 5.3],
        [21, 12.8, 5.4],
        [15.5, 21.5, 6],
        [25, 21, 4.4],
      ].map(([x, y, r], i) => (
        <g key={i}>
          {ball(x, y, r, c)}
          {star(x + r * 0.2, y + r * 0.25, r * 0.48, shade(c, 0.42))}
        </g>
      ))}
    </>
  ),
  gooseberry: (c) => (
    <>
      <path d="M16 8V4" stroke={STEM} strokeWidth="1.5" strokeLinecap="round" />
      {lf(16, 6, 25, 3.5, 5, G, 'l', GD)}
      <ellipse cx="16" cy="18" rx="9" ry="10" fill={c} stroke={shade(c, 0.26)} strokeWidth="0.7" />
      <path d="M16 8v20M12 9c-3 5-3 13 0 18M20 9c3 5 3 13 0 18M8.5 12.5c-1.5 3.5-1.5 7.5 0 11M23.5 12.5c1.5 3.5 1.5 7.5 0 11" fill="none" stroke={tint(c, 0.6)} strokeWidth="0.9" />
      <path d="M14.5 28l1.5 2.5 1.5-2.5z" fill="#7a5a34" />
      <ellipse cx="11" cy="13.5" rx="1.5" ry="2.5" fill="#fff" opacity=".35" />
    </>
  ),
  // two oval berries on thin arched stalks
  cranberry: (c) => (
    <>
      <path d="M3 7.5c7-2 17-2 26 1" fill="none" stroke={STEM} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 7c-1 2.5-1 4.5 0 7M17 6.5c-.8 4-.8 7.5 0 11M25.5 7.8c.8 1.8.8 3.3.2 5" fill="none" stroke="#b0705a" strokeWidth="0.9" />
      {lf(12, 6.4, 14, 1.8, 3.4, GD, 'a')}
      {lf(21, 6.6, 24.5, 2.5, 3.4, GD, 'b')}
      {lf(5, 7, 1.5, 3.5, 3.2, GD, 'c')}
      {lf(28, 8.4, 31, 12, 3, GD, 'd')}
      {[
        [8, 18.5, 4.8, 5.4],
        [17, 23, 5, 5.6],
        [25.5, 17.5, 4.5, 5],
      ].map(([x, y, rx, ry], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={c} stroke={shade(c, 0.28)} strokeWidth="0.6" />
          <ellipse cx={x - rx * 0.4} cy={y - ry * 0.4} rx="1.1" ry="1.8" fill="#fff" opacity=".35" />
        </g>
      ))}
    </>
  ),
  // glossy evergreen leaves over a tight bunch of small berries
  lingon: (c) => (
    <>
      {lf(16, 13, 5, 8, 6.5, GD, 'a', G)}
      {lf(16, 13, 27, 8, 6.5, GD, 'b', G)}
      {lf(16, 13, 11, 2.5, 5.5, G, 'c', GD)}
      {lf(16, 13, 21, 2.5, 5.5, G, 'd', GD)}
      {[
        [10.5, 18, 3.6],
        [21.5, 18, 3.6],
        [16, 17, 3.6],
        [13, 23.5, 3.6],
        [19, 23.5, 3.6],
        [16, 28, 2.6],
      ].map(([x, y, r], i) => ball(x, y, r, c, i))}
    </>
  ),
  // flat-topped cluster on branching stalks (viburnum / elderberry); a = stalks
  umbel: (c, a) => (
    <>
      <path
        d="M16 30v-7M16 24L7.5 17M16 24l-4-10M16 23l1.5-10M16 24l7-8M16 24l10.5-4M16 24l-3 -3M16 24l3.5-3.5"
        fill="none"
        stroke={a || STEM}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      {[
        [6.5, 15.5, 3.3],
        [11.5, 10.5, 3.4],
        [18, 9, 3.4],
        [24, 12.5, 3.3],
        [27, 18.5, 3],
        [12.5, 17, 3.2],
        [19.5, 16.5, 3.3],
      ].map(([x, y, r], i) => ball(x, y, r, c, i))}
    </>
  ),
  // feather leaf plus a bunch of berries
  rowan: (c) => (
    <>
      <path d="M3 14C8 9 14 6 22 4" fill="none" stroke={GD} strokeWidth="1.1" strokeLinecap="round" />
      {[
        [6.5, 11.2],
        [10.5, 8.6],
        [14.5, 6.6],
        [18.5, 5],
      ].map(([x, y], i) => (
        <g key={i}>
          {lf(x, y, x - 2.2, y - 4.2, 3, G, 'u')}
          {lf(x, y, x + 3.4, y + 4.4, 3, G, 'd')}
        </g>
      ))}
      {lf(22, 4, 27.5, 2.5, 3, G, 't')}
      <path d="M20 9v6" stroke={STEM} strokeWidth="1" />
      {[
        [14, 18.5, 3.4],
        [20.5, 16.5, 3.4],
        [26, 19.5, 3.3],
        [17, 24, 3.4],
        [23, 24.5, 3.4],
        [11.5, 24.5, 3],
      ].map(([x, y, r], i) => (
        <g key={i}>
          {ball(x, y, r, c)}
          <circle cx={x + 0.4} cy={y + 1.2} r="0.6" fill={shade(c, 0.5)} />
        </g>
      ))}
    </>
  ),
  // honeysuckle: long oblong berries with a waxy bloom
  haskap: (c) => (
    <>
      <path d="M4 7.5c8-1.5 16-1.5 24 0" fill="none" stroke={STEM} strokeWidth="1.4" strokeLinecap="round" />
      {lf(11, 7, 3.5, 2.5, 5, G, 'a', GD)}
      {lf(20, 7, 28.5, 2.5, 5, G, 'b', GD)}
      <rect x="6.5" y="9" width="7.4" height="18" rx="3.7" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.6" transform="rotate(7 10 18)" />
      <rect x="17.5" y="8.5" width="8" height="20.5" rx="4" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.6" transform="rotate(-6 21.5 18)" />
      <rect x="8" y="11.5" width="1.8" height="10" rx=".9" fill="#fff" opacity=".35" transform="rotate(7 10 18)" />
      <rect x="19.2" y="11" width="2" height="12" rx="1" fill="#fff" opacity=".35" transform="rotate(-6 21.5 18)" />
    </>
  ),
  // three berries hanging on long stalks, crowns at the bottom
  saskatoon: (c) => (
    <>
      <path d="M16 4C12 6 9 8 8.5 11M16 4c.3 4 .3 8 .3 11M16 4c4 2 7 4 7.8 7" fill="none" stroke={STEM} strokeWidth="1.1" strokeLinecap="round" />
      {lf(16, 4.5, 6, 3, 6, G, 'l', GD)}
      {[
        [8.5, 15.5, 5],
        [16.3, 21, 5.6],
        [24.2, 15.5, 5],
      ].map(([x, y, r], i) => (
        <g key={i}>
          {ball(x, y, r, c)}
          {star(x, y + r - 0.9, 2.3, shade(c, 0.5))}
        </g>
      ))}
    </>
  ),
  // twig packed with small oval berries and narrow silvery leaves
  seabuckthorn: (c) => (
    <>
      {lf(13, 21, 3, 17, 2.8, '#8fb07a', 'a')}
      {lf(18, 15, 8, 8, 2.8, '#8fb07a', 'b')}
      {lf(15, 19, 26, 24, 2.8, '#a3bf8c', 'c')}
      {lf(21, 12, 30, 15, 2.8, '#a3bf8c', 'd')}
      {lf(24, 8, 29, 2.5, 2.6, '#8fb07a', 'e')}
      <path d="M5 28L26 6" stroke="#8a6a44" strokeWidth="1.7" strokeLinecap="round" />
      {[
        [7.5, 23.5],
        [10.5, 27],
        [11.5, 19.5],
        [14.5, 23.5],
        [15, 15.5],
        [18.5, 19.5],
        [18.5, 11.5],
        [22, 15.5],
        [22, 8],
      ].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="2.6" ry="3" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.5" transform={`rotate(45 ${x} ${y})`} />
          <circle cx={x - 0.8} cy={y - 0.9} r="0.7" fill="#fff" opacity=".45" />
        </g>
      ))}
    </>
  ),
  raspberry: (c) => (
    <>
      <path d="M16 9.5V5" stroke={GD} strokeWidth="1.4" strokeLinecap="round" />
      {lf(16, 6, 25, 3.5, 5, G, 'l', GD)}
      <path d="M11 9.5c1.5 1 3.2 1.4 5 1.4s3.5-.4 5-1.4c-1.2-1.3-2.9-2-5-2s-3.8.7-5 2z" fill={GD} />
      <path d="M16 9c-4.5 0-7.5 3.5-7.5 8 0 4 3.5 9.5 7.5 9.5s7.5-5.5 7.5-9.5c0-4.5-3-8-7.5-8z" fill={shade(c, 0.18)} />
      {[
        [14, 11.5],
        [18, 11.5],
        [11.5, 15],
        [16, 15],
        [20.5, 15],
        [12, 19],
        [16, 19.5],
        [20, 19],
        [14, 23],
        [18, 23],
        [16, 26],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.4" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.5" />
      ))}
      <circle cx="13.3" cy="10.8" r="0.8" fill="#fff" opacity=".4" />
      <circle cx="10.8" cy="14.3" r="0.8" fill="#fff" opacity=".4" />
    </>
  ),
  // long drupelet cluster on a stalk
  mulberry: (c) => (
    <g transform="rotate(18 16 16)">
      <path d="M16 7V2.5" stroke={GD} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="16" cy="18" rx="6.2" ry="10.5" fill={shade(c, 0.2)} />
      {[
        [14.3, 9.8],
        [17.7, 9.8],
        [12.4, 13],
        [16, 13],
        [19.6, 13],
        [14, 16.5],
        [18, 16.5],
        [12.2, 19.8],
        [16, 20],
        [19.8, 19.8],
        [14, 23.3],
        [18, 23.3],
        [16, 26.5],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill={c} stroke={shade(c, 0.3)} strokeWidth="0.5" />
      ))}
      <circle cx="13.7" cy="9.2" r="0.7" fill="#fff" opacity=".45" />
      <circle cx="11.8" cy="12.4" r="0.7" fill="#fff" opacity=".4" />
    </g>
  ),
  // golden berry in its papery husk; a = husk
  physalis: (c, a) => {
    const h = a || '#e3c88e'
    return (
      <>
        <path d="M16 6V2.5" stroke={STEM} strokeWidth="1.4" strokeLinecap="round" />
        {lf(16, 19, 3.5, 8, 9.5, h, 'a', shade(h, 0.25))}
        {lf(16, 19, 28.5, 8, 9.5, h, 'b', shade(h, 0.25))}
        {lf(16, 20, 16, 3.5, 10, tint(h, 0.2), 'c', shade(h, 0.25))}
        {ball(16, 21, 8, c, 'o')}
        {lf(9, 25, 3.5, 29.5, 4, h, 'd', shade(h, 0.25))}
        {lf(23, 25, 28.5, 29.5, 4, h, 'e', shade(h, 0.25))}
      </>
    )
  },
  rosehip: (c) => (
    <>
      <path d="M16 8V2.5" stroke={STEM} strokeWidth="1.5" strokeLinecap="round" />
      {lf(16, 5.5, 25, 3, 4.5, G, 'l', GD)}
      <path d="M12 23l-3 6.5 4.5-3.2L16 31l2.5-4.7 4.5 3.2-3-6.5z" fill="#5f6b3a" />
      <ellipse cx="16" cy="16" rx="7.8" ry="9.5" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.7" />
      <ellipse cx="12.5" cy="12.5" rx="1.6" ry="3" fill="#fff" opacity=".35" transform="rotate(15 12.5 12.5)" />
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
  // three long glossy fruits with caps
  dates: (c) => (
    <>
      {[
        [9.5, 17.5, -16],
        [16.5, 15.5, 4],
        [23, 18, 20],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <rect x={x - 3.6} y={y - 8} width="7.2" height="16" rx="3.6" fill={c} stroke={shade(c, 0.3)} strokeWidth="0.6" />
          <rect x={x - 1.3} y={y - 9.4} width="2.6" height="2.4" rx=".8" fill="#d9b070" />
          <rect x={x - 2.1} y={y - 5} width="1.3" height="8" rx=".65" fill="#fff" opacity=".28" />
          <path d={`M${x + 1} ${y - 4}c.8 2 .8 5 0 8`} fill="none" stroke={shade(c, 0.35)} strokeWidth="0.6" />
        </g>
      ))}
    </>
  ),
  // scatter of small wrinkled drops
  raisins: (c) => (
    <>
      {[
        [9.5, 10.5, -25, 1.25],
        [18.5, 8.5, 30, 1.15],
        [25, 15, -10, 1.2],
        [15, 17, 60, 1.3],
        [8, 21, 15, 1.2],
        [21.5, 23.5, -40, 1.3],
        [14, 26, 80, 1.05],
      ].map(([x, y, r, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <path d="M0-3.8c2 0 3.1 1.7 3.1 3.7S1.8 3.6 0 3.6-3.1 1.9-3.1-.1-2-3.8 0-3.8z" fill={c} stroke={shade(c, 0.35)} strokeWidth="0.5" />
          <path d="M-1.3-1.8c.9.9.9 2.5 0 3.5M1.1-2.2c.7 1.1.6 2.8-.2 3.9" fill="none" stroke={tint(c, 0.3)} strokeWidth="0.55" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  // two big dark wrinkled ovals
  prune: (c) => (
    <>
      {[
        [12, 12.5, -22, 7.8, 6],
        [19.5, 21, 14, 8.6, 6.4],
      ].map(([x, y, r, rx, ry], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={c} stroke={shade(c, 0.4)} strokeWidth="0.7" />
          <path
            d={`M${x - 5} ${y - 1}c2-2 4-2 5.5 0s3.5 1.5 5-.5M${x - 4} ${y + 2.6}c2-1.2 4-1 5 .2M${x - 1} ${y - 3.6}c1.5-.8 3-.6 4 .4`}
            fill="none"
            stroke={tint(c, 0.28)}
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <ellipse cx={x - rx * 0.45} cy={y - ry * 0.45} rx="1.8" ry="1" fill="#fff" opacity=".3" />
        </g>
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
  // wide shoulders, long thin tip, short cut tops
  parsnip: (c) => (
    <g transform="rotate(-28 16 16)">
      <path d="M14 7.5V4M16 7V3M18 7.5V4" stroke={GD} strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M16 7c4.2 0 6.8 2 6.8 5 0 4-3.5 7.5-5 11.5-.7 1.9-1.2 4-1.8 7.5-.6-3.5-1.1-5.6-1.8-7.5-1.5-4-5-7.5-5-11.5 0-3 2.6-5 6.8-5z"
        fill={c}
        stroke={shade(c, 0.25)}
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path d="M11.5 12.5h4M17 16h3.5M12.8 19h3M16.2 22.5h2" stroke={shade(c, 0.3)} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  ),
  // long thick white root with a leafy tuft
  daikon: (c) => (
    <g transform="rotate(30 16 16)">
      {lf(15, 7, 10, 2.5, 4, G, 'a')}
      {lf(16, 7, 16, 2, 4, GD, 'b')}
      {lf(17, 7, 22, 2.5, 4, G, 'c')}
      <path
        d="M11.5 9c0-1.7 2-2.6 4.5-2.6s4.5.9 4.5 2.6v11.5c0 3.5-1.8 6.5-3.4 8.8-.5.8-1.7.8-2.2 0-1.6-2.3-3.4-5.3-3.4-8.8z"
        fill={c}
        stroke={shade(c, 0.24)}
        strokeWidth="0.8"
      />
      <path d="M11.5 9c0-1.7 2-2.6 4.5-2.6s4.5.9 4.5 2.6c-1.5 1-7.5 1-9 0z" fill="#cfe6a6" />
      <path d="M12 13.5h3.5M17 17h3M12.3 20.5h2.5M16.5 24h2" stroke={shade(c, 0.22)} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  ),
  root: (c) => (
    <>
      <path d="M11 6c1 2 3 3 5 3s4-1 5-3c-1 3-3 4-5 4s-4-1-5-4z" fill={G} />
      <path d="M16 9c-5 0-8 4-8 8s3 8 8 8 8-4 8-8-3-8-8-8z" fill={c} stroke={shade(c, 0.2)} strokeWidth="0.6" />
      <ellipse cx="12.5" cy="15" rx="1.8" ry="2.6" fill="#fff" opacity=".22" />
    </>
  ),
  // dark bulb with a tail and red-stemmed leaves
  beetroot: (c) => (
    <>
      <path d="M16 12V5M14.5 12C13.5 9 12 7 10 6M17.5 12c1-3 2.5-5 4.5-6" fill="none" stroke={tint(c, 0.15)} strokeWidth="1.5" strokeLinecap="round" />
      {lf(10.5, 7, 5, 2.5, 5, GD, 'a', tint(c, 0.2))}
      {lf(16, 6.5, 16, 0.8, 5, G, 'b', tint(c, 0.2))}
      {lf(21.5, 7, 27, 2.5, 5, GD, 'c', tint(c, 0.2))}
      <path
        d="M16 11c5.5 0 9.5 3.4 9.5 8 0 4.4-4 7-7.5 8-.8.3-1.3 1.4-2 3.5-.7-2.1-1.2-3.2-2-3.5-3.5-1-7.5-3.6-7.5-8 0-4.6 4-8 9.5-8z"
        fill={c}
        stroke={shade(c, 0.28)}
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path d="M9 21.5c4 2.5 10 2.5 14 0M10.5 24.5c3.5 1.5 7.5 1.5 11 0" fill="none" stroke={tint(c, 0.25)} strokeWidth="0.8" opacity=".8" />
      <ellipse cx="11.5" cy="16" rx="1.8" ry="2.6" fill="#fff" opacity=".25" />
    </>
  ),
  // flat round yellow turnip with a long tail
  turnip: (c) => (
    <>
      {lf(15, 10.5, 9, 3, 4.5, G, 'a', GD)}
      {lf(16, 10.5, 16.5, 1.5, 4.5, GD, 'b', G)}
      {lf(17, 10.5, 24, 3.5, 4.5, G, 'c', GD)}
      <path
        d="M16 10c6.8 0 11.5 3.2 11.5 7.6 0 4-4.4 6.6-8.5 7.6-1.3.3-2 1.8-3 5.3-1-3.5-1.7-5-3-5.3-4.1-1-8.5-3.6-8.5-7.6C4.5 13.2 9.2 10 16 10z"
        fill={c}
        stroke={shade(c, 0.25)}
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path d="M7 19.5c5 2.5 13 2.5 18 0" fill="none" stroke={shade(c, 0.22)} strokeWidth="0.8" opacity=".6" />
      <ellipse cx="10.5" cy="15" rx="2.6" ry="1.6" fill="#fff" opacity=".35" />
    </>
  ),
  // round bulb, purple shoulders (a) over a creamy bottom (c), cut stalks
  rutabaga: (c, a) => (
    <>
      <path d="M13 9.5l-1-4.5M16 9V3.5M19 9.5l1-4.5" stroke="#8fb86a" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 8.5c6 0 10.5 4.2 10.5 9.6 0 4.9-4 8.3-8 9.3-1.3.3-1.8 1.3-2.5 3.6-.7-2.3-1.2-3.3-2.5-3.6-4-1-8-4.4-8-9.3C5.5 12.7 10 8.5 16 8.5z" fill={c} stroke={shade(c, 0.26)} strokeWidth="0.7" strokeLinejoin="round" />
      <path d="M16 8.5c6 0 10.5 4.2 10.5 9.6 0 .4 0 .8-.1 1.2-3.2-1.6-6.7-2.4-10.4-2.4s-7.2.8-10.4 2.4c-.1-.4-.1-.8-.1-1.2C5.5 12.7 10 8.5 16 8.5z" fill={a || '#8f5a9a'} />
      <ellipse cx="11" cy="13" rx="2.2" ry="1.4" fill="#fff" opacity=".3" />
    </>
  ),
  // pale bulb with leaf stalks sprouting from top and sides
  kohlrabi: (c) => (
    <>
      <path d="M16 12V6.5M10 15C8 12 6.5 10 6 7.5M22 15c2-3 3.5-5 4-7.5M12.5 12.5C12 10 11.5 8 11.5 6.5M19.5 12.5c.5-2.5 1-4.5 1-6" fill="none" stroke={shade(c, 0.18)} strokeWidth="1.5" strokeLinecap="round" />
      {lf(6, 8.5, 2.5, 3, 4.6, GD, 'a')}
      {lf(11.5, 7, 10, 1.5, 4.2, G, 'b')}
      {lf(16, 7, 16.5, 1, 4.6, GD, 'c')}
      {lf(20.5, 7, 22, 1.5, 4.2, G, 'd')}
      {lf(26, 8.5, 29.5, 3, 4.6, GD, 'e')}
      <ellipse cx="16" cy="20.5" rx="9.5" ry="8.5" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.7" />
      <path d="M16 29v1.4" stroke={shade(c, 0.3)} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 13.5c-2.2 4-2.2 10 0 14M20 13.5c2.2 4 2.2 10 0 14M16 12.5v16" fill="none" stroke={shade(c, 0.26)} strokeWidth="0.8" strokeLinecap="round" opacity=".55" />
      <ellipse cx="11" cy="16.5" rx="2" ry="1.3" fill="#fff" opacity=".35" />
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
    <g transform="translate(16 16) scale(1.3) translate(-17 -15.5)">
      <path d="M8 15c0-4 4-7 9-7s9 2 9 6c0 5-4 9-10 9-5 0-8-3-8-8z" fill={c} stroke={shade(c, 0.18)} strokeWidth="0.6" />
      {[
        [12, 13],
        [18, 12],
        [20, 18],
        [13, 19],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.8" fill={shade(c, 0.25)} />
      ))}
    </g>
  ),
  // spindle tuber, pointed at both ends
  sweetpotato: (c) => (
    <>
      {lf(3, 26, 29, 6, 15, shade(c, 0.24), 'o')}
      {lf(4, 25.2, 28, 6.8, 13.4, c, 'i')}
      <path d="M10 18.5l2.5.8M15 13l2.5 1M19.5 15.5l2 .8M13 21.5l2 .6M22 10l1.8.8" stroke={shade(c, 0.32)} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="12" cy="15.5" rx="3.2" ry="1.2" fill="#fff" opacity=".3" transform="rotate(-38 12 15.5)" />
    </>
  ),
  // knobby tuber
  sunchoke: (c) => (
    <>
      {union(
        [
          [12.5, 18.5, 6.8],
          [19.5, 15.5, 6.2],
          [23, 22, 4.4],
          [9, 11.5, 3.8],
          [24.5, 9.5, 3.4],
          [15, 25.5, 3.4],
          [6.5, 22, 2.8],
        ],
        c,
      )}
      <path d="M8 17c2 2.5 5 3 8 2M16.5 11.5c2 2 5 2.5 7.5 1.5M20.5 20.5c1 1.6 3 2.4 5 2M7.5 9.8c1 1.4 2.5 1.8 3.8 1.4" fill="none" stroke={shade(c, 0.28)} strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="24.5" cy="8" r="1.1" fill="#b07a9a" />
      <circle cx="8.2" cy="9.8" r="1" fill="#b07a9a" />
      <ellipse cx="10.5" cy="16" rx="2" ry="1.2" fill="#fff" opacity=".35" />
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
    <g transform="rotate(28 16 16)">
      <rect x="12" y="3" width="8" height="26" rx="4" fill={c} stroke={shade(c, 0.26)} strokeWidth="0.7" />
      <path d="M14.5 6.5v19M17.5 6.5v19" stroke={shade(c, 0.22)} strokeWidth="0.7" strokeLinecap="round" opacity=".7" />
      {[
        [13.4, 9],
        [16, 11.5],
        [18.6, 9.5],
        [13.4, 15.5],
        [16, 18],
        [18.6, 15],
        [13.4, 22],
        [16, 24.5],
        [18.6, 21.5],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.65" fill={tint(c, 0.6)} />
      ))}
    </g>
  ),
  // club shape: thick blossom end, stalk stub, pale flecks
  zucchini: (c) => (
    <g transform="rotate(38 16 16)">
      <path d="M26.5 13.8h2.8c.8 0 1.3.5 1.3 1.2v2c0 .7-.5 1.2-1.3 1.2h-2.8z" fill="#9db868" stroke="#7a9648" strokeWidth="0.5" />
      <path
        d="M2.5 16c0-3.8 2.8-6 6.5-5.8 5.5.3 11 1.3 15.5 2.2 1.7.4 2.6 1.8 2.6 3.6s-.9 3.2-2.6 3.6c-4.5.9-10 1.9-15.5 2.2-3.7.2-6.5-2-6.5-5.8z"
        fill={c}
        stroke={shade(c, 0.28)}
        strokeWidth="0.7"
      />
      <path d="M5 13.5h3M10 13.8h4M16.5 14.5h3M6 18.5h4M12.5 18.2h3M18.5 17.5h3M4.5 16h2M9 16h3.5M15 16.2h4" stroke={tint(c, 0.5)} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  ),
  // scalloped flying-saucer squash
  pattypan: (c) => (
    <>
      {union([...ring(16, 19, 9, 11, 3.5).map(([x, y, r]) => [x, n1(19 + (y - 19) * 0.6), r]), 'M7 19a9 5.5 0 1 0 18 0a9 5.5 0 1 0 -18 0z'], c)}
      <ellipse cx="16" cy="17.3" rx="7.5" ry="4.3" fill={tint(c, 0.4)} stroke={shade(c, 0.16)} strokeWidth="0.5" />
      <rect x="14.8" y="11" width="2.4" height="5.5" rx="1.2" fill="#8fae5a" />
      <ellipse cx="11" cy="16.5" rx="2" ry="1" fill="#fff" opacity=".5" />
    </>
  ),
  // bell-shaped butternut squash
  butternut: (c) => (
    <>
      <rect x="14.6" y="2.5" width="2.8" height="4.5" rx="1.2" fill="#8a7a4a" />
      <path
        d="M16 5.5c2.6 0 4 1.6 4 4.4 0 3 .8 4.6 2.6 6.6 1.6 1.8 2.9 4 2.9 6.5 0 4.4-4.2 7-9.5 7s-9.5-2.6-9.5-7c0-2.5 1.3-4.7 2.9-6.5C11.2 14.5 12 12.9 12 9.9c0-2.8 1.4-4.4 4-4.4z"
        fill={c}
        stroke={shade(c, 0.25)}
        strokeWidth="0.7"
      />
      <path d="M16 7c-1 6-1 17 0 22.5M19.5 16.5c1.6 3.5 1.6 8.5 0 12" fill="none" stroke={shade(c, 0.22)} strokeWidth="0.8" opacity=".55" />
      <ellipse cx="11.5" cy="21" rx="1.8" ry="3.4" fill="#fff" opacity=".3" />
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
  // creamy curd cupped by green leaves
  cauliflower: (c) => (
    <>
      {lf(8, 27, 2.5, 10, 8, GD, 'a', G)}
      {lf(24, 27, 29.5, 10, 8, GD, 'b', G)}
      {union(
        [
          [10.5, 14.5, 4.4],
          [16, 10.5, 4.8],
          [21.5, 14.5, 4.4],
          [13, 19, 4.4],
          [19, 19, 4.4],
          [16, 15, 4],
        ],
        c,
        'u',
        1,
      )}
      <path d="M12 12.5c1 1 2 1 3 0M17.5 9.5c1 .8 2 .8 3-.2M17.5 17c1 .8 2 .8 3 0M11 18.5c.8.8 1.8.8 2.6 0" fill="none" stroke={shade(c, 0.2)} strokeWidth="0.7" strokeLinecap="round" />
      <path d="M5 19c2 6 6 9.5 11 9.5s9-3.5 11-9.5c-3 1.5-5 4-6.5 6.5h-9C10 23 8 20.5 5 19z" fill={G} stroke={GD} strokeWidth="0.6" strokeLinejoin="round" />
    </>
  ),
  cabbage: (c) => (
    <>
      <circle cx="16" cy="17" r="11" fill={c} stroke={shade(c, 0.22)} strokeWidth="0.7" />
      <path d="M16 6c4 2 6 6 6 11s-2 9-6 11M16 6c-4 2-6 6-6 11s2 9 6 11M6 17c3-1.5 7-2 10-2s7 .5 10 2" fill="none" stroke={shade(c, 0.28)} strokeWidth="0.9" opacity=".6" />
      <ellipse cx="16" cy="17" rx="3" ry="4" fill={shade(c, -0.15)} opacity=".5" />
    </>
  ),
  // cross-section with the white swirl (red cabbage)
  cabbagecut: (c) => (
    <>
      <circle cx="16" cy="16.5" r="11.5" fill={c} stroke={shade(c, 0.3)} strokeWidth="0.8" />
      <path
        d="M16 20c-3.5-1-5.5-4-5-8M16 20c3.5-1 5.5-4 5-8M13 24c-5-2-7.5-7-6.5-12.5M19 24c5-2 7.5-7 6.5-12.5M16 16.5c-1.5-1.6-2-3.8-1.4-6M16 16.5c1.5-1.6 2-3.8 1.4-6M9.5 8.5c2-2 4-3 6.5-3s4.5 1 6.5 3"
        fill="none"
        stroke={tint(c, 0.82)}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path d="M14.3 28l1.7-9 1.7 9z" fill={tint(c, 0.85)} />
    </>
  ),
  // crinkled head with wavy outer leaves
  savoy: (c) => (
    <>
      {union([...ring(16, 17, 8.4, 10, 3.9), [16, 17, 9]], c)}
      <circle cx="16" cy="17" r="8" fill={tint(c, 0.22)} />
      <path
        d="M16 26V8.5M16 22.5l-6-4.5M16 22.5l6-4.5M16 17.5l-5.5-5M16 17.5l5.5-5M16 13l-3-3M16 13l3-3M12.5 20l-3.5 1M19.5 20l3.5 1M12.8 15l-3.8-.5M19.2 15l3.8-.5"
        fill="none"
        stroke={tint(c, 0.72)}
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </>
  ),
  // three little heads
  brussels: (c) => (
    <>
      {[
        [9.5, 12.5, 6.5],
        [22.5, 13, 6.3],
        [16, 22.5, 7],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={c} stroke={shade(c, 0.28)} strokeWidth="0.7" />
          <path
            d={`M${x - r * 0.1} ${y - r}c${r * 0.9} ${r * 0.5} ${r * 0.9} ${r * 1.5} 0 ${r * 2}M${x + r * 0.1} ${y - r}c${-r * 0.9} ${r * 0.5} ${-r * 0.9} ${r * 1.5} 0 ${r * 2}`}
            fill="none"
            stroke={shade(c, 0.26)}
            strokeWidth="0.7"
          />
          <ellipse cx={x} cy={y + r * 0.1} rx={r * 0.3} ry={r * 0.55} fill={tint(c, 0.45)} />
          <rect x={x - 1.3} y={y + r - 0.8} width="2.6" height="1.6" rx=".6" fill={tint(c, 0.6)} stroke={shade(c, 0.2)} strokeWidth="0.4" />
        </g>
      ))}
    </>
  ),
  // generic single leaf (category fallback)
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
  // open pod showing a row of peas
  peapod: (c) => (
    <>
      <path d="M26.5 8.5c1.5-1.5 2.5-3 2.5-5" fill="none" stroke={GD} strokeWidth="1.4" strokeLinecap="round" />
      {lf(3.5, 25, 28, 7.5, 15, shade(c, 0.26), 'o')}
      {lf(4.4, 24.3, 27.2, 8.2, 13.4, c, 'p')}
      {lf(6.5, 23, 25.5, 9.5, 8, shade(c, 0.34), 'i')}
      {[
        [9.8, 20.6, 2.5],
        [13.6, 17.9, 2.9],
        [17.7, 15, 2.9],
        [21.6, 12.2, 2.5],
      ].map(([x, y, r], i) => ball(x, y, r, tint(c, 0.28), i))}
    </>
  ),
  // slim curved pods (green beans)
  beans: (c) => (
    <>
      {['M5 22C10 16 17 9 27 5', 'M5.5 27.5C12 23 20 16 28 13.5', 'M12 28.5c5-1.5 11-4 16.5-8'].map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={shade(c, 0.3)} strokeWidth="4.2" strokeLinecap="round" />
          <path d={d} fill="none" stroke={i === 1 ? tint(c, 0.12) : c} strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <path d="M9 18.5c3.5-4 8-8 13-10.5M10 24.2c4-3 9-6.5 14-8.5" fill="none" stroke="#fff" strokeWidth="0.7" strokeLinecap="round" opacity=".35" />
    </>
  ),
  // ridged tapered pod with a cap, plus a star-shaped slice
  okra: (c) => (
    <>
      <g transform="rotate(-24 13 16)">
        <rect x="12" y="2" width="2" height="3.5" rx="1" fill="#7a8a4a" />
        <path d="M9.5 8.5c0-.8.6-1.4 1.4-1.4h4.2c.8 0 1.4.6 1.4 1.4 0 6.5-1 14-3.5 20.5-2.5-6.5-3.5-14-3.5-20.5z" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.7" strokeLinejoin="round" />
        <path d="M11.5 8.5c0 6 .5 13 1.5 19M14.5 8.5c0 6-.5 13-1.5 19" fill="none" stroke={shade(c, 0.24)} strokeWidth="0.7" />
        <path d="M8.8 8.8c0-2.4 1.8-3.8 4.2-3.8s4.2 1.4 4.2 3.8z" fill={shade(c, 0.24)} />
      </g>
      <g transform="translate(23.5 22.5)">
        <polygon points="0,-6 5.7,-1.9 3.5,4.9 -3.5,4.9 -5.7,-1.9" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.7" strokeLinejoin="round" />
        <polygon points="0,-4.3 4.1,-1.3 2.5,3.5 -2.5,3.5 -4.1,-1.3" fill={tint(c, 0.6)} />
        {ring(0, 0, 2.3, 5, 0.75, -Math.PI / 2).map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#fff8e0" stroke={shade(c, 0.2)} strokeWidth="0.3" />
        ))}
      </g>
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
  // three scallions: small white bulbs, long green tubes
  greenonion: (c) => (
    <>
      {[
        ['M6 27.5L11 20', 'M11 20L20 4', 6, 27.5],
        ['M11.5 28L15.5 21', 'M15.5 21L25.5 5.5', 11.5, 28],
        ['M17 28.5L20 22.5', 'M20 22.5L29 10', 17, 28.5],
      ].map(([w, g, bx, by], i) => (
        <g key={i}>
          <path d={g} fill="none" stroke={shade(c, 0.28)} strokeWidth="3.4" strokeLinecap="round" />
          <path d={g} fill="none" stroke={i === 1 ? tint(c, 0.15) : c} strokeWidth="2.3" strokeLinecap="round" />
          <path d={w} fill="none" stroke="#b9c2a0" strokeWidth="4.4" strokeLinecap="round" />
          <path d={w} fill="none" stroke={PALE} strokeWidth="3.3" strokeLinecap="round" />
          <path d={`M${bx - 1} ${by + 1.2}l-1.2 1.3M${bx} ${by + 1.6}l-.2 1.4M${bx + 1} ${by + 1.4}l.7 1.1`} stroke="#c9b48a" strokeWidth="0.6" strokeLinecap="round" />
        </g>
      ))}
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
  fennel: () => (
    <>
      <path d="M11 6c1 3 3 4 5 4s4-1 5-4M13 5c0 3 1 4 3 5M19 5c0 3-1 4-3 5" fill="none" stroke={G} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 14c0-2 3-3 6-3s6 1 6 3c0 6-3 11-6 11s-6-5-6-11z" fill="#eef2e0" stroke={shade('#eef2e0', 0.14)} strokeWidth="0.5" />
      <path d="M13 13c1 5 1 9 0 11M19 13c-1 5-1 9 0 11" fill="none" stroke="#d7e0bf" strokeWidth="0.9" />
    </>
  ),
  rhubarb: (c) => (
    <>
      {union(
        [
          [18.5, 8.5, 5.5],
          [12.5, 7, 3.2],
          [16.5, 4.5, 3.2],
          [21.5, 4.5, 3.2],
          [25.5, 7.5, 3.2],
          [25, 12, 3],
          [13, 11.5, 3],
        ],
        G,
      )}
      <path d="M18 13l-4-4M18 13l1-6M18.5 13l5-3.5" stroke={tint(c, 0.25)} strokeWidth="0.8" strokeLinecap="round" />
      {['M8 27.5L16.5 12', 'M14.5 28.5L19 13'].map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={shade(c, 0.3)} strokeWidth="5" strokeLinecap="round" />
          <path d={d} fill="none" stroke={i ? tint(c, 0.12) : c} strokeWidth="3.8" strokeLinecap="round" />
          <path d={d} fill="none" stroke={tint(c, 0.45)} strokeWidth="0.7" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),

  // ---- greens ----
  // upright head, leaves opening at the top, pale ribs
  romaine: (c) => (
    <>
      <path d="M16 29.5C9.5 27 6.5 20 7.5 12c.4-3.4 1.8-6 3.7-7.5 1 5.5 3 10.5 4.8 14z" fill={shade(c, 0.12)} stroke={shade(c, 0.3)} strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M16 29.5c6.5-2.5 9.5-9.5 8.5-17.5-.4-3.4-1.8-6-3.7-7.5-1 5.5-3 10.5-4.8 14z" fill={shade(c, 0.12)} stroke={shade(c, 0.3)} strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M16 2.5c3.2 3.2 5 8.5 5 14.5 0 5-1.8 9.8-5 12.5-3.2-2.7-5-7.5-5-12.5 0-6 1.8-11.3 5-14.5z" fill={c} stroke={shade(c, 0.26)} strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M16 29V7M10 25.5C9 20 9.5 13 11 8M22 25.5c1-5.5.5-12.5-1-17.5" fill="none" stroke="#eef6d6" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 13l-2.5-2.5M16 13l2.5-2.5M16 18l-3-3M16 18l3-3M16 23l-3-3M16 23l3-3" stroke="#eef6d6" strokeWidth="0.7" strokeLinecap="round" opacity=".8" />
    </>
  ),
  // ruffled fan of a loose leaf; a = colour of the base (red-leaf lettuce is green below)
  frilly: (c, a) => (
    <>
      {union(
        [
          [6.3, 15, 3.6],
          [7.8, 10, 3.6],
          [11.5, 6.6, 3.6],
          [16.2, 5.6, 3.6],
          [20.8, 6.8, 3.6],
          [24.4, 10.2, 3.6],
          [25.7, 15, 3.6],
          'M4.5 15.5h23c-.8 6-4.8 11.5-11.5 14-6.7-2.5-10.7-8-11.5-14z',
          [16, 14, 8],
        ],
        c,
      )}
      <path d="M16 29.5c-4.5-1.8-7.6-5.2-9.3-9.8 3 1.3 6.1 2 9.3 2s6.3-.7 9.3-2c-1.7 4.6-4.8 8-9.3 9.8z" fill={a || tint(c, 0.4)} />
      <path d="M16 28.5V9M16 28.5C13 22 10.5 16 8 11.5M16 28.5c3-6.5 5.5-12.5 8-17M16 28.5C14.5 21 13 14 12 8M16 28.5c1.5-7.5 3-14.5 4-20.5" fill="none" stroke={tint(a || c, 0.7)} strokeWidth="0.8" strokeLinecap="round" opacity=".85" />
    </>
  ),
  // loose rosette seen from above
  butterhead: (c) => (
    <>
      {union(ring(16, 16.5, 6.3, 6, 5.6, 0.3).concat([[16, 16.5, 7]]), c)}
      {union(ring(16, 16.5, 3.6, 5, 4, 0.9).concat([[16, 16.5, 4]]), tint(c, 0.25), 'm', 1)}
      {union(ring(16, 16.5, 1.5, 3, 2.3, 0.2), tint(c, 0.5), 'i', 0.9)}
    </>
  ),
  // halved head: dome of tight pale layers
  iceberg: (c) => (
    <>
      <path d="M3.5 23.5a12.5 13 0 0 1 25 0c0 1.7-1.2 2.8-2.8 2.8H6.3c-1.6 0-2.8-1.1-2.8-2.8z" fill={c} stroke={shade(c, 0.3)} strokeWidth="0.8" />
      <path d="M6 24a10 10.5 0 0 1 20 0z" fill={tint(c, 0.4)} />
      <path d="M8.5 24a7.5 8 0 0 1 15 0M11 24a5 5.5 0 0 1 10 0M13.3 24a2.7 3 0 0 1 5.4 0M6 24a10 10.5 0 0 1 20 0" fill="none" stroke={shade(c, 0.3)} strokeWidth="0.8" />
      <path d="M14.5 26.3l1.5-4.3 1.5 4.3z" fill="#fbfbee" stroke={shade(c, 0.25)} strokeWidth="0.4" />
    </>
  ),
  // belgian endive: pale torpedo bud with yellow-green tips (a)
  endive: (c, a) => (
    <g transform="rotate(20 16 16)">
      <path d="M16 2.5c4.2 4.2 6.8 10.5 6.8 16.5 0 5.5-2.6 10.5-6.8 10.5S9.2 24.5 9.2 19c0-6 2.6-12.3 6.8-16.5z" fill={c} stroke={shade(c, 0.3)} strokeWidth="0.8" />
      <path d="M16 2.5c2.6 2.6 4.6 6 5.8 9.8-1.8-1.4-3.8-1.6-5.8-.3-2-1.3-4-1.1-5.8.3 1.2-3.8 3.2-7.2 5.8-9.8z" fill={a || '#cfe05a'} />
      <path d="M16 12c-1.6 5-1.6 12 0 17.5M12.5 14c-1.6 4-1.8 9-.5 13.5M19.5 14c1.6 4 1.8 9 .5 13.5" fill="none" stroke={shade(c, 0.24)} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  ),
  // bunch of three spade-shaped leaves
  spinach: (c) => {
    const d = 'M0 0C-6-2-7.5-8-5-11.5-3.5-13.6-1.5-14.5 0-15c1.5.5 3.5 1.4 5 3.5C7.5-8 6-2 0 0z'
    const one = (x, y, r, s, f, k) => (
      <g key={k} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
        <path d="M0 0v7" stroke={tint(c, 0.35)} strokeWidth="1.6" strokeLinecap="round" />
        <path d={d} fill={f} stroke={shade(f, 0.28)} strokeWidth="0.6" strokeLinejoin="round" />
        <path d="M0 0v-12M0-4l-3-2.5M0-4l3-2.5M0-8l-2.5-2M0-8l2.5-2" stroke={tint(c, 0.4)} strokeWidth="0.6" strokeLinecap="round" fill="none" />
      </g>
    )
    return (
      <>
        {one(14.5, 21.5, -42, 0.95, shade(c, 0.1), 'a')}
        {one(17.5, 21.5, 42, 0.95, shade(c, 0.1), 'b')}
        {one(16, 21, 0, 1.2, c, 'c')}
      </>
    )
  },
  // long curly-edged leaf on a thick pale stalk
  kale: (c) => (
    <>
      {union(
        [
          [16, 5.5, 3.3],
          [11.5, 7, 3.3],
          [20.5, 7, 3.3],
          [9, 11.5, 3.3],
          [23, 11.5, 3.3],
          [8.5, 16.5, 3.3],
          [23.5, 16.5, 3.3],
          [10, 21.5, 3.2],
          [22, 21.5, 3.2],
          [13, 25, 2.6],
          [19, 25, 2.6],
          'M10 7h12v17l-6 3-6-3z',
        ],
        c,
      )}
      <path d="M14.9 30.5L15.5 9h1l.6 21.5z" fill="#d6e8b8" />
      <path d="M16 23l-5-3M16 23l5-3M16 18l-5.5-3.5M16 18l5.5-3.5M16 13l-4.5-3.5M16 13l4.5-3.5" stroke="#d6e8b8" strokeWidth="0.8" strokeLinecap="round" opacity=".85" />
    </>
  ),
  // crinkled leaf with a thick coloured stalk and veins (a)
  chard: (c, a) => {
    const s = a || '#e8426a'
    return (
      <>
        {union(
          [
            [16, 12.5, 8.5],
            [16, 5.6, 3.6],
            [11.5, 6.6, 3.2],
            [20.5, 6.6, 3.2],
            [8.6, 10, 3.4],
            [23.4, 10, 3.4],
            [7.6, 15, 3.4],
            [24.4, 15, 3.4],
            [9.6, 19.6, 3.3],
            [22.4, 19.6, 3.3],
            [13, 22, 2.8],
            [19, 22, 2.8],
          ],
          c,
        )}
        <path d="M14 30.5h4L16.9 8.5c0-.6-.4-1-.9-1s-.9.4-.9 1z" fill={s} stroke={shade(s, 0.25)} strokeWidth="0.4" />
        <path d="M16 21l-6-4M16 21l6-4M16 16l-5.5-4.5M16 16l5.5-4.5M16 11.5l-3-3.5M16 11.5l3-3.5" stroke={s} strokeWidth="0.9" strokeLinecap="round" />
      </>
    )
  },
  // long leaf with backward-pointing teeth
  dandelion: (c) => (
    <g transform="rotate(22 16 16)">
      <polygon
        points="16,1.5 19.8,6.5 17.8,7 23,11.8 18.8,12.3 24,17.5 19,17.8 22.5,22.8 17.8,22.3 17.2,30 14.8,30 14.2,22.3 9.5,22.8 13,17.8 8,17.5 13.2,12.3 9,11.8 14.2,7 12.2,6.5"
        fill={c}
        stroke={shade(c, 0.3)}
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path d="M16 4v25.5" stroke={tint(c, 0.6)} strokeWidth="1.1" strokeLinecap="round" />
    </g>
  ),
  // broad leaf with parallel veins plus the seed spike
  plantain: (c) => (
    <>
      <path d="M24.5 30c0-7 .5-13 .5-17" fill="none" stroke={shade(c, 0.25)} strokeWidth="1.1" strokeLinecap="round" />
      <rect x="23.2" y="2.5" width="3.6" height="11" rx="1.8" fill="#a3925c" stroke="#7d6e40" strokeWidth="0.5" />
      <path d="M24 5h2M24 7.5h2M24 10h2" stroke="#7d6e40" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M12.5 25v5.5" stroke={shade(c, 0.2)} strokeWidth="2" strokeLinecap="round" />
      <path d="M12.5 4c5.5 3.2 8 8.2 8 13S17.3 25.5 12.5 25.5 4.5 21.8 4.5 17s2.5-9.8 8-13z" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.7" strokeLinejoin="round" />
      <path d="M12.5 25V5M12.5 25C9 20 9 10.5 12.5 5M12.5 25c3.5-5 3.5-14.5 0-20M12.5 25C5.5 21 6 11 12.5 5M12.5 25c7-4 6.5-14 0-20" fill="none" stroke={tint(c, 0.55)} strokeWidth="0.8" strokeLinecap="round" />
    </>
  ),
  // deeply lobed leaf
  arugula: (c) => (
    <g transform="rotate(-20 16 16)">
      {union(
        [
          [16, 7.5, 5],
          'M14.2 8h3.6v22.5h-3.6z',
          'M15 13.5c-2-2.5-5-3.5-8-2.5 0 3 3 5.5 8 5.5zM17 13.5c2-2.5 5-3.5 8-2.5 0 3-3 5.5-8 5.5z',
          'M15 19c-1.8-2-4.2-2.8-7-2 .2 2.8 2.8 4.8 7 4.6zM17 19c1.8-2 4.2-2.8 7-2-.2 2.8-2.8 4.8-7 4.6z',
          'M15 24c-1.4-1.5-3.2-2-5.3-1.4.3 2.2 2.3 3.6 5.3 3.4zM17 24c1.4-1.5 3.2-2 5.3-1.4-.3 2.2-2.3 3.6-5.3 3.4z',
        ],
        c,
        'u',
        1.1,
      )}
      <path d="M16 5v25M16 15l-5-1.5M16 15l5-1.5M16 20.5l-4.5-1.2M16 20.5l4.5-1.2" stroke={tint(c, 0.55)} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  ),
  // thin stems carrying small round leaves
  watercress: (c) => (
    <>
      <path d="M16 30.5C15 24 16 16 16 9M16 23c-2.5 0-5.5-1.5-7-4.5M16 20c2.5 0 5.5-1.5 7-4M16 14c-2 0-4.5-1.5-6.5-4M16 13c2-.5 4.5-2 6-4.5" fill="none" stroke={shade(c, 0.22)} strokeWidth="1.2" strokeLinecap="round" />
      {[
        [16, 6.3, 4.2],
        [8, 17, 4],
        [24, 15, 4],
        [8.5, 8.5, 3.6],
        [23, 7.5, 3.4],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={c} stroke={shade(c, 0.28)} strokeWidth="0.6" />
          <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.3} fill="#fff" opacity=".3" />
        </g>
      ))}
    </>
  ),
  // white spoon stalks, dark round leaves
  bokchoy: (c) => (
    <>
      <ellipse cx="9.5" cy="9.5" rx="5.2" ry="6.8" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.6" transform="rotate(-22 9.5 9.5)" />
      <ellipse cx="22.5" cy="9.5" rx="5.2" ry="6.8" fill={c} stroke={shade(c, 0.28)} strokeWidth="0.6" transform="rotate(22 22.5 9.5)" />
      <ellipse cx="16" cy="8" rx="5.2" ry="6.2" fill={tint(c, 0.14)} stroke={shade(c, 0.28)} strokeWidth="0.6" />
      <path d="M14.5 30c-4.5-.5-7.2-3.3-6.7-7.5.4-3.5 2.5-5.8 3.4-9.5l3.3 1c-.8 5.5-.8 10.5 0 16z" fill={PALE} stroke="#b9c2a0" strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M17.5 30c4.5-.5 7.2-3.3 6.7-7.5-.4-3.5-2.5-5.8-3.4-9.5l-3.3 1c.8 5.5.8 10.5 0 16z" fill={PALE} stroke="#b9c2a0" strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M13.3 30c-1-5.5-1-11 .5-16.5h4.4c1.5 5.5 1.5 11 .5 16.5z" fill="#fbfcf2" stroke="#b9c2a0" strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M16 15v13" stroke="#d5dcc0" strokeWidth="0.8" strokeLinecap="round" />
    </>
  ),
  // big round paddle leaf with thick pale ribs
  collard: (c) => (
    <g transform="rotate(14 16 16)">
      <path d="M16 3c6.5 0 11 4.5 11 10.5S22.5 24.5 16 24.5 5 19.5 5 13.5 9.5 3 16 3z" fill={c} stroke={shade(c, 0.3)} strokeWidth="0.7" />
      <path d="M14.7 30.5L15.4 6h1.2l.7 24.5z" fill="#e2eecd" />
      <path d="M16 20l-7-3M16 20l7-3M16 15l-7.5-4M16 15l7.5-4M16 10l-4.5-3.5M16 10l4.5-3.5" stroke="#e2eecd" strokeWidth="1" strokeLinecap="round" />
    </g>
  ),
  // turnip tops: lobed leaves over a small white-and-purple bulb
  turniptops: (c) => (
    <>
      <path d="M15 22L8 7M16 22V5M17 22l7-15" stroke={tint(c, 0.35)} strokeWidth="1.3" strokeLinecap="round" />
      {union(
        [
          [7.5, 6.5, 3.6],
          [9.6, 11, 2.9],
          [11.6, 15, 2.2],
          [24.5, 6.5, 3.6],
          [22.4, 11, 2.9],
          [20.4, 15, 2.2],
        ],
        shade(c, 0.1),
        's',
        1,
      )}
      {union(
        [
          [16, 5, 3.9],
          [16, 10, 3.1],
          [16, 14.3, 2.4],
        ],
        c,
        'c',
        1,
      )}
      <path d="M16 20.5c3.8 0 6.3 1.7 6.3 4.2 0 2-2.5 3.3-4.6 3.7-.6.2-1 .7-1.7 2.1-.7-1.4-1.1-1.9-1.7-2.1-2.1-.4-4.6-1.7-4.6-3.7 0-2.5 2.5-4.2 6.3-4.2z" fill="#f8f3e4" stroke="#c9bf9f" strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M10 23.8c.9-2 3.1-3.3 6-3.3s5.1 1.3 6 3.3c-1.9.8-3.9 1.2-6 1.2s-4.1-.4-6-1.2z" fill="#b77ac0" />
    </>
  ),
  // beet tops: smooth leaves with red stalks and veins (a) over a small beet
  beettops: (c, a) => {
    const s = a || '#c22e5a'
    return (
      <>
        {lf(14.5, 19, 5, 3.5, 9, shade(c, 0.1), 'a')}
        {lf(17.5, 19, 27, 3.5, 9, shade(c, 0.1), 'b')}
        {lf(16, 19, 16, 1.5, 9.5, c, 'c')}
        <path d="M15.3 23L6.5 6M16 23V3.5M16.7 23L25.5 6" stroke={s} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M16 12l-2.5-2.5M16 12l2.5-2.5M16 8l-2-2M16 8l2-2M10.5 13.5l-2.8-.5M10.5 13.5l.5-3M21.5 13.5l2.8-.5M21.5 13.5l-.5-3" stroke={s} strokeWidth="0.7" strokeLinecap="round" />
        <path d="M16 21.5c4 0 6.5 1.8 6.5 4.2 0 1.8-2.6 3-4.6 3.2-.8.1-1.3.4-1.9 1.6-.6-1.2-1.1-1.5-1.9-1.6-2-.2-4.6-1.4-4.6-3.2 0-2.4 2.5-4.2 6.5-4.2z" fill={shade(s, 0.22)} stroke={shade(s, 0.45)} strokeWidth="0.6" strokeLinejoin="round" />
      </>
    )
  },
  // feathery fronds growing from an orange carrot shoulder
  carrottops: (c) => (
    <>
      {[
        [16, 25, 7, 5, -1],
        [16, 25, 16, 2.5, 0],
        [16, 25, 25, 5, 1],
      ].map(([x1, y1, x2, y2], i) => {
        const barbs = []
        for (let k = 1; k <= 6; k++) {
          const t = k / 7
          const px = x1 + (x2 - x1) * t
          const py = y1 + (y2 - y1) * t
          const dx = x2 - x1
          const dy = y2 - y1
          const l = Math.hypot(dx, dy)
          const ux = dx / l
          const uy = dy / l
          const len = 4.2 * (1 - t * 0.45)
          barbs.push(`M${n1(px)} ${n1(py)}l${n1((ux * 0.6 - uy) * len * 0.7)} ${n1((uy * 0.6 + ux) * len * 0.7)}M${n1(px)} ${n1(py)}l${n1((ux * 0.6 + uy) * len * 0.7)} ${n1((uy * 0.6 - ux) * len * 0.7)}`)
        }
        return (
          <g key={i}>
            <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={shade(c, 0.2)} strokeWidth="1.2" strokeLinecap="round" />
            <path d={barbs.join('')} stroke={i === 1 ? c : shade(c, 0.1)} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        )
      })}
      <path d="M10.5 30.5c0-3.5 2.3-6 5.5-6s5.5 2.5 5.5 6z" fill="#f0913e" stroke="#c9712a" strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M13 28h2.5M17.5 29.5h2" stroke="#c9712a" strokeWidth="0.7" strokeLinecap="round" />
    </>
  ),
  // frilled leaf with little yellow four-petal flowers
  mustard: (c) => (
    <>
      <path d="M13 21C16 15 20 10 24.5 7" fill="none" stroke={shade(c, 0.25)} strokeWidth="1" strokeLinecap="round" />
      {union(
        [
          [11.5, 19.5, 7],
          [11.5, 11.5, 3.2],
          [7.3, 13.3, 3.2],
          [4.8, 17.5, 3.2],
          [5, 22.5, 3.2],
          [8, 26.3, 3.2],
          [12.5, 27.3, 3.2],
          [16.5, 25, 3.2],
          [18.3, 20.5, 3.2],
          [16.5, 14.5, 3.2],
        ],
        c,
      )}
      <path d="M11.5 29V12M11.5 23l-4-2.5M11.5 23l4-2.5M11.5 18l-3.5-2.5M11.5 18l3.5-2.5" stroke={tint(c, 0.6)} strokeWidth="0.9" strokeLinecap="round" />
      {[
        [24.5, 7, 1.9],
        [20, 4.8, 1.5],
        [28, 12, 1.5],
      ].map(([x, y, r], i) => (
        <g key={i}>
          {[
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ].map(([dx, dy], j) => (
            <circle key={j} cx={x + dx * r} cy={y + dy * r} r={r} fill="#f6d23a" stroke="#d9a81e" strokeWidth="0.35" />
          ))}
          <circle cx={x} cy={y} r={r * 0.55} fill="#e09a1e" />
        </g>
      ))}
    </>
  ),
  // upright stem, big drooping saw-toothed leaves
  nettle: (c) => (
    <>
      <path d="M16 30.5V5" stroke={shade(c, 0.3)} strokeWidth="1.4" strokeLinecap="round" />
      {serr(16, 17.5, 30, 12.5, 5.4, c, 'a', 6)}
      {serr(16, 17.5, 150, 12.5, 5.4, c, 'b', 6)}
      {serr(16, 9.5, 12, 9, 4, tint(c, 0.1), 'c', 5)}
      {serr(16, 9.5, 168, 9, 4, tint(c, 0.1), 'd', 5)}
      {serr(16, 7, -90, 5, 2.4, tint(c, 0.2), 'e', 3)}
    </>
  ),
  // trefoil
  clover: (c) => {
    const d = 'M0 0C-7-3.5-7.5-11-3-11.5-1.3-11.7-.3-10.6 0-9.5 .3-10.6 1.3-11.7 3-11.5 7.5-11 7-3.5 0 0z'
    return (
      <>
        <path d="M16 15c1.5 5 3 10 6.5 15" fill="none" stroke={shade(c, 0.25)} strokeWidth="1.5" strokeLinecap="round" />
        {[0, 120, 240].map((r, i) => (
          <g key={i} transform={`translate(16 15) rotate(${r})`}>
            <path d={d} fill={i ? c : tint(c, 0.08)} stroke={shade(c, 0.3)} strokeWidth="0.7" strokeLinejoin="round" />
            <path d="M-3.3-6.8Q0-3.8 3.3-6.8" fill="none" stroke={tint(c, 0.6)} strokeWidth="1.1" strokeLinecap="round" />
          </g>
        ))}
      </>
    )
  },
  // arrow-shaped leaf on a long stalk
  sorrel: (c) => (
    <g transform="rotate(-16 16 16)">
      <path d="M16 20v10.5" stroke={shade(c, 0.22)} strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M16 2c4.2 5 6.8 10 6.8 15 0 2.2.6 4.3 2.2 6.5-3.2 0-5.4-.9-7-2.5h-4c-1.6 1.6-3.8 2.5-7 2.5 1.6-2.2 2.2-4.3 2.2-6.5 0-5 2.6-10 6.8-15z"
        fill={c}
        stroke={shade(c, 0.3)}
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path d="M16 5v16M16 20l-5 2M16 20l5 2M16 15l-3.5-2.5M16 15l3.5-2.5M16 10.5l-2.5-2M16 10.5l2.5-2" stroke={tint(c, 0.6)} strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </g>
  ),
  // compound toothed leaf with a little tomato on the vine
  tomatoleaf: (c) => (
    <>
      <path d="M4.5 29.5C8 22 13 14 19.5 6.5M8 23c5-1 10-1 14.5-2.5" fill="none" stroke={shade(c, 0.2)} strokeWidth="1.2" strokeLinecap="round" />
      {serr(19.5, 6.5, -52, 6.5, 3, c, 'a', 4)}
      {serr(16, 11, -150, 8, 3.2, c, 'b', 4)}
      {serr(16.5, 10.5, 5, 8, 3.2, c, 'c', 4)}
      {serr(11, 18, -165, 8, 3.4, shade(c, 0.08), 'd', 4)}
      {serr(12, 17, 0, 7, 3, shade(c, 0.08), 'e', 4)}
      <circle cx="24" cy="24" r="5" fill="#e0483f" stroke="#b03028" strokeWidth="0.6" />
      {star(24, 19.8, 2.6, GD, 's')}
      <circle cx="22.3" cy="22.5" r="1.2" fill="#fff" opacity=".35" />
    </>
  ),
  // three seedlings: seed, pale stem, pair of seed leaves
  sprouts: (c) => (
    <>
      {[
        [7.5, 2, -1],
        [16, -3, 1],
        [24.5, 1, -1],
      ].map(([x, h, k], i) => (
        <g key={i}>
          <path d={`M${x} 26C${x - 3 * k} 21 ${x + 3 * k} 16 ${x} ${11 + h}`} fill="none" stroke={shade(c, 0.3)} strokeWidth="2.6" strokeLinecap="round" />
          <path d={`M${x} 26C${x - 3 * k} 21 ${x + 3 * k} 16 ${x} ${11 + h}`} fill="none" stroke={tint(c, 0.7)} strokeWidth="1.6" strokeLinecap="round" />
          <ellipse cx={x} cy="27.3" rx="3" ry="2.1" fill="#c9a060" stroke="#9a7438" strokeWidth="0.5" />
          {lf(x, 11 + h, x - 5.5, 6.5 + h, 5, c, 'l')}
          {lf(x, 11 + h, x + 5.5, 6.5 + h, 5, shade(c, 0.1), 'r')}
        </g>
      ))}
    </>
  ),
  // barrel head: broad white ribs, crinkly pale leaves
  napa: (c) => (
    <>
      {union(
        [
          'M16 5c5.5 0 8.5 4.5 8.5 11.5S21 30 16 30 7.5 23.5 7.5 16.5 10.5 5 16 5z',
          [10.5, 6.5, 3.3],
          [16, 4.8, 3.3],
          [21.5, 6.5, 3.3],
          [7.8, 11, 3],
          [24.2, 11, 3],
          [7, 16, 2.6],
          [25, 16, 2.6],
        ],
        c,
      )}
      <path d="M16 29.8c-2-6.5-2-15 0-21.8 2 6.8 2 15.3 0 21.8z" fill="#fdfdf2" stroke="#c5cfa2" strokeWidth="0.5" strokeLinejoin="round" />
      <path d="M13.5 29c-4.5-5-5.5-11.5-4-17.5 3 5 4.5 11 4 17.5zM18.5 29c4.5-5 5.5-11.5 4-17.5-3 5-4.5 11-4 17.5z" fill="#fdfdf2" stroke="#c5cfa2" strokeWidth="0.5" strokeLinejoin="round" />
      <path d="M11 8.5c1 .8 2 .8 3 0M18 8.5c1 .8 2 .8 3 0" fill="none" stroke={shade(c, 0.25)} strokeWidth="0.7" strokeLinecap="round" />
    </>
  ),
  // timothy grass: stems topped with cylindrical seed heads
  timothy: (c) => (
    <>
      {lf(15.5, 27, 26, 17, 3.2, c, 'a')}
      {lf(9.5, 28, 3, 19, 3.2, shade(c, 0.1), 'b')}
      <path d="M9.5 30.5C9.5 23 8.5 17 9 12M16 30.5V10M22.5 30.5c0-8 1-14 .5-18" fill="none" stroke={shade(c, 0.2)} strokeWidth="1.2" strokeLinecap="round" />
      {[
        [9, 4, 10],
        [16, 1.5, 11.5],
        [23, 4.5, 9.5],
      ].map(([x, y, h], i) => (
        <g key={i}>
          <rect x={x - 2.1} y={y} width="4.2" height={h} rx="2.1" fill={tint(c, 0.18)} stroke={shade(c, 0.34)} strokeWidth="0.6" />
          {Array.from({ length: Math.floor(h / 2) }).map((_, j) => (
            <path key={j} d={`M${x - 1.4} ${y + 2 + j * 2}l1.4 .8 1.4-.8`} fill="none" stroke={shade(c, 0.3)} strokeWidth="0.5" />
          ))}
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

  // ---- herbs ----
  // generic sprig (category fallback)
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
  // flat fan-shaped leaves with pointed lobes on thin stems
  cilantro: (c) => {
    const d = 'M0 0C-3.5-1-6.5-3.5-6-7l1.9 1L-3.6-9.6l2.4 1.7L0-11.2l1.2 3.3 2.4-1.7.5 3.6L6-7C6.5-3.5 3.5-1 0 0z'
    return (
      <>
        <path d="M16 30.5V13M16 26c-2.5-2.5-4.5-5.5-5.5-9.5M16 26c2.5-2.5 4.5-5.5 5.5-9.5M16 22c-2-2-3.5-4-4.5-6.5M16 22c2-2 3.5-4 4.5-6.5" fill="none" stroke={shade(c, 0.22)} strokeWidth="1.1" strokeLinecap="round" />
        {[
          [10.5, 16.5, -32, 0.78],
          [21.5, 16.5, 32, 0.78],
          [16, 13.5, 0, 0.95],
          [11.5, 23, -60, 0.7],
          [20.5, 23, 60, 0.7],
        ].map(([x, y, r, s], i) => (
          <path key={i} d={d} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} fill={i === 2 ? tint(c, 0.1) : c} stroke={shade(c, 0.3)} strokeWidth="0.6" strokeLinejoin="round" />
        ))}
      </>
    )
  },
  // curly parsley: tight ruffled clumps on forked stems
  parsley: (c) => (
    <>
      <path d="M16 30.5V17M16 24C13 22 10.5 19 9.5 15M16 24c3-2 5.5-5 6.5-9" fill="none" stroke={shade(c, 0.1)} strokeWidth="1.3" strokeLinecap="round" />
      {[
        [9, 12, 1],
        [23, 12, 1],
        [16, 9.5, 1.15],
      ].map(([x, y, s], i) => (
        <g key={i}>
          {union(
            [
              [x, y, 2.9 * s],
              [x - 3 * s, y + 1.2 * s, 2.5 * s],
              [x + 3 * s, y + 1.2 * s, 2.5 * s],
              [x - 1.9 * s, y - 2.6 * s, 2.5 * s],
              [x + 1.9 * s, y - 2.6 * s, 2.5 * s],
              [x, y + 3 * s, 2.3 * s],
            ].map((p) => p.map(n1)),
            i === 2 ? c : shade(c, 0.1),
            'u',
            1,
          )}
          <path d={`M${n1(x - 2.5 * s)} ${n1(y - 1.2 * s)}c${n1(0.8 * s)} ${n1(0.8 * s)} ${n1(1.6 * s)} ${n1(0.8 * s)} ${n1(2.4 * s)} 0M${n1(x + 0.4 * s)} ${n1(y + 1.6 * s)}c${n1(0.8 * s)} ${n1(0.8 * s)} ${n1(1.6 * s)} ${n1(0.8 * s)} ${n1(2.4 * s)} 0`} fill="none" stroke={shade(c, 0.32)} strokeWidth="0.6" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  // four big glossy cupped leaves
  basil: (c) => (
    <>
      <path d="M16 18v12.5" stroke={shade(c, 0.25)} strokeWidth="1.6" strokeLinecap="round" />
      {lf(16, 19, 2.5, 13, 12, shade(c, 0.26), 'ao')}
      {lf(16, 19, 29.5, 13, 12, shade(c, 0.26), 'bo')}
      {lf(16, 18.6, 3.5, 13.2, 10.6, c, 'a', shade(c, 0.3))}
      {lf(16, 18.6, 28.5, 13.2, 10.6, c, 'b', shade(c, 0.3))}
      {lf(16, 17.5, 9.5, 2.5, 9.5, shade(c, 0.26), 'co')}
      {lf(16, 17.5, 22.5, 2.5, 9.5, shade(c, 0.26), 'do')}
      {lf(16, 17, 10, 3.5, 8.2, tint(c, 0.18), 'c', shade(c, 0.25))}
      {lf(16, 17, 22, 3.5, 8.2, tint(c, 0.18), 'd', shade(c, 0.25))}
      <ellipse cx="8.5" cy="14" rx="2.6" ry="1" fill="#fff" opacity=".3" transform="rotate(-25 8.5 14)" />
    </>
  ),
  // umbrella of tiny yellow flowers over feathery leaves
  dill: (c) => (
    <>
      <path d="M14.5 30.5C14.5 24 15.5 20 16 15.5" fill="none" stroke={shade(c, 0.15)} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14.8 25c-3-.5-6-2.5-8-5.5M9.5 22.5l-2.5.3M11 23.5l-1.5 2M8 20.8l-2.6-.6M12.5 24.5l-.8 2.3M15 23c3 0 6-1.5 8.5-4M19.5 21.8l2 1.6M21.5 20.5l2.5.8M17.5 22.8l1 2.2M23 19l2.6-.3" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round" />
      {[-158, -134, -112, -90, -68, -46, -22].map((d, i) => {
        const t = (d * Math.PI) / 180
        const L = i % 2 ? 10.5 : 9
        const x = n1(16 + Math.cos(t) * L)
        const y = n1(15.5 + Math.sin(t) * L)
        return (
          <g key={i}>
            <path d={`M16 15.5L${x} ${y}`} stroke={shade(c, 0.1)} strokeWidth="0.9" strokeLinecap="round" />
            <circle cx={x} cy={y} r="1.9" fill="#ecd84a" stroke="#c9ae24" strokeWidth="0.4" />
            <circle cx={x - 1.3} cy={y + 0.9} r="1" fill="#f4e670" />
            <circle cx={x + 1.3} cy={y + 0.9} r="1" fill="#f4e670" />
          </g>
        )
      })}
    </>
  ),
  // paired saw-edged leaves climbing a stem
  mint: (c) => (
    <>
      <path d="M16 30.5V6" stroke={shade(c, 0.35)} strokeWidth="1.3" strokeLinecap="round" />
      {serr(16, 25, -28, 11.5, 5, c, 'a', 4)}
      {serr(16, 25, -152, 11.5, 5, c, 'b', 4)}
      {serr(16, 17, -30, 9.5, 4.2, tint(c, 0.12), 'c', 4)}
      {serr(16, 17, -150, 9.5, 4.2, tint(c, 0.12), 'd', 4)}
      {serr(16, 10.5, -38, 6.5, 3, tint(c, 0.25), 'e', 3)}
      {serr(16, 10.5, -142, 6.5, 3, tint(c, 0.25), 'f', 3)}
    </>
  ),
  // lemon balm: broad scalloped leaves with a slice of lemon for the scent
  lemonbalm: (c) => (
    <>
      <path d="M13 30.5V8" stroke={shade(c, 0.3)} strokeWidth="1.3" strokeLinecap="round" />
      {serr(13, 20.5, -160, 10, 5.4, c, 'a', 6)}
      {serr(13, 20.5, -20, 10, 5.4, c, 'b', 6)}
      {serr(13, 12, -150, 7.5, 4, tint(c, 0.15), 'c', 5)}
      {serr(13, 12, -30, 7.5, 4, tint(c, 0.15), 'd', 5)}
      {serr(13, 8.5, -90, 6, 2.8, tint(c, 0.25), 'e', 4)}
      <circle cx="24" cy="24.5" r="6" fill="#f4d43a" stroke="#cfae1e" strokeWidth="0.7" />
      <circle cx="24" cy="24.5" r="4.6" fill="#fdf6c4" />
      {Array.from({ length: 6 }).map((_, i) => {
        const t = (i / 6) * Math.PI * 2
        return <line key={i} x1="24" y1="24.5" x2={n1(24 + Math.cos(t) * 4.6)} y2={n1(24.5 + Math.sin(t) * 4.6)} stroke="#f4d43a" strokeWidth="0.8" />
      })}
    </>
  ),
  // small round paired leaves topped with pink flowers (a)
  oregano: (c, a) => {
    const f = a || '#c77ab8'
    return (
      <>
        <path d="M16 30.5V9" stroke={shade(c, 0.3)} strokeWidth="1.3" strokeLinecap="round" />
        {[
          [27, 6.5],
          [21.5, 6],
          [16.5, 5],
          [12.5, 3.8],
        ].map(([y, s], i) => (
          <g key={i}>
            {lf(16, y, n1(16 - s * 1.25), n1(y - s * 0.6), s * 1.2, i % 2 ? tint(c, 0.12) : c, 'l', shade(c, 0.3))}
            {lf(16, y, n1(16 + s * 1.25), n1(y - s * 0.6), s * 1.2, i % 2 ? tint(c, 0.12) : c, 'r', shade(c, 0.3))}
          </g>
        ))}
        {union(
          [
            [16, 6.5, 2.3],
            [12.6, 7.6, 2],
            [19.4, 7.6, 2],
            [14, 4.2, 2],
            [18, 4.2, 2],
          ],
          f,
          'f',
          0.9,
        )}
        <circle cx="14" cy="4.2" r="0.6" fill="#fff" opacity=".6" />
        <circle cx="18" cy="4.2" r="0.6" fill="#fff" opacity=".6" />
        <circle cx="16" cy="6.5" r="0.7" fill="#fff" opacity=".6" />
      </>
    )
  },
  // forked grey-green sprig ending in pale knotted buds (a)
  marjoram: (c, a) => {
    const k = a || '#e4e6b6'
    return (
      <>
        <path d="M16 30.5V19C13 16 11 12 10.5 7.5M16 19c3-3 5-7 5.5-11.5" fill="none" stroke={shade(c, 0.35)} strokeWidth="1.2" strokeLinecap="round" />
        {[
          [16, 27.5, 10.5, 26, 0],
          [16, 27.5, 21.5, 26, 0],
          [16, 22.5, 11, 22, 1],
          [16, 22.5, 21, 22, 1],
          [13.2, 16, 8, 17.5, 0],
          [18.8, 16, 24, 17.5, 0],
          [11.6, 12, 6.5, 12.5, 1],
          [20.4, 12, 25.5, 12.5, 1],
          [12.4, 14, 16, 11, 1],
          [19.6, 14, 16.5, 10, 0],
        ].map(([x1, y1, x2, y2, t], i) => lf(x1, y1, x2, y2, 3.6, t ? tint(c, 0.15) : c, i, shade(c, 0.3)))}
        {union(
          [
            [10.5, 6, 2.5],
            [8.2, 8.2, 1.9],
            [12.8, 8.2, 1.9],
          ],
          k,
          'k1',
          0.9,
        )}
        {union(
          [
            [21.5, 6, 2.5],
            [19.2, 8.2, 1.9],
            [23.8, 8.2, 1.9],
          ],
          k,
          'k2',
          0.9,
        )}
      </>
    )
  },
  // curved stem with long narrow leaves
  tarragon: (c) => (
    <>
      <path d="M9.5 30.5C12 22 17 13 23 4" fill="none" stroke={shade(c, 0.3)} strokeWidth="1.2" strokeLinecap="round" />
      {[
        [10.6, 27, 3.5, 20.5],
        [12, 23.5, 21.5, 23.5],
        [14, 19.5, 6.5, 12.5],
        [16, 16, 25.5, 15.5],
        [18.4, 12, 11.5, 5.5],
        [20.6, 8.5, 29, 8],
        [23, 4.5, 26, 1.2],
      ].map(([x1, y1, x2, y2], i) => lf(x1, y1, x2, y2, 2.8, i % 2 ? tint(c, 0.12) : c, i, shade(c, 0.3)))}
    </>
  ),
  // woody branching twigs with tiny leaves and lilac flowers
  thyme: (c) => (
    <>
      <path d="M16 30.5C15 23 17 15 15.5 6M16 23c-3-2-5.5-5.5-6.5-10M16.2 18c3-2 5.5-5.5 6.5-9.5" fill="none" stroke="#8a6a4a" strokeWidth="1.3" strokeLinecap="round" />
      {[
        [16, 27],
        [16, 23.5],
        [16.3, 14],
        [16, 10.5],
        [13.5, 20.5],
        [11, 17],
        [18.6, 16],
        [21, 12.5],
      ].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x - 2.2} cy={y - 0.4} rx="2" ry="1.3" fill={c} stroke={shade(c, 0.3)} strokeWidth="0.4" transform={`rotate(25 ${x - 2.2} ${y - 0.4})`} />
          <ellipse cx={x + 2.2} cy={y - 0.4} rx="2" ry="1.3" fill={tint(c, 0.12)} stroke={shade(c, 0.3)} strokeWidth="0.4" transform={`rotate(-25 ${x + 2.2} ${y - 0.4})`} />
        </g>
      ))}
      {[
        [15.5, 5, 2.2],
        [9.2, 12, 2],
        [22.9, 7.5, 2],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#c9a0dc" stroke="#a078b8" strokeWidth="0.4" />
          <circle cx={x} cy={y} r={r * 0.4} fill="#f4e8fa" />
        </g>
      ))}
    </>
  ),
  // woody stem bristling with upswept needles
  rosemary: (c) => (
    <>
      <path d="M16 30.5C15.5 22 16.5 12 16 5" fill="none" stroke="#8a6a4a" strokeWidth="1.5" strokeLinecap="round" />
      {Array.from({ length: 10 }).map((_, i) => {
        const y = 27.5 - i * 2.4
        const L = 6.2 - i * 0.22
        return (
          <g key={i}>
            <path d={`M16 ${n1(y)}l${n1(-L)} ${n1(-L * 0.85)}`} stroke={i % 2 ? shade(c, 0.14) : c} strokeWidth="1.6" strokeLinecap="round" />
            <path d={`M16 ${n1(y - 1.1)}l${n1(L)} ${n1(-L * 0.85)}`} stroke={i % 2 ? c : shade(c, 0.14)} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        )
      })}
      <path d="M16 5V3.2" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  // three long, pebbled, silvery leaves
  sage: (c) => (
    <>
      <path d="M16 24v6.5" stroke={shade(c, 0.3)} strokeWidth="1.6" strokeLinecap="round" />
      {[-36, 36, 0].map((r, i) => (
        <g key={i} transform={`rotate(${r} 16 27)`}>
          <ellipse cx="16" cy="13.5" rx={r ? 4.4 : 5} ry={r ? 9.5 : 11} fill={r ? shade(c, 0.08) : c} stroke={shade(c, 0.32)} strokeWidth="0.6" />
          <path d={`M16 ${r ? 5.5 : 4}V24`} stroke={tint(c, 0.55)} strokeWidth="0.9" strokeLinecap="round" />
          {[
            [14, 9],
            [18, 11],
            [14, 14],
            [18, 16.5],
            [14.3, 19],
          ].map(([x, y], j) => (
            <circle key={j} cx={x} cy={y} r="0.7" fill={tint(c, 0.5)} />
          ))}
        </g>
      ))}
    </>
  ),
  // tied bundle of thin tubes with purple pom-pom flowers (a)
  chives: (c, a) => {
    const f = a || '#b684d6'
    return (
      <>
        {[
          [-6.5, 9.5],
          [-3.6, 4],
          [-1.2, 5.5],
          [1.2, 3],
          [3.6, 5],
          [6.5, 10],
        ].map(([dx, top], i) => (
          <path key={i} d={`M${n1(16 + dx * 0.35)} 30L${16 + dx} ${top}`} stroke={i % 2 ? shade(c, 0.14) : c} strokeWidth="1.7" strokeLinecap="round" />
        ))}
        <rect x="12" y="21.5" width="8" height="2.6" rx="1.3" fill="#c79a5a" stroke="#9a7438" strokeWidth="0.4" />
        {[
          [9.5, 7.5],
          [22.5, 8],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="3.9" fill={f} stroke={shade(f, 0.25)} strokeWidth="0.6" />
            {ring(x, y, 2, 5, 0.7, i).map(([px, py, r], j) => (
              <circle key={j} cx={px} cy={py} r={r} fill={tint(f, 0.5)} />
            ))}
          </g>
        ))}
      </>
    )
  },

  // ---- staples / treats ----
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
      <circle cx="12" cy="17" r="8.5" fill={c} stroke={shade(c, 0.3)} strokeWidth="0.7" />
      <path d="M12 8.5v17M8.5 11.5c1.5 1.5 1.5 3 0 4.5s-1.5 3.5 0 5.5M15.5 11.5c-1.5 1.5-1.5 3 0 4.5s1.5 3.5 0 5.5M5.5 14c1 1.5 1 4.5 0 6M18.5 14c-1 1.5-1 4.5 0 6" fill="none" stroke={shade(c, 0.32)} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M24 10.5c3.5 2.5 5 6 5 9.5 0 4-2.2 7.5-5 7.5s-5-3.5-5-7.5c0-3.5 1.5-7 5-9.5z" fill={shade(c, 0.22)} stroke={shade(c, 0.45)} strokeWidth="0.7" strokeLinejoin="round" />
      <path d="M19.3 18.5c1.5 1.2 3 1.8 4.7 1.8s3.2-.6 4.7-1.8c-.4-2.8-1.8-5.8-4.7-8-2.9 2.2-4.3 5.2-4.7 8z" fill={tint(c, 0.25)} />
      <ellipse cx="9" cy="13" rx="1.6" ry="2.4" fill="#fff" opacity=".3" />
    </>
  ),
  seeds: (c) => (
    <g transform="translate(16 16) scale(1.3) translate(-16.2 -18)">
      {[
        [12, 12, 20],
        [18, 14, -15],
        [14, 19, 40],
        [20, 20, -30],
        [16, 24, 10],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="2" ry="3.4" fill={c} transform={`rotate(${r} ${x} ${y})`} stroke={shade(c, 0.25)} strokeWidth="0.5" />
      ))}
    </g>
  ),

  // ---- dried fruit ----
  // dried apple ring: annulus + wrinkle ticks
  driedring: (c) => (
    <>
      <path d="M16 6a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm0 6.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z" fill={c} fillRule="evenodd" stroke={shade(c, 0.25)} strokeWidth="0.8" />
      {Array.from({ length: 7 }).map((_, i) => {
        const t = (i / 7) * Math.PI * 2 + 0.4
        return (
          <line
            key={i}
            x1={n1(16 + Math.cos(t) * 6)}
            y1={n1(17 + Math.sin(t) * 6)}
            x2={n1(16 + Math.cos(t) * 8.6)}
            y2={n1(17 + Math.sin(t) * 8.6)}
            stroke={shade(c, 0.3)}
            strokeWidth="1"
            strokeLinecap="round"
            opacity=".5"
          />
        )
      })}
      <ellipse cx="12" cy="12.5" rx="1.8" ry="2.6" fill="#fff" opacity=".2" transform="rotate(35 12 12.5)" />
    </>
  ),
  // lengthwise dried pear slice with the core
  driedpear: (c) => (
    <g transform="translate(16 17.5) scale(1.2) translate(-16 -19.3)">
      <path d={PEAR_D} fill={c} stroke={shade(c, 0.3)} strokeWidth="0.7" />
      <path d={PEAR_D} fill={tint(c, 0.4)} transform={scaleAt(16, 20, 0.76)} />
      <path d="M16 12v14" stroke={shade(c, 0.2)} strokeWidth="0.6" strokeLinecap="round" />
      <ellipse cx="14.6" cy="21.5" rx="0.9" ry="1.7" fill="#7a5230" transform="rotate(-12 14.6 21.5)" />
      <ellipse cx="17.4" cy="21.5" rx="0.9" ry="1.7" fill="#7a5230" transform="rotate(12 17.4 21.5)" />
      <path d="M11 20.5l1.2.3M10.8 23.5l1.2-.2M21 20.5l-1.2.3M21.2 23.5l-1.2-.2M13.5 27.5l.5-1.1M18.5 27.5l-.5-1.1" stroke={shade(c, 0.34)} strokeWidth="0.6" strokeLinecap="round" />
    </g>
  ),
  // pile of small dried sticks (dried carrot)
  driedsticks: (c) => (
    <>
      {[
        [10, 11.5, -38],
        [21, 10, 24],
        [15.5, 17.5, 82],
        [23, 21.5, -52],
        [9.5, 23, 58],
        [16.5, 25.5, -80],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <rect x={x - 2} y={y - 6} width="4" height="12" rx="1.3" fill={i % 2 ? shade(c, 0.1) : c} stroke={shade(c, 0.34)} strokeWidth="0.6" />
          <path d={`M${x - 0.6} ${y - 4}v3M${x + 0.7} ${y}v3.5`} stroke={tint(c, 0.4)} strokeWidth="0.6" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  // one big flattened, puckered disc (dried apricot)
  driedapricot: (c) => (
    <>
      <path
        d="M16 5c4 0 6.8 1 8.8 3.5 2 2.4 3 5.2 2.5 8.7-.5 4-2.5 7.2-5.8 8.8-3 1.5-7 1.7-10.5 0-3.2-1.5-5.3-4.6-5.8-8.3-.5-3.5.5-6.7 2.5-9.2 2-2.5 4.8-3.5 8.3-3.5z"
        fill={c}
        stroke={shade(c, 0.3)}
        strokeWidth="0.8"
      />
      <ellipse cx="16" cy="16.5" rx="4.2" ry="1.9" fill={shade(c, 0.3)} transform="rotate(-20 16 16.5)" />
      <path d="M12 13.5c-1.5-1.5-3-2.5-5-3M15 12.5c-.3-1.8-.2-3.3.3-5M19.5 13c1.5-1.8 3-3 5-3.5M11.5 18.5c-1.5 1-3 2.5-4 4M15.5 20.5c-.5 1.5-.5 3 0 4.5M20 19c1.8.8 3.2 2 4.2 3.5M22 16c1.5 0 2.8.2 4 .8" fill="none" stroke={shade(c, 0.26)} strokeWidth="0.8" strokeLinecap="round" opacity=".85" />
      <ellipse cx="10.5" cy="10" rx="2.6" ry="1.4" fill="#fff" opacity=".35" transform="rotate(-35 10.5 10)" />
    </>
  ),
  // round chips with a three-seed centre (dried banana)
  bananachips: (c) => (
    <>
      {[
        [11.5, 12, 7.5, -10],
        [21, 20.5, 7.5, 12],
      ].map(([x, y, r, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.9} fill={shade(c, 0.1)} stroke={shade(c, 0.36)} strokeWidth="0.7" />
          <ellipse cx={x} cy={y} rx={r - 1.5} ry={r * 0.9 - 1.5} fill={tint(c, 0.3)} />
          {ring(x, y, r * 0.72, 9, 0).map(([px, py], j) => (
            <path key={j} d={`M${px} ${py}L${n1(x + (px - x) * 0.55)} ${n1(y + (py - y) * 0.55)}`} stroke={shade(c, 0.16)} strokeWidth="0.6" strokeLinecap="round" />
          ))}
          {ring(x, y, 1.5, 3, 0.9, -Math.PI / 2).map(([px, py, pr], j) => (
            <circle key={j} cx={px} cy={py} r={pr} fill="#8a5a2b" />
          ))}
        </g>
      ))}
    </>
  ),
  // small flat creased bits (dried cranberries)
  driedbits: (c) => (
    <>
      {[
        [9.5, 10, -20, 1.15],
        [20, 9.5, 35, 1.2],
        [15, 17, 80, 1.1],
        [24.5, 18, -30, 1.05],
        [8.5, 21.5, 20, 1.2],
        [18.5, 25, -60, 1.2],
      ].map(([x, y, r, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <path d="M-3.8-.5c0-2 1.6-3 3.6-3s4 .6 4 2.6c0 2.2-1.4 3.9-3.8 3.9S-3.8 1.9-3.8-.5z" fill={c} stroke={shade(c, 0.36)} strokeWidth="0.5" />
          <path d="M-2.2-.6c1.4 1 3.2 1 4.4-.2M-1 1.6c.8.5 1.8.5 2.6 0" fill="none" stroke={tint(c, 0.35)} strokeWidth="0.6" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  // two heart-shaped slices with the pale core pattern (dried strawberry)
  driedstrawberry: (c) => {
    const d = 'M0-5C-2.6-8-7.2-6.5-6.8-2-6.4 2.5-2.5 5.5 0 8.5 2.5 5.5 6.4 2.5 6.8-2 7.2-6.5 2.6-8 0-5z'
    return (
      <>
        {[
          [11, 12, -14, 1.05],
          [20.5, 20, 14, 1.1],
        ].map(([x, y, r, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
            <path d={d} fill={c} stroke={shade(c, 0.34)} strokeWidth="0.7" strokeLinejoin="round" />
            <path d={d} fill={tint(c, 0.38)} transform="translate(0 .4) scale(.62)" />
            <path d="M0-2.2V4" stroke="#fff3e6" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M0-.5l-2.2-1.3M0-.5l2.2-1.3M0 1.5l-1.8-.8M0 1.5l1.8-.8" stroke="#fff3e6" strokeWidth="0.6" strokeLinecap="round" />
          </g>
        ))}
      </>
    )
  },
  // wavy leathery strips (dried mango)
  driedmango: (c) => (
    <g transform="rotate(-20 16 16)">
      {[
        ['M5 9.5c3-3 5 3 8 0s5-3 8 0 4 1.5 6-.5', 0],
        ['M4.5 16.5c3-3 5 3 8 0s5-3 8 0 4.5 1.5 7-1', 1],
        ['M5.5 23.5c3-3 5 3 8 0s5-3 8 0 3.5 1 5-.5', 0],
      ].map(([d, t], i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={shade(c, 0.34)} strokeWidth="5.6" strokeLinecap="round" />
          <path d={d} fill="none" stroke={t ? tint(c, 0.15) : c} strokeWidth="4.4" strokeLinecap="round" />
          <path d={d} fill="none" stroke={tint(c, 0.45)} strokeWidth="0.7" strokeLinecap="round" strokeDasharray="2.5 3" />
        </g>
      ))}
    </g>
  ),
  // sugared multicolour cubes (candied fruit)
  candied: (c) => {
    const cube = (x, y, s, col, k) => (
      <g key={k}>
        <path d={`M${x} ${y - s}L${x + s} ${y - s / 2}L${x} ${y}L${x - s} ${y - s / 2}z`} fill={tint(col, 0.35)} stroke={shade(col, 0.3)} strokeWidth="0.5" strokeLinejoin="round" />
        <path d={`M${x - s} ${y - s / 2}L${x} ${y}V${y + s}L${x - s} ${y + s / 2}z`} fill={col} stroke={shade(col, 0.3)} strokeWidth="0.5" strokeLinejoin="round" />
        <path d={`M${x + s} ${y - s / 2}L${x} ${y}V${y + s}L${x + s} ${y + s / 2}z`} fill={shade(col, 0.16)} stroke={shade(col, 0.3)} strokeWidth="0.5" strokeLinejoin="round" />
        <circle cx={x - s * 0.3} cy={y - s * 0.55} r="0.5" fill="#fff" />
        <circle cx={x + s * 0.3} cy={y - s * 0.4} r="0.5" fill="#fff" />
        <circle cx={x - s * 0.5} cy={y + s * 0.2} r="0.45" fill="#fff" opacity=".8" />
      </g>
    )
    return (
      <>
        {cube(21.5, 9.5, 5, '#6fbf5e', 'g')}
        {cube(9.5, 11.5, 5.5, c, 'r')}
        {cube(24, 21.5, 4.6, '#f08a3a', 'o')}
        {cube(14.5, 22.5, 6, '#f2c84a', 'y')}
      </>
    )
  },
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
  'wild-strawberry': ['wildstrawberry', '#e5503f'],
  blueberry: ['bilberry', '#3f4a8a'],
  'highbush-blueberry': ['blueberry', '#7f9fe0'],
  raspberry: ['raspberry', '#d24d78'],
  blackberry: ['raspberry', '#3b2a4a'],
  cloudberry: ['raspberry', '#f2a04a'],
  mulberry: ['mulberry', '#7a2f5a'],
  redcurrant: ['currant', '#dc3b3b'],
  blackcurrant: ['currant', '#33263f'],
  gooseberry: ['gooseberry', '#b7cf63'],
  cranberry: ['cranberry', '#b3243c'],
  lingonberry: ['lingon', '#e0444f'],
  'sea-buckthorn': ['seabuckthorn', '#f59a23'],
  saskatoon: ['saskatoon', '#7a4a8f'],
  haskap: ['haskap', '#4a5aa8'],
  aronia: ['berry', '#2f2836'],
  physalis: ['physalis', '#f5a62a', '#e3c88e'],
  viburnum: ['umbel', '#d93a3a', '#7a9a4a'],
  rowan: ['rowan', '#e8742e'],
  elderberry: ['umbel', '#2e2440', '#a04a6a'],
  orange: ['citrus', '#f08a1c'],
  mandarin: ['mandarin', '#f58220'],
  clementine: ['segments', '#f8a838'],
  grapefruit: ['citrus', '#f7d060', '#ee6f78'],
  lemon: ['lemon', '#f4d43a'],
  lime: ['wedge', '#7fc23a'],
  pomelo: ['pomelo', '#cfdc6a', '#f0868c'],
  kiwi: ['kiwi', '#7fb24a'],
  melon: ['melon', '#f2cf5a'],
  watermelon: ['watermelon', '#4caf5a'],
  cherry: ['cherry', '#c62f45'],
  peach: ['stonefruit', '#f7b07e', '#e8604a'],
  apricot: ['apricot', '#f5a11e'],
  plum: ['plum', '#6f4a9e'],
  nectarine: ['halfstone', '#d9452f', '#f8cf6a'],
  mango: ['mango', '#f0a83a'],
  pineapple: ['pineapple', '#f0c93a'],
  papaya: ['papaya', '#f58f3a', '#a9c04a'],
  pomegranate: ['pomegranate', '#c62f45'],
  fig: ['fig', '#7a4f8a'],
  persimmon: ['persimmon', '#e5551f'],
  guava: ['guava', '#9ccf5a', '#f48a94'],
  lychee: ['lychee', '#e0574f'],
  'passion-fruit': ['passionfruit', '#6a3a6f', '#f4b730'],
  starfruit: ['starfruit', '#e8c94a'],
  'dragon-fruit': ['dragonfruit', '#e0507a'],
  coconut: ['coconut', '#f2ead6'],
  avocado: ['avocado', '#8fae4a'],
  dates: ['dates', '#8a5a34'],
  raisins: ['raisins', '#6a3f57'],
  'fruit-seeds-pits': ['seeds', '#8a6a4a'],
  nuts: ['nuts', '#c79a5a'],

  // greens / leaves
  'romaine-lettuce': ['romaine', '#6fb552'],
  'green-leaf-lettuce': ['frilly', '#8fd05a'],
  'red-leaf-lettuce': ['frilly', '#a8425e', '#8fc45a'],
  'butterhead-lettuce': ['butterhead', '#a5d86e'],
  'iceberg-lettuce': ['iceberg', '#c4e69a'],
  endive: ['endive', '#f6f1c8', '#cfe05a'],
  spinach: ['spinach', '#3a8f4a'],
  kale: ['kale', '#2f7350'],
  'swiss-chard': ['chard', '#3f9650', '#e8426a'],
  'dandelion-greens': ['dandelion', '#8fbf3a'],
  arugula: ['arugula', '#4c9a4f'],
  watercress: ['watercress', '#3fa860'],
  'bok-choy': ['bokchoy', '#3f9a52'],
  'collard-greens': ['collard', '#4f8f70'],
  'turnip-greens': ['turniptops', '#6ab04a'],
  'mustard-greens': ['mustard', '#a3c644'],
  'beet-greens': ['beettops', '#3f8f55', '#c22e5a'],
  'carrot-tops': ['carrottops', '#5aac5a'],
  'napa-cabbage': ['napa', '#d7ec9c'],
  sorrel: ['sorrel', '#6fbf4a'],
  sprouts: ['sprouts', '#7cc44f'],
  clover: ['clover', '#4aa858'],
  plantain: ['plantain', '#5fa04a'],
  nettle: ['nettle', '#3f8a4a'],
  'meadow-grass': ['grass', '#5fae4a'],
  timothy: ['timothy', '#9ab84a'],

  // herbs
  cilantro: ['cilantro', '#62bf5a'],
  parsley: ['parsley', '#3f9a4a'],
  basil: ['basil', '#36a34a'],
  dill: ['dill', '#6fae4a'],
  mint: ['mint', '#35b58a'],
  oregano: ['oregano', '#5f9440', '#c77ab8'],
  thyme: ['thyme', '#7a9f5a'],
  rosemary: ['rosemary', '#4a8a72'],
  sage: ['sage', '#9db8a0'],
  chives: ['chives', '#5aac5a', '#b684d6'],
  'lemon-balm': ['lemonbalm', '#a8cc4a'],
  tarragon: ['tarragon', '#5c9f5a'],
  marjoram: ['marjoram', '#9ab58a', '#e4e6b6'],

  // vegetables
  'bell-pepper-green': ['pepper', '#5aac5a'],
  'bell-pepper-red': ['pepper', '#e0574f'],
  'bell-pepper-yellow': ['pepper', '#f2c53d'],
  'bell-pepper-orange': ['pepper', '#f0913e'],
  'chili-pepper': ['chili', '#d64545'],
  cucumber: ['cucumber', '#5aac5a'],
  zucchini: ['zucchini', '#3f8a4a'],
  pattypan: ['pattypan', '#f2e9a6'],
  okra: ['okra', '#7bab4a'],
  carrot: ['carrot', '#f0913e'],
  parsnip: ['parsnip', '#ecd9a4'],
  daikon: ['daikon', '#f7f7ee'],
  celery: ['celery', '#8ac25a'],
  broccoli: ['broccoli', '#4f9a52'],
  cauliflower: ['cauliflower', '#f6f0dc'],
  cabbage: ['cabbage', '#a8d67a'],
  'red-cabbage': ['cabbagecut', '#8f4a9e'],
  'savoy-cabbage': ['savoy', '#5a9f58'],
  'brussels-sprouts': ['brussels', '#7ab85a'],
  kohlrabi: ['kohlrabi', '#b5d98a'],
  tomato: ['tomato', '#e0574f'],
  corn: ['corn', '#f2ce4a'],
  peas: ['peapod', '#5fb04f'],
  'green-beans': ['beans', '#5fb064'],
  pumpkin: ['pumpkin', '#f0913e'],
  squash: ['butternut', '#e9b872'],
  'sweet-potato': ['sweetpotato', '#c9643f'],
  'potato-raw': ['potato', '#d8b87a'],
  'jerusalem-artichoke': ['sunchoke', '#c9a27e'],
  radish: ['radish', '#e0483f'],
  beetroot: ['beetroot', '#a02a55'],
  turnip: ['turnip', '#f2cf55'],
  rutabaga: ['rutabaga', '#f0dc9a', '#8f5a9a'],
  artichoke: ['artichoke', '#7a9a5a'],
  eggplant: ['eggplant', '#6a3f7f'],
  asparagus: ['asparagus', '#7bbf5a'],
  fennel: ['fennel', '#d7e0bf'],
  onion: ['onion', '#d8b87a'],
  garlic: ['garlic', '#f2ead6'],
  leek: ['leek', '#8ac25a'],
  'green-onion': ['greenonion', '#5fb04f'],
  rhubarb: ['rhubarb', '#d24d5a'],
  mushrooms: ['mushroom', '#c8a878'],
  'tomato-leaves': ['tomatoleaf', '#3f8a50'],

  // dried fruits
  'dried-apple': ['driedring', '#e2b45c'],
  'dried-pear': ['driedpear', '#d9c47c'],
  'dried-carrot': ['driedsticks', '#e0843a'],
  rosehip: ['rosehip', '#d0432e'],
  'dried-apricot': ['driedapricot', '#e08a2a'],
  prunes: ['prune', '#3d2c4a'],
  'dried-banana': ['bananachips', '#e6c25e'],
  'dried-cranberry': ['driedbits', '#a8283f'],
  'dried-strawberry': ['driedstrawberry', '#c2424e'],
  'dried-mango': ['driedmango', '#eaa53c'],
  'candied-fruit': ['candied', '#e0567a'],

  // treats / forbidden
  chocolate: ['chocolate', '#7a4a2b'],
  dairy: ['dairy', '#f0ead6'],
  meat: ['meat', '#d47a6a'],
  bread: ['bread', '#e0b87a'],
}

// only for foods added to the DB before they get their own MAP entry
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
