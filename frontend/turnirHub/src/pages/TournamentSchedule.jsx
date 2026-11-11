import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { FORMAT_LABELS } from '../tournaments'

const MATCH_STATUS_LABELS = {
  SCHEDULED: 'Predvidena',
  AWAITING_CONFIRMATION: 'Čaka na potrditev',
  CONFIRMED: 'Odigrana',
  DISPUTED: 'Sporna',
  CANCELLED: 'Preklicana',
}

function roundTitle(format, round, totalRounds) {
  if (format === 'ROUND_ROBIN') return `${round}. kolo`
  const left = totalRounds - round
  if (left === 0) return 'Finale'
  if (left === 1) return 'Polfinale'
  if (left === 2) return 'Četrtfinale'
  return `${round}. krog`
}

function TeamName({ team, fallback }) {
  return team ? <strong>{team.name}</strong> : <span className="muted">{fallback}</span>
}

export default function TournamentSchedule() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/api/tournaments/${id}/matches`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (!data) return <p className="muted">Nalaganje ...</p>

  const { tournament, matches } = data
  const totalRounds = matches.reduce((max, m) => Math.max(max, m.round), 0)
  const rounds = [...new Set(matches.map((m) => m.round))]

  return (
    <div>
      <div className="page-header">
        <h1>Razpored: {tournament.name}</h1>
      </div>
      <p className="muted">{FORMAT_LABELS[tournament.format]}</p>

      {matches.length === 0 && (
        <div className="card">
          <p>Razpored še ni bil generiran.</p>
        </div>
      )}

      {rounds.map((round) => (
        <section key={round}>
          <h2>{roundTitle(tournament.format, round, totalRounds)}</h2>
          <ul className="list">
            {matches
              .filter((m) => m.round === round)
              .map((m) => (
                <li key={m.id} className="card">
                  <div className="row">
                    <span>
                      <TeamName team={m.home} fallback="Čaka na zmagovalca" />
                      {' : '}
                      {m.isBye ? (
                        <span className="muted">prosti prehod</span>
                      ) : (
                        <TeamName team={m.away} fallback="Čaka na zmagovalca" />
                      )}
                    </span>
                    {m.homeScore !== null && m.awayScore !== null ? (
                      <strong>
                        {m.homeScore} : {m.awayScore}
                      </strong>
                    ) : (
                      <span className="badge">{m.isBye ? 'Napreduje' : MATCH_STATUS_LABELS[m.status]}</span>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}

      <p>
        <Link to="/">Nazaj</Link>
      </p>
    </div>
  )
}
