import { useEffect, useState } from 'react'
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
import { supabase } from './lib/supabase'
import Home from './pages/Home.jsx'
import Register from './pages/Register.jsx'
import Listings from './pages/Listings.jsx'
import Guides from './pages/Guides.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PostListing from './pages/PostListing.jsx'
import MyListings from './pages/MyListings.jsx'
import SosBoard from './pages/SosBoard.jsx'
import PostSos from './pages/PostSos.jsx'

const NAVY = '#042C53'

// Handles the Supabase magic-link redirect. Supabase appends #access_token
// to the URL hash; once the session is established we send the user to the
// dashboard.
function AuthCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      supabase.auth.getSession().then(() => {
        navigate('/dashboard', { replace: true })
      })
    }
  }, [navigate])
  return null
}

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
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  // The links shared by the desktop row and the mobile dropdown.
  const navLinks = (
    <>
      <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
        Home
      </NavLink>
      <NavLink to="/listings" className={linkClass} onClick={() => setOpen(false)}>
        Listings
      </NavLink>
      <NavLink to="/guides" className={linkClass} onClick={() => setOpen(false)}>
        Guides
      </NavLink>
      <NavLink
        to="/sos"
        className={linkClass}
        title="Need a sitter urgently?"
        onClick={() => setOpen(false)}
      >
        <span className="sos-nav">🚨 SOS</span>
      </NavLink>
      {user ? (
        <>
          <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/my-listings" className={linkClass} onClick={() => setOpen(false)}>
            My listings
          </NavLink>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 rounded-md text-sm font-medium text-left text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
        </>
      ) : (
        <NavLink to="/register" className={linkClass} onClick={() => setOpen(false)}>
          Register
        </NavLink>
      )}
    </>
  )

  return (
    <header
      className="border-b border-white/10"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <nav className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-white text-lg font-bold tracking-tight"
          onClick={() => setOpen(false)}
        >
          Raising<span className="text-sky-300">Amsterdam</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-1">{navLinks}</div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden flex flex-col justify-center gap-[5px] p-2 rounded-md hover:bg-white/10 transition-colors"
        >
          <span
            className="block h-0.5 w-6 bg-white transition-transform"
            style={open ? { transform: 'translateY(7px) rotate(45deg)' } : undefined}
          />
          <span
            className="block h-0.5 w-6 bg-white transition-opacity"
            style={open ? { opacity: 0 } : undefined}
          />
          <span
            className="block h-0.5 w-6 bg-white transition-transform"
            style={open ? { transform: 'translateY(-7px) rotate(-45deg)' } : undefined}
          />
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="sm:hidden border-t border-white/10 px-4 pb-4 pt-2">
          <div className="flex flex-col gap-1">{navLinks}</div>
        </div>
      )}
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
        <AuthCallback />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/sos" element={<SosBoard />} />
            <Route
              path="/sos/new"
              element={
                <ProtectedRoute>
                  <PostSos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-listings"
              element={
                <ProtectedRoute>
                  <MyListings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/post-listing"
              element={
                <ProtectedRoute>
                  <PostListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/post-listing/:id"
              element={
                <ProtectedRoute>
                  <PostListing />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}
