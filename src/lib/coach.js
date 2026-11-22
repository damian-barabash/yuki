// AI coach: one hook per scope ('home' | 'food' | 'weight' | 'clean' | 'water').
// Stale-while-revalidate — the last answer is shown instantly from localStorage,
// then refreshed whenever the underlying diary data changes (debounced, so a
// burst of feedings triggers a single request).
import { useCallback, useEffect, useRef, useState } from 'react'
import { callFn } from './supabase.js'
import { todayISO } from './dates.js'

const KEY = (scope) => `yuki_coach_${scope}`

function readCache(scope) {
  try {
    const c = JSON.parse(localStorage.getItem(KEY(scope)) || 'null')
    return c && c.day === todayISO() ? c : null
  } catch {
    return null
  }
}

export function useCoach(scope, signature, extra) {
  const [data, setData] = useState(() => readCache(scope)?.data || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const seq = useRef(0)
  const extraRef = useRef(extra)
  extraRef.current = extra

  const run = useCallback(
    async (force) => {
      const my = ++seq.current
      setLoading(true)
      setError(false)
      const r = await callFn('ai-coach', {
        scope,
        today: todayISO(),
        hour: new Date().getHours(),
        force: !!force,
        ...(extraRef.current || {}),
      })
      if (my !== seq.current) return // a newer request superseded this one
      setLoading(false)
      if (r.ok && r.data?.text) {
        setData(r.data)
        try {
          localStorage.setItem(KEY(scope), JSON.stringify({ day: todayISO(), sig: signature, data: r.data }))
        } catch {
          /* ignore */
        }
      } else setError(true)
    },
    [scope, signature],
  )

  useEffect(() => {
    const cached = readCache(scope)
    if (cached && cached.sig === signature) {
      setData(cached.data)
      return
    }
    const id = setTimeout(() => run(false), data ? 1800 : 250)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, signature])

  return { data, loading, error, refresh: () => run(true) }
}
