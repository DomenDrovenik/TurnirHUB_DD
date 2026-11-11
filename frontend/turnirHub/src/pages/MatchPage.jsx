import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'

const STATUS_LABELS = {
  SCHEDULED: 'Predvidena',
  AWAITING_CONFIRMATION: 'Čaka na potrditev nasprotnika',
  CONFIRMED: 'Rezultat potrjen',
  DISPUTED: 'Rezultat sporen',
  CANCELLED: 'Preklicana',
}

function ScoreForm({ match, submitLabel, onSubmit }) {
  const [scores, setScores] = useState({ homeScore: '', awayScore: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function submit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    try {
      await onSubmit(scores)
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fields || {})
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid-2">
        <label>
          {match.home.name}
          <input
            type="number"
            min="0"
            value={scores.homeScore}
            onChange={(e) => setScores({ ...scores, homeScore: e.target.value })}
          />
          {fieldErrors.homeScore && <span className="error">{fieldErrors.homeScore}</span>}
        </label>
        <label>
          {match.away.name}
          <input
            type="number"
            min="0"
            value={scores.awayScore}
            onChange={(e) => setScores({ ...scores, awayScore: e.target.value })}
          />
          {fieldErrors.awayScore && <span className="error">{fieldErrors.awayScore}</span>}
        </label>
      </div>
      {error && !fieldErrors.homeScore && !fieldErrors.awayScore && <p className="error">{error}</p>}
      <button type="submit">{submitLabel}</button>
    </form>
  )
}

export default function MatchPage() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const load = useCallback(() => {
    return api(`/api/matches/${id}`)
      .then((data) => setMatch(data.match))
      .catch((err) => setError(err.message))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function submitScores(path, scores) {
    const data = await api(`/api/matches/${id}/${path}`, { method: 'POST', body: scores })
    setMatch(data.match)
  }

  async function respond(path) {
    setActionError('')
    try {
      const data = await api(`/api/matches/${id}/${path}`, { method: 'POST' })
      setMatch(data.match)
    } catch (err) {
      setActionError(err.message)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!match) return <p className="muted">Nalaganje ...</p>

  const { permissions } = match
  const hasScore = match.homeScore !== null && match.awayScore !== null
  const reporter = [match.home, match.away].find((t) => t && t.id === match.reportedByTeamId)

  return (
    <div>
      <div className="page-header">
        <h1>
          {match.home ? match.home.name : '?'} : {match.away ? match.away.name : '?'}
        </h1>
        <Link to={`/turnirji/${match.tournament.id}/razpored`} className="button secondary">
          Razpored
        </Link>
      </div>
      <p className="muted">
        {match.tournament.name} · {STATUS_LABELS[match.status]}
      </p>

      {hasScore && (
        <div className="card">
          <h2>
            {match.homeScore} : {match.awayScore}
          </h2>
          {reporter && match.status !== 'CONFIRMED' && <p className="muted">Rezultat je vnesla ekipa {reporter.name}.</p>}
        </div>
      )}

      {actionError && <p className="error">{actionError}</p>}

      {permissions.canReport && (
        <div className="card">
          <h2>Vnos rezultata</h2>
          <p className="muted">Rezultat mora potrditi kapetan nasprotne ekipe.</p>
          <ScoreForm match={match} submitLabel="Vnesi rezultat" onSubmit={(s) => submitScores('result', s)} />
        </div>
      )}

      {permissions.canRespond && (
        <div className="card">
          <h2>Potrditev rezultata</h2>
          <p>Ali se strinjate z rezultatom {match.homeScore} : {match.awayScore}?</p>
          <div className="actions">
            <button type="button" onClick={() => respond('confirm')}>
              Potrdi
            </button>
            <button type="button" className="danger" onClick={() => respond('dispute')}>
              Ospori
            </button>
          </div>
        </div>
      )}

      {permissions.canResolve && (
        <div className="card">
          <h2>Razrešitev spora</h2>
          <p className="muted">Kot organizator določite končni rezultat.</p>
          <ScoreForm match={match} submitLabel="Določi končni rezultat" onSubmit={(s) => submitScores('resolve', s)} />
        </div>
      )}
    </div>
  )
}
