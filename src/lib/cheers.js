// What Yuki does when you take care of him: 3D reaction + speech + popup.
import { yukiSay, yukiFeed, yukiCheer, yukiHop } from './bus.js'
import { FEED, CLEANED, WATERED, WEIGHED, VIT_DONE, FOOD_SPECIAL, pick } from './phrases.js'
import { buzz } from './eggs.js'

export function cheerClean() {
  const text = pick(CLEANED)
  yukiHop('popcorn')
  yukiSay(text, 4200)
  yukiCheer({ mood: 'happy', prop: 'sparkle', title: 'Чисто!', text, confetti: true })
  buzz(18)
}

export function cheerWater() {
  const text = pick(WATERED)
  yukiHop('hop')
  yukiSay(text, 4200)
  yukiCheer({ mood: 'happy', prop: 'drops', title: 'Свежая вода', text })
  buzz(18)
}

export function cheerWeight(grams) {
  const text = pick(WEIGHED)
  yukiHop('hop')
  yukiSay(text, 4200)
  const pretty = /^(\d)\1+$/.test(String(Math.round(grams))) || [1234, 1000, 1111].includes(Math.round(grams))
  yukiCheer({
    mood: pretty ? 'wow' : 'happy',
    prop: 'scale',
    title: pretty ? `${Math.round(grams)} г — красивое число!` : `${Number(grams)} г записано`,
    text,
    confetti: pretty,
  })
  buzz(18)
}

// food: the item flies into the 3D mouth, and a happy Yuki pops up
export function cheerFeed(food, { vitNow, vitTarget, count } = {}) {
  if (!food) return
  yukiFeed(food)
  buzz(10)
  if (food.safety === 'forbidden') {
    yukiSay('Ой… а мне точно это можно?', 4000)
    yukiCheer({ mood: 'sad', title: 'Это ему нельзя', text: `${food.name_ru} — из списка «нельзя». Лучше убрать из клетки.`, food, ms: 3600 })
    return
  }
  if (food.kind === 'vitamin_c') {
    const done = vitNow >= vitTarget
    const text = done ? pick(VIT_DONE) : `Витамин C: ${vitNow} из ${vitTarget}`
    yukiSay(text, 3600)
    yukiCheer(done ? { mood: 'happy', prop: 'crown', title: 'Витамин C закрыт!', text, food, confetti: true } : { mood: 'happy', title: 'Витаминка!', text, food, ms: 2000 })
    return
  }
  const special = FOOD_SPECIAL[food.slug]
  const text = special ? pick(special) : pick(FEED)
  yukiSay(text, 4200)
  const hundredth = count > 0 && count % 100 === 0
  yukiCheer({
    mood: special || Math.random() < 0.25 ? 'love' : 'happy',
    prop: food.slug === 'dill' ? 'dill' : hundredth ? 'party' : '',
    title: hundredth ? `${count}-я запись в дневнике!` : food.kind === 'feed' ? 'Порция корма' : food.name_ru,
    text,
    food,
    confetti: hundredth,
  })
}
