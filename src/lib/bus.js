// Tiny event bus so any tab can make Yuki react (speak / eat) on the 3D stage.
const listeners = { say: [], feed: [], cheer: [], hop: [] }

export const bus = {
  on(ev, fn) {
    ;(listeners[ev] ||= []).push(fn)
    return () => {
      listeners[ev] = listeners[ev].filter((f) => f !== fn)
    }
  },
  emit(ev, payload) {
    ;(listeners[ev] || []).forEach((f) => f(payload))
  },
}

// Make Yuki say something for `ms` milliseconds (0 = default).
export const yukiSay = (text, ms = 0) => bus.emit('say', { text, ms })
// Fling a food into Yuki's mouth (pass the food row → SVG icon; triggers a thank-you too).
export const yukiFeed = (food) => bus.emit('feed', { food })
// Celebration popup with a drawn Yuki: { mood, prop, title, text, food?, confetti? }
export const yukiCheer = (payload) => bus.emit('cheer', payload)
// Make the 3D Yuki jump: 'hop' (small) | 'popcorn' (the full happy-pig routine)
export const yukiHop = (kind = 'hop') => bus.emit('hop', { kind })
