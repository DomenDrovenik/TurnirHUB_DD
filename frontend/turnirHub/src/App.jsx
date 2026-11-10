import { Link, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Register from './pages/Register'

function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        TurnirHub
      </Link>
      <nav>
        {user ? (
          <>
            <span className="muted">{user.displayName}</span>
            <button type="button" className="link" onClick={logout}>
              Odjava
            </button>
          </>
        ) : (
          <>
            <Link to="/prijava">Prijava</Link>
            <Link to="/registracija">Registracija</Link>
          </>
        )}
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route path="/prijava" element={<Login />} />
          <Route path="/registracija" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}
