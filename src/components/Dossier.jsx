import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import YukiArt from './YukiArt.jsx'
import Icon from './Icon.jsx'
import { useData } from '../data.jsx'
import { ageString, todayISO } from '../lib/dates.js'

// Hidden card (seven taps on the name): silly but real numbers from the diary.
export default function Dossier({ onClose }) {
  const { feedings, foods, cleanings, waterings, weights, pet } = useData()

  const s = useMemo(() => {
    const byId = Object.fromEntries(foods.map((f) => [f.id, f]))
    const grams = {}
    let total = 0
    let vit = 0
    for (const f of feedings) {
      const food = byId[f.food_id]
      if (!food) continue
      const a = Number(f.amount || 0)
      if (food.kind === 'vitamin_c') vit += a
      if (food.kind !== 'produce') continue
      grams[food.name_ru] = (grams[food.name_ru] || 0) + a
      total += a
    }
    const top = Object.entries(grams).sort((a, b) => b[1] - a[1])
    const ws = weights.map((w) => Number(w.grams))
    const cur = ws.length ? ws[ws.length - 1] : 0
    return {
      total,
      vit,
      top: top[0] || null,
      kinds: top.length,
      max: ws.length ? Math.max(...ws) : 0,
      cucumbers: cur ? (cur / 300).toFixed(1).replace('.', ',') : '—',
      selfTimes: cur ? (total / cur).toFixed(1).replace('.', ',') : '—',
    }
  }, [feedings, foods, weights])

  const rows = [
    ['Кодовое имя', pet.name || 'Юки'],
    ['Возраст', ageString(pet.birthdate, todayISO())],
    ['Съедено за 90 дней', `${Math.round(s.total)} г овощей и зелени`],
    ['Это', `${s.selfTimes} собственных веса`],
    ['Главная слабость', s.top ? `${s.top[0]} — ${Math.round(s.top[1])} г` : 'пока не выявлена'],
    ['Попробовано', `${s.kinds} разных продуктов`],
    ['Витаминок принято', `${Math.round(s.vit)} шт`],
    ['Вес в огурцах', `≈ ${s.cucumbers}`],
    ['Рекорд веса', s.max ? `${s.max} г` : '—'],
    ['Уборок пережито', `${cleanings.length}`],
    ['Свежей воды налито', `${waterings.length} раз`],
    ['Особые приметы', 'белая полоса, рыжая попа, наглый взгляд'],
  ]

  return createPortal(
    <div className="modal-scrim show" onClick={onClose}>
      <div className="modal dossier" onClick={(e) => e.stopPropagation()}>
        <button className="round-btn dossier-x" onClick={onClose} aria-label="Закрыть">
          <Icon name="x" />
        </button>
        <div className="dossier-stamp">совершенно секретно</div>
        <div className="dossier-art">
          <YukiArt mood="wow" prop="tunnel" size={150} />
        </div>
        <div className="dossier-title">Досье №{(pet.birthdate || '2024-02-15').slice(5).split('-').reverse().join('-')}</div>
        <dl className="dossier-list">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="dossier-note">Ты нашёл тайник. Юки в курсе и требует огурец за молчание.</p>
      </div>
    </div>,
    document.body,
  )
}
