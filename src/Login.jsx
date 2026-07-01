import { useState } from 'react'
import { useAuth } from './auth.jsx'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const r = await login(username.trim(), password)
    setBusy(false)
    if (!r.ok) setErr(r.error)
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-pig" aria-hidden>🐹</div>
        <h1 className="login-title">Юки</h1>
        <p className="login-sub">Дневник нашей морской свинки</p>

        <label className="field">
          <span>Имя</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Dmytrii"
          />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {err && <div className="login-err">{err}</div>}

        <button className="btn btn-primary btn-lg" disabled={busy} type="submit">
          {busy ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
