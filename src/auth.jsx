import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { callFn } from './lib/supabase.js'

const KEY = 'yuki_auth'
const MAX_AGE = 90 * 24 * 60 * 60 * 1000 // keep the login for 3 months
const AuthCtx = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s?.token || !s?.user) return null
    if (s.exp && s.exp < Date.now()) return null // expired locally
    return s
  } catch {
    return null
  }
}

function save(token, user) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ token, user, exp: Date.now() + MAX_AGE }))
  } catch {
    /* ignore quota / private mode */
  }
}

export function AuthProvider({ children }) {
  const initial = load()
  const [token, setToken] = useState(initial?.token || '')
  const [user, setUser] = useState(initial?.user || null)
  // If we already have a stored session, we're logged in immediately — no network gate.
  const [loading, setLoading] = useState(false)

  // Background re-validation. We only log out on an EXPLICIT "session invalid" (401),
  // never on network errors / cold starts — so the login sticks for the full 90 days.
  useEffect(() => {
    if (!token) return
    let alive = true
    callFn('app-auth', { action: 'me', token }).then((r) => {
      if (!alive) return
      if (r.ok && r.data.user) {
        setUser(r.data.user)
        save(token, r.data.user) // slide the 90-day window forward on every visit
      } else if (r.status === 401) {
        // server explicitly rejected the session → real logout
        localStorage.removeItem(KEY)
        setToken('')
        setUser(null)
      }
      // any other case (network error, 5xx, cold start) → keep the local session
    })
    return () => {
      alive = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (username, password) => {
    const r = await callFn('app-auth', { action: 'login', username, password })
    if (r.ok && r.data.token) {
      save(r.data.token, r.data.user)
      setToken(r.data.token)
      setUser(r.data.user)
      return { ok: true }
    }
    return { ok: false, error: r.data?.error || 'Ошибка входа' }
  }, [])

  const logout = useCallback(async () => {
    if (token) callFn('app-auth', { action: 'logout', token }) // fire-and-forget
    localStorage.removeItem(KEY)
    setToken('')
    setUser(null)
  }, [token])

  return <AuthCtx.Provider value={{ token, user, loading, login, logout }}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
