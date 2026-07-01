// Yuki — Supabase config + tiny REST/Edge helpers (no SDK, keeps the bundle small).
export const SUPABASE_URL = 'https://qhuutftcfuldqziyhgbu.supabase.co'
// anon (legacy JWT) key — safe to ship; writes are gated by RLS + the login screen.
export const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodXV0ZnRjZnVsZHF6aXloZ2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4OTkxNDEsImV4cCI6MjA5ODQ3NTE0MX0.sKx6CyN1EeWT-crLxvASj0J3H4UKe9VkQGKT9zG66EY'

const baseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

const rest = (path) => `${SUPABASE_URL}/rest/v1/${path}`

// ---- generic REST helpers ----
export async function sel(path) {
  const r = await fetch(rest(path), { headers: baseHeaders })
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`)
  return r.json()
}

export async function ins(table, row, { upsert = false, onConflict } = {}) {
  const headers = { ...baseHeaders, Prefer: `return=representation${upsert ? ',resolution=merge-duplicates' : ''}` }
  // PostgREST merge-duplicates defaults to the PK; point it at the right unique column.
  const path = upsert && onConflict ? `${table}?on_conflict=${onConflict}` : table
  const r = await fetch(rest(path), { method: 'POST', headers, body: JSON.stringify(row) })
  if (!r.ok) throw new Error(`POST ${table} → ${r.status} ${await r.text().catch(() => '')}`)
  const data = await r.json().catch(() => [])
  return Array.isArray(data) ? data[0] : data
}

export async function patch(table, match, changes) {
  const headers = { ...baseHeaders, Prefer: 'return=representation' }
  const r = await fetch(rest(`${table}?${match}`), { method: 'PATCH', headers, body: JSON.stringify(changes) })
  if (!r.ok) throw new Error(`PATCH ${table} → ${r.status}`)
  const data = await r.json().catch(() => [])
  return Array.isArray(data) ? data[0] : data
}

export async function del(table, match) {
  const r = await fetch(rest(`${table}?${match}`), { method: 'DELETE', headers: baseHeaders })
  if (!r.ok) throw new Error(`DELETE ${table} → ${r.status}`)
  return true
}

// ---- Edge Functions ----
export async function callFn(name, body) {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify(body || {}),
    })
    const data = await r.json().catch(() => ({}))
    return { ok: r.ok, status: r.status, data }
  } catch (e) {
    return { ok: false, status: 0, data: { error: String(e) } }
  }
}
