import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'babysitter', label: 'Babysitters' },
  { key: 'secondhand', label: 'Second-hand' },
  { key: 'services', label: 'Services' },
  { key: 'community', label: 'Community' },
]

const BADGE = {
  babysitter: { label: 'Babysitter', color: '#a78bfa' },
  secondhand: { label: 'Second-hand', color: '#34d399' },
  services: { label: 'Services', color: '#60d0ff' },
  community: { label: 'Community', color: '#f97316' },
}

const PURPLE = '#a78bfa'

function truncate(text, max = 100) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

function CategoryBadge({ category }) {
  const badge = BADGE[category] ?? { label: category, color: '#9ca3af' }
  return (
    <span
      style={{
        background: `${badge.color}26`,
        color: badge.color,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {badge.label}
    </span>
  )
}

function ContactAction({ listing, isParent }) {
  if (isParent) {
    return (
      <a
        href={`mailto:${listing.contact_email}`}
        style={{ color: '#34d399', fontWeight: 600, fontSize: 14 }}
      >
        {listing.contact_email}
      </a>
    )
  }
  return (
    <Link
      to="/register"
      style={{
        background: 'rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      Join as parent to contact
    </Link>
  )
}

function ListingCard({ listing, isParent }) {
  return (
    <div
      style={{ background: '#1a1a2e', borderRadius: 16, padding: '1.5rem' }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-white font-semibold text-lg leading-snug">
          {listing.title}
        </h3>
        <CategoryBadge category={listing.category} />
      </div>

      {listing.description && (
        <p className="text-white/60 text-sm">
          {truncate(listing.description, 100)}
        </p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
        {listing.location && <span>📍 {listing.location}</span>}
        {listing.price && (
          <span className="text-white/80 font-medium">{listing.price}</span>
        )}
      </div>

      <div className="mt-2 pt-3 border-t border-white/10">
        <ContactAction listing={listing} isParent={isParent} />
      </div>
    </div>
  )
}

export default function Listings() {
  const { user, profile } = useAuth()
  const isParent = Boolean(user) && profile?.role === 'parent'

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [active, setActive] = useState('all')

  // Success toast passed via navigate() state from PostListing
  const location = useLocation()
  const [toast, setToast] = useState(location.state?.toast || '')
  useEffect(() => {
    if (!location.state?.toast) return
    // Clear router state so the toast doesn't reappear on refresh / back
    window.history.replaceState({}, '')
    const t = setTimeout(() => setToast(''), 5000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: dbError } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (dbError) {
        setError(dbError.message)
        setListings([])
      } else {
        setError('')
        setListings(data ?? [])
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const visible =
    active === 'all'
      ? listings
      : listings.filter((l) => l.category === active)

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      {toast && (
        <div
          style={{
            background: 'rgba(52,211,153,0.15)',
            border: '1px solid rgba(52,211,153,0.4)',
            color: '#34d399',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}

      <h1 className="text-3xl font-bold text-white">Listings</h1>
      <p className="mt-2 text-white/60">
        Browse the RaisingAmsterdam marketplace.
      </p>

      {/* Category filter pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.key
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActive(cat.key)}
              style={{
                borderRadius: 999,
                padding: '6px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                color: 'white',
                background: isActive ? PURPLE : 'transparent',
                border: isActive
                  ? `1px solid ${PURPLE}`
                  : '1px solid rgba(255,255,255,0.25)',
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="mt-8">
        {loading ? (
          <p className="text-white/50">Loading listings…</p>
        ) : error ? (
          <p style={{ color: '#f87171' }}>Could not load listings: {error}</p>
        ) : visible.length === 0 ? (
          <p className="text-white/50">No listings yet. Be the first to post!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isParent={isParent}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
