import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Register from './pages/Register.jsx'
import Listings from './pages/Listings.jsx'

const NAVY = '#042C53'

function Layout({ children }) {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-white/15 text-white'
        : 'text-white/70 hover:text-white hover:bg-white/10'
    }`

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: NAVY }}>
      <header className="border-b border-white/10">
        <nav className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <Link to="/" className="text-white text-lg font-bold tracking-tight">
            Raising<span className="text-sky-300">Amsterdam</span>
          </Link>
          <div className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Register
            </NavLink>
            <NavLink to="/listings" className={linkClass}>
              Listings
            </NavLink>
          </div>
        </nav>
      </header>

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
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listings" element={<Listings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
