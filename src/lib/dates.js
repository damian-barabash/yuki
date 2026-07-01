// Date helpers — everything in local time, ISO yyyy-mm-dd for storage.
export const MS_DAY = 86400000

export function todayISO() {
  const d = new Date()
  return isoOf(d)
}

export function isoOf(d) {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function daysBetween(aISO, bISO) {
  return Math.floor((Date.parse(bISO) - Date.parse(aISO)) / MS_DAY)
}

// full days since a timestamp/date until now
export function daysSince(ts) {
  if (!ts) return Infinity
  return Math.floor((Date.now() - new Date(ts).getTime()) / MS_DAY)
}

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}
export function fmtDateFull(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
export function fmtDateTime(ts) {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh}:${mm}`
}
export function weekday(iso) {
  return WD[new Date(iso).getDay()]
}

export function daysWord(n) {
  n = Math.abs(n)
  const d10 = n % 10, d100 = n % 100
  if (d10 === 1 && d100 !== 11) return 'день'
  if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return 'дня'
  return 'дней'
}

// age like "2 г 4 мес" from birthdate ISO
export function ageString(birthISO, onISO) {
  if (!birthISO) return ''
  const b = new Date(birthISO)
  const d = onISO ? new Date(onISO) : new Date()
  let months = (d.getFullYear() - b.getFullYear()) * 12 + (d.getMonth() - b.getMonth())
  if (d.getDate() < b.getDate()) months--
  if (months < 0) months = 0
  const y = Math.floor(months / 12), m = months % 12
  if (y <= 0) return `${m} мес`
  return `${y} г ${m} мес`
}
