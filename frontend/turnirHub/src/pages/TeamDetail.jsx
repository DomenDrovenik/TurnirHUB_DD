import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth/useAuth'

export default function TeamDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [identifier, setIdentifier] = useState('')

  const load = useCallback(() => {
    return api(`/api/teams/${id}`)
      .then((data) => setTeam(data.team))
      .catch((err) => setError(err.message))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function addMember(event) {
    event.preventDefault()
    setActionError('')
    try {
      const data = await api(`/api/teams/${id}/members`, { method: 'POST', body: { identifier } })
      setTeam(data.team)
      setIdentifier('')
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function removeMember(member) {
    if (!window.confirm(`Odstranim člana „${member.displayName}"?`)) return
    setActionError('')
    try {
      const data = await api(`/api/teams/${id}/members/${member.userId}`, { method: 'DELETE' })
      setTeam(data.team)
    } catch (err) {
      setActionError(err.message)
    }
  }

  if (error) {
    return (
      <div>
        <p className="error">{error}</p>
        <Link to="/ekipe">Nazaj na ekipe</Link>
      </div>
    )
  }
  if (!team) return <p className="muted">Nalaganje ...</p>

  const isCaptain = user.id === team.captainId

  return (
    <div>
      <div className="page-header">
        <h1>{team.name}</h1>
        <Link to="/ekipe" className="button secondary">
          Moje ekipe
        </Link>
      </div>
      <p className="muted">
        {team.sport} · {team.members.length} {team.members.length === 1 ? 'član' : 'članov'}
      </p>

      {actionError && <p className="error">{actionError}</p>}

      <ul className="list">
        {team.members.map((m) => (
          <li key={m.userId} className="card">
            <div className="row">
              <span>
                <strong>{m.displayName}</strong>
                {m.isCaptain && <span className="badge"> Kapetan</span>}
                {m.email && <span className="muted"> · {m.email}</span>}
              </span>
              {isCaptain && !m.isCaptain && (
                <button type="button" className="danger" onClick={() => removeMember(m)}>
                  Odstrani
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {isCaptain && (
        <form className="card" onSubmit={addMember}>
          <h2>Dodaj člana</h2>
          <label>
            E-pošta ali uporabniško ime
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </label>
          <button type="submit">Dodaj</button>
        </form>
      )}
    </div>
  )
}
