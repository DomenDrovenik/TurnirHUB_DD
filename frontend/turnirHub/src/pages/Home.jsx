import { useAuth } from '../auth/useAuth'

const ROLE_LABELS = {
  PLAYER: 'igralec',
  ORGANIZER: 'organizator',
  ADMIN: 'administrator',
}

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="card">
      <h1>Pozdravljeni, {user.displayName}!</h1>
      <p>
        Prijavljeni ste kot <strong>{ROLE_LABELS[user.role] || user.role}</strong> ({user.email}).
      </p>
    </div>
  )
}
