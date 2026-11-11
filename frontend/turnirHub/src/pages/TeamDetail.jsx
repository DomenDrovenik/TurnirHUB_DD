import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth/useAuth'
import { REGISTRATION_LABELS, formatDate } from '../tournaments'

export default function TeamDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [openTournaments, setOpenTournaments] = useState([])
  const [tournamentId, setTournamentId] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')

  const load = useCallback(() => {
    return api(`/api/teams/${id}`)
      .then((data) => setTeam(data.team))
      .catch((err) => setError(err.message))
  }, [id])

  const loadRegistrations = useCallback(() => {
    return api(`/api/teams/${id}/registrations`)
      .then((data) => setRegistrations(data.registrations))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    load()
    loadRegistrations()
    api('/api/tournaments/open')
      .then((data) => setOpenTournaments(data.tournaments))
      .catch(() => {})
  }, [load, loadRegistrations])

  async function register(event) {
    event.preventDefault()
    setRegisterError('')
    setRegisterSuccess('')
    try {
      await api(`/api/tournaments/${tournamentId}/registrations`, { method: 'POST', body: { teamId: id } })
      setRegisterSuccess('Prijava je oddana in čaka na potrditev organizatorja.')
      setTournamentId('')
      await loadRegistrations()
    } catch (err) {
      setRegisterError(err.message)
    }
  }

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

      <h2>Prijave na turnirje</h2>
      {registrations.length === 0 && <p className="muted">Ekipa še ni prijavljena na noben turnir.</p>}
      <ul className="list">
        {registrations.map((r) => (
          <li key={r.id} className="card">
            <div className="row">
              <span>
                <strong>{r.tournament.name}</strong>
                <span className="muted"> · začetek {formatDate(r.tournament.startDate)}</span>
              </span>
              <span className={`badge badge-${r.status.toLowerCase()}`}>{REGISTRATION_LABELS[r.status]}</span>
            </div>
            {['IN_PROGRESS', 'FINISHED'].includes(r.tournament.status) && (
              <p>
                <Link to={`/turnirji/${r.tournament.id}/razpored`}>Razpored turnirja</Link>
              </p>
            )}
          </li>
        ))}
      </ul>

      {isCaptain && (
        <form className="card" onSubmit={register}>
          <h2>Prijavi ekipo na turnir</h2>
          {openTournaments.length === 0 ? (
            <p className="muted">Trenutno ni turnirjev z odprtimi prijavami.</p>
          ) : (
            <>
              <label>
                Turnir
                <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} required>
                  <option value="">Izberite turnir ...</option>
                  {openTournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.sport}, {formatDate(t.startDate)})
                    </option>
                  ))}
                </select>
              </label>
              {registerError && <p className="error">{registerError}</p>}
              {registerSuccess && <p className="success">{registerSuccess}</p>}
              <button type="submit" disabled={!tournamentId}>
                Prijavi
              </button>
            </>
          )}
        </form>
      )}
    </div>
  )
}
