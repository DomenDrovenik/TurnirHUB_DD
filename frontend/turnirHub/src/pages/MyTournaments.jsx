import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { FORMAT_LABELS, STATUS_LABELS, formatDate } from '../tournaments'

// Katera dejanja so na voljo v posameznem stanju turnirja.
const ACTIONS = {
  DRAFT: [{ label: 'Objavi', status: 'REGISTRATION_OPEN' }],
  REGISTRATION_OPEN: [{ label: 'Zapri prijave', status: 'REGISTRATION_CLOSED' }],
}
const CANCELLABLE = ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS']
const EDITABLE = ['DRAFT', 'REGISTRATION_OPEN']

export default function MyTournaments() {
  const [tournaments, setTournaments] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    return api('/api/tournaments/mine')
      .then((data) => setTournaments(data.tournaments))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function changeStatus(tournament, status, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return
    setError('')
    try {
      await api(`/api/tournaments/${tournament.id}/status`, { method: 'POST', body: { status } })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Moji turnirji</h1>
        <Link to="/organizator/turniri/nov" className="button">
          Nov turnir
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {tournaments === null && !error && <p className="muted">Nalaganje ...</p>}
      {tournaments?.length === 0 && (
        <div className="card">
          <p>Še nimate turnirjev. Ustvarite prvega z gumbom „Nov turnir".</p>
        </div>
      )}

      <ul className="list">
        {tournaments?.map((t) => (
          <li key={t.id} className="card">
            <div className="row">
              <strong>{t.name}</strong>
              <span className={`badge badge-${t.status.toLowerCase()}`}>{STATUS_LABELS[t.status]}</span>
            </div>
            <p className="muted">
              {t.sport} · {t.location} · začetek {formatDate(t.startDate)} · {FORMAT_LABELS[t.format]}
              <br />
              Do {t.maxTeams} ekip, najmanj {t.minPlayersPerTeam} igralcev v ekipi
            </p>
            <div className="actions">
              {t.status !== 'DRAFT' && (
                <Link to={`/organizator/turniri/${t.id}/prijave`} className="button secondary">
                  Prijave
                </Link>
              )}
              {EDITABLE.includes(t.status) && (
                <Link to={`/organizator/turniri/${t.id}/uredi`} className="button secondary">
                  Uredi
                </Link>
              )}
              {(ACTIONS[t.status] || []).map((action) => (
                <button key={action.status} type="button" onClick={() => changeStatus(t, action.status)}>
                  {action.label}
                </button>
              ))}
              {CANCELLABLE.includes(t.status) && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => changeStatus(t, 'CANCELLED', `Res želite preklicati turnir „${t.name}"?`)}
                >
                  Prekliči
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
