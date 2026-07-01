export const SAFETY = {
  safe: { txt: 'Можно часто', cls: 'safe' },
  caution: { txt: 'Осторожно', cls: 'caution' },
  forbidden: { txt: 'Нельзя!', cls: 'forbidden' },
}

export const FREQ = {
  daily: 'каждый день',
  weekly: '1–2 раза в неделю',
  occasional: 'изредка',
  never: 'никогда',
}

// how many times in a rolling week is reasonable
export function weekLimit(frequency) {
  switch (frequency) {
    case 'daily':
      return 99
    case 'weekly':
      return 2
    case 'occasional':
      return 1
    case 'never':
      return 0
    default:
      return 99
  }
}

export function unitLabel(unit) {
  if (unit === 'g') return 'г'
  if (unit === 'pcs') return 'шт'
  if (unit === 'portion') return 'порц.'
  return ''
}
