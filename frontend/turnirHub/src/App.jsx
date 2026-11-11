import { Link, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import MyTeams from './pages/MyTeams'
import MyTournaments from './pages/MyTournaments'
import Register from './pages/Register'
import TeamDetail from './pages/TeamDetail'
import TournamentSchedule from './pages/TournamentSchedule'
import TournamentForm from './pages/TournamentForm'
import TournamentRegistrations from './pages/TournamentRegistrations'

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
            {user.role !== 'ADMIN' && <Link to="/ekipe">Moje ekipe</Link>}
            {user.role === 'ORGANIZER' && <Link to="/organizator/turniri">Moji turnirji</Link>}
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
            <Route path="/turnirji/:id/razpored" element={<TournamentSchedule />} />
          </Route>
          <Route element={<ProtectedRoute roles={['ORGANIZER']} />}>
            <Route path="/organizator/turniri" element={<MyTournaments />} />
            <Route path="/organizator/turniri/nov" element={<TournamentForm />} />
            <Route path="/organizator/turniri/:id/uredi" element={<TournamentForm />} />
            <Route path="/organizator/turniri/:id/prijave" element={<TournamentRegistrations />} />
          </Route>
          <Route element={<ProtectedRoute roles={['PLAYER', 'ORGANIZER']} />}>
            <Route path="/ekipe" element={<MyTeams />} />
            <Route path="/ekipe/:id" element={<TeamDetail />} />
          </Route>
          <Route path="/prijava" element={<Login />} />
          <Route path="/registracija" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}
