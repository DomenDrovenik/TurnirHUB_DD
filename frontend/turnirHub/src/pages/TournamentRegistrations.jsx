import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { REGISTRATION_LABELS } from '../tournaments'

export default function TournamentRegistrations() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const load = useCallback(() => {
    return api(`/api/tournaments/${id}/registrations`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function decide(registration, status) {
    setActionError('')
    try {
      await api(`/api/tournaments/${id}/registrations/${registration.id}/status`, {
        method: 'POST',
        body: { status },
      })
      await load()
    } catch (err) {
      setActionError(err.message)
    }
  }

  if (error) {
    return (
      <div>
        <p className="error">{error}</p>
        <Link to="/organizator/turniri">Nazaj na turnirje</Link>
      </div>
    )
  }
  if (!data) return <p className="muted">Nalaganje ...</p>

  const approved = data.registrations.filter((r) => r.status === 'APPROVED').length

  return (
    <div>
      <div className="page-header">
        <h1>Prijave: {data.tournament.name}</h1>
        <Link to="/organizator/turniri" className="button secondary">
          Moji turnirji
        </Link>
      </div>
      <p className="muted">
        Potrjenih ekip: {approved} / {data.tournament.maxTeams}
      </p>

      {actionError && <p className="error">{actionError}</p>}
      {data.registrations.length === 0 && (
        <div className="card">
          <p>Za ta turnir še ni prijav.</p>
        </div>
      )}

      <ul className="list">
        {data.registrations.map((r) => (
          <li key={r.id} className="card">
            <div className="row">
              <strong>{r.team.name}</strong>
              <span className={`badge badge-${r.status.toLowerCase()}`}>{REGISTRATION_LABELS[r.status]}</span>
            </div>
            <p className="muted">
              {r.team.sport} · {r.team.memberCount} članov · kapetan {r.team.captain.displayName} (
              {r.team.captain.email})
            </p>
            {r.status === 'PENDING' && (
              <div className="actions">
                <button type="button" onClick={() => decide(r, 'APPROVED')}>
                  Potrdi
                </button>
                <button type="button" className="danger" onClick={() => decide(r, 'REJECTED')}>
                  Zavrni
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
