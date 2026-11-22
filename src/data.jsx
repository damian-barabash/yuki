import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { sel, ins, patch, del } from './lib/supabase.js'
import { todayISO, daysSince, daysBetween } from './lib/dates.js'
import { useAuth } from './auth.jsx'

const DIRTY_DAYS = 2 // strictly more than 2 days without cleaning → dirty
const WATER_DAYS = 2 // strictly more than 2 days without fresh water → Yuki is "hot"
const WEIGH_DAYS = 10 // more than ~1.5 weeks without weighing → ask to weigh
const HUNGRY_HOUR = 12 // nothing logged today by noon → Yuki is "hungry" (blue)

const DataCtx = createContext(null)

function tmpId() {
  return 'tmp-' + Math.random().toString(36).slice(2)
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const by = user?.display_name || user?.username || 'кто-то'

  const [foods, setFoods] = useState([])
  const [foodPrefs, setFoodPrefs] = useState({}) // food_id → default_grams
  const [waterings, setWaterings] = useState([])
  const [cleanings, setCleanings] = useState([])
  const [weights, setWeights] = useState([])
  const [feedings, setFeedings] = useState([])
  const [pet, setPet] = useState({ name: 'Юки', birthdate: '2024-02-15' })
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0) // re-derive time-based status (hungry / night) while the app stays open

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5 * 60 * 1000)
    const onVis = () => document.visibilityState === 'visible' && setTick((t) => t + 1)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // initial load
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
        const [f, c, w, fe, p, fp, wa] = await Promise.all([
          sel('foods?select=*&order=is_staple.desc,sort.asc,name_ru.asc'),
          sel('cleanings?select=*&order=cleaned_at.desc&limit=200'),
          sel('weights?select=*&order=measured_on.asc&limit=400'),
          sel(`feedings?select=*&fed_on=gte.${since}&order=created_at.desc&limit=1000`),
          sel('pet_config?id=eq.1&select=name,birthdate'),
          sel('food_prefs?select=food_id,default_grams'),
          sel('waterings?select=*&order=changed_at.desc&limit=200'),
        ])
        if (!alive) return
        setFoods(f)
        setCleanings(c)
        setWeights(w)
        setFeedings(fe)
        if (p[0]) setPet(p[0])
        setFoodPrefs(Object.fromEntries((fp || []).map((r) => [r.food_id, Number(r.default_grams)])))
        setWaterings(wa)
      } catch (e) {
        console.error('load failed', e)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // ---------- cleanings ----------
  const addCleaning = useCallback(
    (when) => {
      const cleaned_at = when || new Date().toISOString()
      const optimistic = { id: tmpId(), cleaned_at, created_by: by, created_at: new Date().toISOString() }
      setCleanings((xs) => [optimistic, ...xs].sort((a, b) => (a.cleaned_at < b.cleaned_at ? 1 : -1)))
      ins('cleanings', { cleaned_at, created_by: by })
        .then((row) => row && setCleanings((xs) => xs.map((x) => (x.id === optimistic.id ? row : x))))
        .catch((e) => {
          console.error(e)
          setCleanings((xs) => xs.filter((x) => x.id !== optimistic.id))
        })
    },
    [by],
  )

  const delCleaning = useCallback((id) => {
    setCleanings((xs) => xs.filter((x) => x.id !== id))
    if (!String(id).startsWith('tmp-')) del('cleanings', `id=eq.${id}`).catch(console.error)
  }, [])

  // ---------- waterings ----------
  const addWatering = useCallback(
    (when) => {
      const changed_at = when || new Date().toISOString()
      const optimistic = { id: tmpId(), changed_at, created_by: by, created_at: new Date().toISOString() }
      setWaterings((xs) => [optimistic, ...xs].sort((a, b) => (a.changed_at < b.changed_at ? 1 : -1)))
      ins('waterings', { changed_at, created_by: by })
        .then((row) => row && setWaterings((xs) => xs.map((x) => (x.id === optimistic.id ? row : x))))
        .catch((e) => {
          console.error(e)
          setWaterings((xs) => xs.filter((x) => x.id !== optimistic.id))
        })
    },
    [by],
  )

  const delWatering = useCallback((id) => {
    setWaterings((xs) => xs.filter((x) => x.id !== id))
    if (!String(id).startsWith('tmp-')) del('waterings', `id=eq.${id}`).catch(console.error)
  }, [])

  // ---------- weights ----------
  const addWeight = useCallback(
    async ({ measured_on, grams, note }) => {
      const date = measured_on || todayISO()
      grams = Number(grams)
      const optimistic = {
        id: tmpId(),
        measured_on: date,
        grams,
        note: note || null,
        ai_rec: null,
        ai_status: 'idle',
        created_by: by,
        created_at: new Date().toISOString(),
      }
      // replace any existing measurement on that date (unique per day)
      setWeights((xs) =>
        [...xs.filter((x) => x.measured_on !== date), optimistic].sort((a, b) =>
          a.measured_on < b.measured_on ? -1 : 1,
        ),
      )
      try {
        // the AI analysis for this weighing is produced by the coach (see lib/coach.js)
        const row = await ins('weights', { measured_on: date, grams, note: note || null, created_by: by, ai_status: 'idle' }, { upsert: true, onConflict: 'measured_on' })
        if (row) setWeights((xs) => xs.map((x) => (x.measured_on === date ? row : x)))
      } catch (e) {
        console.error(e)
        setWeights((xs) => xs.filter((x) => x.id !== optimistic.id))
        throw e
      }
    },
    [by],
  )

  const delWeight = useCallback((id) => {
    setWeights((xs) => xs.filter((x) => x.id !== id))
    if (!String(id).startsWith('tmp-')) del('weights', `id=eq.${id}`).catch(console.error)
  }, [])

  // ---------- feedings ----------
  const addFeeding = useCallback(
    ({ food_id, amount, unit, fed_on }) => {
      const date = fed_on || todayISO()
      const optimistic = {
        id: tmpId(),
        fed_on: date,
        food_id,
        amount: Number(amount) || 0,
        unit,
        created_by: by,
        created_at: new Date().toISOString(),
      }
      setFeedings((xs) => [optimistic, ...xs])
      ins('feedings', { fed_on: date, food_id, amount: Number(amount) || 0, unit, created_by: by })
        .then((row) => row && setFeedings((xs) => xs.map((x) => (x.id === optimistic.id ? row : x))))
        .catch((e) => {
          console.error(e)
          setFeedings((xs) => xs.filter((x) => x.id !== optimistic.id))
        })
      return optimistic
    },
    [by],
  )

  const delFeeding = useCallback((id) => {
    setFeedings((xs) => xs.filter((x) => x.id !== id))
    if (!String(id).startsWith('tmp-')) del('feedings', `id=eq.${id}`).catch(console.error)
  }, [])

  // ---------- food defaults (per-food portion template) ----------
  const setFoodDefault = useCallback((food_id, grams) => {
    const g = Number(grams)
    if (!g || g <= 0) return
    setFoodPrefs((m) => ({ ...m, [food_id]: g }))
    ins('food_prefs', { food_id, default_grams: g, updated_at: new Date().toISOString() }, { upsert: true, onConflict: 'food_id' }).catch(console.error)
  }, [])

  const clearFoodDefault = useCallback((food_id) => {
    setFoodPrefs((m) => {
      const n = { ...m }
      delete n[food_id]
      return n
    })
    del('food_prefs', `food_id=eq.${food_id}`).catch(console.error)
  }, [])

  // ---------- pet config ----------
  const updatePet = useCallback((changes) => {
    setPet((p) => ({ ...p, ...changes }))
    patch('pet_config', 'id=eq.1', changes).catch(console.error)
  }, [])

  // ---------- derived status ----------
  const status = useMemo(() => {
    const lastClean = cleanings[0] || null
    const dSinceClean = lastClean ? daysSince(lastClean.cleaned_at) : Infinity
    const dirty = dSinceClean > DIRTY_DAYS

    const lastWater = waterings[0] || null
    const dSinceWater = lastWater ? daysSince(lastWater.changed_at) : Infinity
    const hot = dSinceWater > WATER_DAYS

    const lastWeight = weights.length ? weights[weights.length - 1] : null
    const dSinceWeigh = lastWeight ? daysSince(lastWeight.measured_on) : Infinity
    const needsWeigh = dSinceWeigh > WEIGH_DAYS

    const today = todayISO()
    const vitFood = foods.find((f) => f.kind === 'vitamin_c')
    const vitToday = feedings
      .filter((f) => f.fed_on === today && vitFood && f.food_id === vitFood.id)
      .reduce((s, f) => s + Number(f.amount || 0), 0)
    const vitTarget = vitFood?.daily_target || 3

    const feedFood = foods.find((f) => f.kind === 'feed')
    const feedToday = feedings
      .filter((f) => f.fed_on === today && feedFood && f.food_id === feedFood.id)
      .reduce((s, f) => s + Number(f.amount || 0), 0)

    // food: nothing logged today by noon (or nothing at all since the day before yesterday) → hungry
    const hour = new Date().getHours()
    const lastFeedDay = feedings.reduce((m, f) => (f.fed_on > m ? f.fed_on : m), '')
    const dSinceFeed = lastFeedDay ? daysBetween(lastFeedDay, today) : Infinity
    const hungry = dSinceFeed > 1 || (dSinceFeed === 1 && hour >= HUNGRY_HOUR)
    const freshToday = feedings
      .filter((f) => f.fed_on === today && f.unit === 'g')
      .reduce((s, f) => s + Number(f.amount || 0), 0)
    const night = hour >= 23 || hour < 6
    const mood = dirty ? 'dirty' : hot ? 'hot' : hungry ? 'hungry' : 'calm'

    // change signatures: the AI coach re-analyses only when its input really changed
    const todays = feedings.filter((f) => f.fed_on === today)
    const sigFood = `${today}:${todays.length}:${todays.reduce((s, f) => s + Number(f.amount || 0), 0)}`
    const sigClean = `${today}:${lastClean?.cleaned_at || ''}:${cleanings.length}`
    const sigWater = `${today}:${lastWater?.changed_at || ''}:${waterings.length}`
    const sigWeight = `${today}:${lastWeight?.measured_on || ''}:${lastWeight?.grams || ''}:${weights.length}`
    const sigs = { food: sigFood, clean: sigClean, water: sigWater, weight: sigWeight, home: [sigFood, sigClean, sigWater, sigWeight].join('|') }

    return {
      sigs,
      mood,
      hungry,
      dSinceFeed,
      lastFeedDay,
      freshToday,
      night,
      lastClean,
      dSinceClean,
      dirty,
      lastWater,
      dSinceWater,
      hot,
      lastWeight,
      dSinceWeigh,
      needsWeigh,
      vitToday,
      vitTarget,
      feedToday,
    }
  }, [cleanings, waterings, weights, feedings, foods, tick])

  const value = {
    loading,
    foods,
    foodPrefs,
    setFoodDefault,
    clearFoodDefault,
    cleanings,
    weights,
    feedings,
    pet,
    status,
    by,
    addCleaning,
    delCleaning,
    waterings,
    addWatering,
    delWatering,
    addWeight,
    delWeight,
    addFeeding,
    delFeeding,
    updatePet,
  }
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}

export function useData() {
  const ctx = useContext(DataCtx)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
