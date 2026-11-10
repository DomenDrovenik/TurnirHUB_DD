import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { FORMAT_LABELS, fromLocalInput, toLocalInput } from '../tournaments'

const EMPTY = {
  name: '',
  sport: '',
  format: 'ROUND_ROBIN',
  location: '',
  startDate: '',
  registrationDeadline: '',
  maxTeams: 8,
  minPlayersPerTeam: 5,
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
}

export default function TournamentForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState('DRAFT')
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return undefined
    let cancelled = false
    api(`/api/tournaments/${id}`)
      .then(({ tournament }) => {
        if (cancelled) return
        setStatus(tournament.status)
        setForm({
          ...tournament,
          registrationDeadline: toLocalInput(tournament.registrationDeadline),
        })
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  // Po objavi pravil turnirja ni več mogoče spreminjati.
  const rulesLocked = isEdit && status !== 'DRAFT'

  function setField(name) {
    return (event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setSubmitting(true)
    try {
      const body = {
        ...form,
        registrationDeadline: fromLocalInput(form.registrationDeadline),
        maxTeams: Number(form.maxTeams),
        minPlayersPerTeam: Number(form.minPlayersPerTeam),
        pointsWin: Number(form.pointsWin),
        pointsDraw: Number(form.pointsDraw),
        pointsLoss: Number(form.pointsLoss),
      }
      await api(isEdit ? `/api/tournaments/${id}` : '/api/tournaments', {
        method: isEdit ? 'PUT' : 'POST',
        body,
      })
      navigate('/organizator/turniri')
    } catch (err) {
      setFieldErrors(err.fields || {})
      setError(Object.keys(err.fields || {}).length ? 'Popravite označena polja.' : err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="muted">Nalaganje ...</p>
  }

  const fieldError = (name) => fieldErrors[name] && <span className="error">{fieldErrors[name]}</span>

  return (
    <div className="card">
      <h1>{isEdit ? 'Urejanje turnirja' : 'Nov turnir'}</h1>
      {rulesLocked && (
        <p className="muted">Turnir je objavljen, zato format, število ekip in točkovanje niso več spremenljivi.</p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Ime turnirja
          <input type="text" value={form.name} onChange={setField('name')} required />
          {fieldError('name')}
        </label>
        <label>
          Šport
          <input type="text" value={form.sport} onChange={setField('sport')} placeholder="npr. mali nogomet" required />
          {fieldError('sport')}
        </label>
        <label>
          Format
          <select value={form.format} onChange={setField('format')} disabled={rulesLocked}>
            {Object.entries(FORMAT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldError('format')}
        </label>
        <label>
          Lokacija
          <input type="text" value={form.location} onChange={setField('location')} required />
          {fieldError('location')}
        </label>
        <div className="grid-2">
          <label>
            Datum začetka
            <input type="date" value={form.startDate} onChange={setField('startDate')} required />
            {fieldError('startDate')}
          </label>
          <label>
            Rok prijav
            <input
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={setField('registrationDeadline')}
              required
            />
            {fieldError('registrationDeadline')}
          </label>
        </div>
        <div className="grid-2">
          <label>
            Največ ekip
            <input
              type="number"
              min="2"
              value={form.maxTeams}
              onChange={setField('maxTeams')}
              disabled={rulesLocked}
              required
            />
            {fieldError('maxTeams')}
          </label>
          <label>
            Najmanj igralcev v ekipi
            <input
              type="number"
              min="1"
              value={form.minPlayersPerTeam}
              onChange={setField('minPlayersPerTeam')}
              disabled={rulesLocked}
              required
            />
            {fieldError('minPlayersPerTeam')}
          </label>
        </div>
        {form.format === 'ROUND_ROBIN' && (
          <div className="grid-3">
            <label>
              Točke za zmago
              <input
                type="number"
                min="0"
                value={form.pointsWin}
                onChange={setField('pointsWin')}
                disabled={rulesLocked}
              />
              {fieldError('pointsWin')}
            </label>
            <label>
              Točke za remi
              <input
                type="number"
                min="0"
                value={form.pointsDraw}
                onChange={setField('pointsDraw')}
                disabled={rulesLocked}
              />
              {fieldError('pointsDraw')}
            </label>
            <label>
              Točke za poraz
              <input
                type="number"
                min="0"
                value={form.pointsLoss}
                onChange={setField('pointsLoss')}
                disabled={rulesLocked}
              />
              {fieldError('pointsLoss')}
            </label>
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Shranjevanje ...' : 'Shrani'}
          </button>
          <Link to="/organizator/turniri" className="button secondary">
            Prekliči
          </Link>
        </div>
      </form>
    </div>
  )
}
