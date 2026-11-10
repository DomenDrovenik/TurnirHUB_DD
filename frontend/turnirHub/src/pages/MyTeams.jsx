import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function MyTeams() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', sport: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api('/api/teams/mine')
      .then((data) => setTeams(data.teams))
      .catch((err) => setError(err.message))
  }, [])

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setSubmitting(true)
    try {
      const data = await api('/api/teams', { method: 'POST', body: form })
      navigate(`/ekipe/${data.team.id}`)
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fields || {})
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Moje ekipe</h1>
      </div>

      {error && <p className="error">{error}</p>}
      {teams === null && !error && <p className="muted">Nalaganje ...</p>}
      {teams?.length === 0 && (
        <div className="card">
          <p>Še niste član nobene ekipe. Ustvarite prvo spodaj.</p>
        </div>
      )}

      <ul className="list">
        {teams?.map((t) => (
          <li key={t.id} className="card">
            <div className="row">
              <strong>{t.name}</strong>
              <Link to={`/ekipe/${t.id}`} className="button secondary">
                Odpri
              </Link>
            </div>
            <p className="muted">
              {t.sport} · {t.members.length} {t.members.length === 1 ? 'član' : 'članov'}
            </p>
          </li>
        ))}
      </ul>

      <form className="card" onSubmit={submit} noValidate>
        <h2>Nova ekipa</h2>
        <label>
          Ime ekipe
          <input name="name" value={form.name} onChange={update} maxLength={60} />
          {fieldErrors.name && <span className="error">{fieldErrors.name}</span>}
        </label>
        <label>
          Šport
          <input name="sport" value={form.sport} onChange={update} />
          {fieldErrors.sport && <span className="error">{fieldErrors.sport}</span>}
        </label>
        <button type="submit" disabled={submitting}>
          Ustvari ekipo
        </button>
      </form>
    </div>
  )
}
