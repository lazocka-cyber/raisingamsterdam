import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BADGE, formatPrice } from '../lib/listingUtils'

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
        whiteSpace: 'nowrap',
      }}
    >
      {badge.label}
    </span>
  )
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function MyListingCard({ listing, onEdit, onDelete, deleting }) {
  const [confirming, setConfirming] = useState(false)

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

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
        {listing.location && <span>📍 {listing.location}</span>}
        {listing.price && (
          <span className="text-white/80 font-medium">{formatPrice(listing.price)}</span>
        )}
        {listing.created_at && <span>🗓 {formatDate(listing.created_at)}</span>}
      </div>

      <div className="mt-2 pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
        <Link
          to={`/listings/${listing.id}`}
          style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600 }}
        >
          View
        </Link>
        <button
          type="button"
          onClick={() => onEdit(listing.id)}
          style={{
            background: 'rgba(96,208,255,0.12)',
            color: '#60d0ff',
            border: '1px solid rgba(96,208,255,0.3)',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ✏️ Edit
        </button>

        {confirming ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-white/60 text-sm">Delete?</span>
            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete(listing.id)}
              style={{
                background: '#f87171',
                color: '#0b1220',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            style={{
              marginLeft: 'auto',
              background: 'rgba(248,113,113,0.12)',
              color: '#f87171',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🗑 Delete
          </button>
        )}
      </div>
    </div>
  )
}

export default function MyListings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(location.state?.toast || '')

  // Clear any toast passed via navigate() state so it doesn't reappear on refresh.
  useEffect(() => {
    if (!location.state?.toast) return
    window.history.replaceState({}, '')
    const t = setTimeout(() => setToast(''), 5000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: dbError } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
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
  }, [user])

  async function handleDelete(id) {
    setDeletingId(id)
    setError('')
    const { error: dbError } = await supabase.from('listings').delete().eq('id', id)
    setDeletingId(null)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setListings((prev) => prev.filter((l) => l.id !== id))
    setToast('Listing deleted.')
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">My listings</h1>
          <p className="mt-2 text-white/60">Manage the listings you’ve posted.</p>
        </div>
        <Link
          to="/post-listing"
          style={{
            background: '#34d399',
            color: '#042C53',
            borderRadius: 10,
            padding: '10px 20px',
            fontWeight: 600,
          }}
        >
          + New listing
        </Link>
      </div>

      {toast && (
        <div
          style={{
            background: 'rgba(52,211,153,0.15)',
            border: '1px solid rgba(52,211,153,0.4)',
            color: '#34d399',
            borderRadius: 10,
            padding: '12px 16px',
            marginTop: 16,
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <p className="text-white/50">Loading your listings…</p>
        ) : error ? (
          <p style={{ color: '#f87171' }}>Something went wrong: {error}</p>
        ) : listings.length === 0 ? (
          <div
            style={{ background: '#1a1a2e', borderRadius: 16 }}
            className="p-10 text-center"
          >
            <p className="text-white/70 text-lg">You haven’t posted any listings yet.</p>
            <button
              type="button"
              onClick={() => navigate('/post-listing')}
              style={{
                marginTop: 20,
                background: '#34d399',
                color: '#042C53',
                borderRadius: 10,
                padding: '12px 24px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Post your first listing
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <MyListingCard
                key={listing.id}
                listing={listing}
                deleting={deletingId === listing.id}
                onEdit={(id) => navigate(`/post-listing/${id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
