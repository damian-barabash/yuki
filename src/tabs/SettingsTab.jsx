import { useEffect, useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useData } from '../data.jsx'
import { callFn } from '../lib/supabase.js'
import { todayISO } from '../lib/dates.js'

export default function SettingsTab() {
  const { token, user } = useAuth()
  const { pet, updatePet } = useData()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [nu, setNu] = useState({ username: '', display_name: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const [petName, setPetName] = useState(pet.name || 'Юки')
  const [birth, setBirth] = useState(pet.birthdate || '2024-02-15')

  useEffect(() => {
    setPetName(pet.name || 'Юки')
    setBirth(pet.birthdate || '2024-02-15')
  }, [pet])

  async function loadUsers() {
    const r = await callFn('manage-users', { action: 'list', token })
    if (r.ok) setUsers(r.data.users || [])
    setLoading(false)
  }
  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createUser(e) {
    e.preventDefault()
    setErr('')
    if (!nu.username.trim() || !nu.password) {
      setErr('Укажите логин и пароль')
      return
    }
    setBusy(true)
    const r = await callFn('manage-users', {
      action: 'create',
      token,
      username: nu.username.trim(),
      display_name: nu.display_name.trim(),
      password: nu.password,
    })
    setBusy(false)
    if (r.ok) {
      setUsers((xs) => [...xs, r.data.user])
      setNu({ username: '', display_name: '', password: '' })
    } else setErr(r.data?.error || 'Не удалось создать')
  }

  async function removeUser(id) {
    setUsers((xs) => xs.filter((u) => u.id !== id))
    const r = await callFn('manage-users', { action: 'delete', token, id })
    if (!r.ok) {
      setErr(r.data?.error || 'Не удалось удалить')
      loadUsers()
    }
  }

  function savePet() {
    updatePet({ name: petName.trim() || 'Юки', birthdate: birth })
  }

  return (
    <div className="tab">
      <div className="card">
        <h3 className="list-title">О питомце</h3>
        <label className="field">
          <span>Имя</span>
          <input value={petName} onChange={(e) => setPetName(e.target.value)} />
        </label>
        <label className="field">
          <span>Дата рождения</span>
          <input type="date" value={birth} max={todayISO()} onChange={(e) => setBirth(e.target.value)} />
        </label>
        <p className="hint">Юки родился 15 февраля — укажи год, чтобы возраст в анализе веса был точным.</p>
        <button className="btn btn-primary btn-block" onClick={savePet}>
          Сохранить
        </button>
      </div>

      <div className="card">
        <h3 className="list-title">Пользователи</h3>
        {loading ? (
          <div className="empty">Загрузка…</div>
        ) : (
          <ul className="log">
            {users.map((u) => (
              <li key={u.id} className="log-row">
                <span className="log-ico">{u.is_protected ? '👑' : '👤'}</span>
                <span className="log-main">
                  <span className="log-when">
                    {u.display_name} {u.id === user?.id && <em className="tag-you">вы</em>}
                  </span>
                  <span className="log-by">@{u.username}</span>
                </span>
                {u.is_protected ? (
                  <span className="lock" title="Нельзя удалить">
                    🔒
                  </span>
                ) : (
                  <button className="icon-del" onClick={() => removeUser(u.id)} title="Удалить">
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <form className="form-grid mt" onSubmit={createUser}>
          <h4 className="sub-title">Добавить пользователя</h4>
          <label className="field">
            <span>Логин</span>
            <input
              value={nu.username}
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(e) => setNu({ ...nu, username: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Отображаемое имя</span>
            <input value={nu.display_name} onChange={(e) => setNu({ ...nu, display_name: e.target.value })} />
          </label>
          <label className="field">
            <span>Пароль</span>
            <input
              type="password"
              value={nu.password}
              onChange={(e) => setNu({ ...nu, password: e.target.value })}
            />
          </label>
          {err && <div className="login-err">{err}</div>}
          <button className="btn btn-primary btn-block" disabled={busy} type="submit">
            {busy ? 'Добавляем…' : '+ Добавить'}
          </button>
        </form>
      </div>
    </div>
  )
}
