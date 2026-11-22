// Small toys: a synthesized "wheek", haptics. No assets, nothing loads until used.
let ctx

export function wheek(times = 3) {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const t0 = ctx.currentTime + 0.02
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      const t = t0 + i * 0.19
      o.type = 'triangle'
      o.frequency.setValueAtTime(900, t)
      o.frequency.exponentialRampToValueAtTime(2300 + i * 150, t + 0.12)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + 0.17)
    }
  } catch {
    /* audio not available — stay silent */
  }
}

export function buzz(pattern = 12) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* no haptics */
  }
}

export function isBirthday(birthISO, d = new Date()) {
  if (!birthISO) return false
  const [, m, day] = birthISO.split('-').map(Number)
  return d.getMonth() + 1 === m && d.getDate() === day
}
