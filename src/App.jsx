import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Home from './pages/Home.jsx'
import Register from './pages/Register.jsx'
import Listings from './pages/Listings.jsx'
import Dashboard from './pages/Dashboard.jsx'

const NAVY = '#042C53'

const linkClass = ({ isActive }) =>
  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-white/15 text-white'
      : 'text-white/70 hover:text-white hover:bg-white/10'
  }`

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="px-6 py-16 text-center text-white/60">Loading…</div>
    )
  }
  if (!user) {
    return <Navigate to="/register" replace />
  }
  return children
}

function NavBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="border-b border-white/10">
      <nav className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-white text-lg font-bold tracking-tight">
          Raising<span className="text-sky-300">Amsterdam</span>
        </Link>
        <div className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/listings" className={linkClass}>
            Listings
          </NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/register" className={linkClass}>
              Register
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  )
}

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: NAVY }}>
      <NavBar />
      <main className="flex-1 w-full">{children}</main>
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} RaisingAmsterdam
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/listings" element={<Listings />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}
