import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

// Zaščitena pot: neprijavljene preusmeri na prijavo, uporabnike brez ustrezne vloge zavrne.
// Uporaba: <Route element={<ProtectedRoute roles={['ORGANIZER', 'ADMIN']} />}> ... </Route>
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="muted">Nalaganje ...</p>
  }

  if (!user) {
    return <Navigate to="/prijava" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card">
        <h1>Dostop zavrnjen</h1>
        <p>Nimate dovoljenja za ogled te strani.</p>
      </div>
    )
  }

  return <Outlet />
}
