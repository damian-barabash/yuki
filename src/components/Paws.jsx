// Scattered paw prints — the quiet background pattern of the pastel screens.
const PAW = (
  <>
    <ellipse cx="0" cy="6" rx="9" ry="7.5" />
    <ellipse cx="-10" cy="-5" rx="3.6" ry="5" transform="rotate(-18 -10 -5)" />
    <ellipse cx="-3.6" cy="-10" rx="3.6" ry="5.2" transform="rotate(-6 -3.6 -10)" />
    <ellipse cx="3.6" cy="-10" rx="3.6" ry="5.2" transform="rotate(6 3.6 -10)" />
    <ellipse cx="10" cy="-5" rx="3.6" ry="5" transform="rotate(18 10 -5)" />
  </>
)
const SPOTS = [
  [38, 96, 1.5, -20], [352, 70, 1.9, 16], [300, 168, 1.1, -8], [70, 214, 1.2, 24],
  [200, 34, 0.8, 10], [366, 250, 1.3, -18], [16, 300, 1.0, 8], [250, 300, 0.9, -24],
]

export default function Paws() {
  return (
    <div className="hero-deco" aria-hidden>
      <svg viewBox="0 0 400 340" preserveAspectRatio="xMidYMin slice">
        <g fill="currentColor">
          {SPOTS.map(([x, y, s, r], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>{PAW}</g>
          ))}
        </g>
      </svg>
    </div>
  )
}
