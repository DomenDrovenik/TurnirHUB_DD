import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setSubmitting(true)
    try {
      await register(email, displayName, password)
      navigate('/prijava', { replace: true, state: { registered: true } })
    } catch (err) {
      setFieldErrors(err.fields || {})
      setError(Object.keys(err.fields || {}).length ? '' : err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h1>Registracija</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          E-pošta
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {fieldErrors.email && <span className="error">{fieldErrors.email}</span>}
        </label>
        <label>
          Prikazno ime
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="nickname"
            required
          />
          {fieldErrors.displayName && <span className="error">{fieldErrors.displayName}</span>}
        </label>
        <label>
          Geslo (vsaj 8 znakov)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          {fieldErrors.password && <span className="error">{fieldErrors.password}</span>}
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Registracija ...' : 'Registriraj se'}
        </button>
      </form>
      <p className="muted">
        Že imate račun? <Link to="/prijava">Prijava</Link>
      </p>
    </div>
  )
}
