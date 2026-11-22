import { useEffect, useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useData } from '../data.jsx'
import { callFn } from '../lib/supabase.js'
import { todayISO } from '../lib/dates.js'
import VetMode from '../components/VetMode.jsx'
import YukiArt from '../components/YukiArt.jsx'
import Icon from '../components/Icon.jsx'

export default function SettingsTab() {
  const { token, user, logout } = useAuth()
  const { pet, updatePet } = useData()
  const [vetOpen, setVetOpen] = useState(false)
  const [saved, setSaved] = useState(false)

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
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="tab">
      <section className="vet-entry">
        <div className="vet-entry-art"><YukiArt mood="idle" size={92} /></div>
        <div className="vet-entry-txt">
          <h3>Отчёт для ветеринара</h3>
          <p>Вес, питание, витамин C и гигиена — на польском, на одном экране. Открой на приёме или сохрани в PDF.</p>
          <button className="btn btn-cream" onClick={() => setVetOpen(true)}>
            <Icon name="vet" size={20} /> Tryb weterynaryjny
          </button>
        </div>
      </section>
      {vetOpen && <VetMode onClose={() => setVetOpen(false)} />}

      <section className="card form">
        <h3 className="card-title">О питомце</h3>
        <label className="field">
          <span>Имя</span>
          <input value={petName} onChange={(e) => setPetName(e.target.value)} />
        </label>
        <label className="field">
          <span>Дата рождения</span>
          <input type="date" value={birth} max={todayISO()} onChange={(e) => setBirth(e.target.value)} />
        </label>
        <p className="hint">От даты рождения считается возраст в анализе веса и отчёте для ветеринара.</p>
        <button className="btn btn-primary btn-block" onClick={savePet}>
          {saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </section>

      <section className="card form">
        <h3 className="card-title">Пользователи</h3>
        {loading ? (
          <div className="empty">Загрузка…</div>
        ) : (
          <ul className="log log-flat">
            {users.map((u) => (
              <li key={u.id} className="log-row">
                <span className="log-ico"><Icon name={u.is_protected ? 'crown' : 'user'} size={18} /></span>
                <span className="log-main">
                  <span className="log-when">
                    {u.display_name} {u.id === user?.id && <em className="tag-you">вы</em>}
                  </span>
                  <span className="log-by">@{u.username}</span>
                </span>
                {u.is_protected ? (
                  <span className="lock" title="Нельзя удалить"><Icon name="lock" size={16} /></span>
                ) : (
                  <button className="icon-del" onClick={() => removeUser(u.id)} aria-label="Удалить">
                    <Icon name="x" size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <form className="form subform" onSubmit={createUser}>
          <h4 className="sub-title">Добавить пользователя</h4>
          <label className="field">
            <span>Логин</span>
            <input value={nu.username} autoCapitalize="off" autoCorrect="off" onChange={(e) => setNu({ ...nu, username: e.target.value })} />
          </label>
          <label className="field">
            <span>Отображаемое имя</span>
            <input value={nu.display_name} onChange={(e) => setNu({ ...nu, display_name: e.target.value })} />
          </label>
          <label className="field">
            <span>Пароль</span>
            <input type="password" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} />
          </label>
          {err && <div className="form-err">{err}</div>}
          <button className="btn btn-ink btn-block" disabled={busy} type="submit">
            {busy ? 'Добавляем…' : 'Добавить'}
          </button>
        </form>
      </section>

      <button className="btn btn-ghost btn-block" onClick={logout}>
        <Icon name="logout" size={18} /> Выйти из аккаунта
      </button>
      <p className="app-ver">Дневник Юки · сделано с любовью и огурцами</p>
    </div>
  )
}
