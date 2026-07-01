import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { callFn } from './lib/supabase.js'

const KEY = 'yuki_token'
const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(KEY) || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    if (!token) {
      setLoading(false)
      return
    }
    callFn('app-auth', { action: 'me', token }).then((r) => {
      if (!alive) return
      if (r.ok && r.data.user) setUser(r.data.user)
      else {
        localStorage.removeItem(KEY)
        setToken('')
      }
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (username, password) => {
    const r = await callFn('app-auth', { action: 'login', username, password })
    if (r.ok && r.data.token) {
      localStorage.setItem(KEY, r.data.token)
      setToken(r.data.token)
      setUser(r.data.user)
      return { ok: true }
    }
    return { ok: false, error: r.data?.error || 'Ошибка входа' }
  }, [])

  const logout = useCallback(async () => {
    if (token) await callFn('app-auth', { action: 'logout', token })
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
