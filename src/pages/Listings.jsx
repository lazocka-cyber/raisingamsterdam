import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BADGE, formatPrice, waNumber } from '../lib/listingUtils'
import { Stars } from '../components/Stars'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'babysitter', label: 'Babysitters' },
  { key: 'services', label: 'Services' },
  { key: 'community', label: 'Community' },
]

// A one-line explainer per category, shown under the filter pills so parents
// instantly understand what belongs where.
const CATEGORY_HINTS = {
  all: 'Everything in one place — babysitters, local services and community groups.',
  babysitter: '🍼 Babysitters offering childcare — browse profiles, reviews and rates.',
  services: '🛠 Paid local services for families — cleaning, tutoring, classes, photography and more.',
  community: '🤝 Community & groups — playgroups, language groups and (often free) activities to join.',
}

// Filter options (mirror the Post-a-Listing form)
const LANGUAGES = ['English', 'Dutch', 'French', 'German', 'Spanish', 'Other']
const AGE_GROUPS = ['0-1 year', '1-2 years', '2-4 years', '4-6 years', '6-12 years']

const PURPLE = '#a78bfa'

const selectStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 10,
  padding: '9px 14px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  cursor: 'pointer',
}

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

// Small round avatar: the uploaded photo, or a tinted emoji fallback.
function ListingAvatar({ listing }) {
  const badge = BADGE[listing.category] ?? { color: '#9ca3af' }
  const fallback =
    listing.category === 'babysitter' ? '🍼' : listing.category === 'services' ? '🛠' : '🤝'
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        background: `${badge.color}1f`,
        border: `1px solid ${badge.color}55`,
      }}
    >
      {listing.photo_url ? (
        <img
          src={listing.photo_url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
}

const pillStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
}

function ContactAction({ listing, user, isMember }) {
  // Stop the click from bubbling to the card's navigate handler.
  const stop = (e) => e.stopPropagation()

  // Not signed in → invite to join (free).
  if (!user) {
    return (
      <Link to="/register" onClick={stop} style={{ ...pillStyle, color: 'rgba(255,255,255,0.55)' }}>
        Sign in to contact
      </Link>
    )
  }

  // Signed in but not a member → send to the unlock page.
  if (!isMember) {
    return (
      <Link to="/membership" onClick={stop} style={{ color: '#a78bfa', fontWeight: 700, fontSize: 14 }}>
        🔒 Unlock to contact
      </Link>
    )
  }

  // Member, but the listing has no number.
  if (!listing.phone) {
    return (
      <span style={{ ...pillStyle, color: 'rgba(255,255,255,0.4)' }}>No contact info</span>
    )
  }

  // Member with a number → live WhatsApp link.
  return (
    <a
      href={`https://wa.me/${waNumber(listing.phone)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={stop}
      style={{ color: '#34d399', fontWeight: 600, fontSize: 14 }}
    >
      💬 Contact via WhatsApp
    </a>
  )
}

function ListingCard({ listing, user, isMember, rating }) {
  const navigate = useNavigate()
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/listings/${listing.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/listings/${listing.id}`)
        }
      }}
      style={{ background: '#1a1a2e', borderRadius: 16, padding: '1.5rem', cursor: 'pointer' }}
      className="listing-card flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <ListingAvatar listing={listing} />
        <div className="flex items-start justify-between gap-3 flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg leading-snug">
            {listing.title}
          </h3>
          <CategoryBadge category={listing.category} />
        </div>
      </div>

      {rating?.review_count > 0 && (
        <span className="flex items-center gap-2 text-white/55 text-xs">
          <Stars value={Number(rating.avg_rating)} size={13} />
          {Number(rating.avg_rating).toFixed(1)} ({rating.review_count})
        </span>
      )}

      {listing.description && (
        <p className="text-white/60 text-sm">
          {truncate(listing.description, 100)}
        </p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
        {listing.location && <span>📍 {listing.location}</span>}
        {listing.price && (
          <span className="text-white/80 font-medium">💶 {formatPrice(listing.price)}</span>
        )}
      </div>

      <div className="mt-2 pt-3 border-t border-white/10">
        <ContactAction listing={listing} user={user} isMember={isMember} />
      </div>
    </div>
  )
}

export default function Listings() {
  const { user, profile } = useAuth()
  const isMember = Boolean(profile?.is_member)

  const [listings, setListings] = useState([])
  const [ratings, setRatings] = useState({})
  const [sosCount, setSosCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Initial category can come from the URL (?cat=babysitter), e.g. when the
  // user taps a card on the Home page. Falls back to 'all'.
  const [active, setActive] = useState(() => {
    const cat = new URLSearchParams(window.location.search).get('cat')
    return ['babysitter', 'services', 'community'].includes(cat) ? cat : 'all'
  })

  // Search & filters
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('')
  const [ageGroup, setAgeGroup] = useState('')

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

      // Ratings are a nice-to-have; load them separately so a missing
      // listing_ratings view never blocks the listings themselves.
      const { data: ratingRows } = await supabase.from('listing_ratings').select('*')
      if (!cancelled && ratingRows) {
        const map = {}
        for (const r of ratingRows) map[r.listing_id] = r
        setRatings(map)
      }

      // Active SOS count for the urgent banner (non-blocking nice-to-have).
      const { count } = await supabase
        .from('sos_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open')
        .gt('expires_at', new Date().toISOString())
      if (!cancelled && typeof count === 'number') setSosCount(count)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const q = query.trim().toLowerCase()
  const visible = listings.filter((l) => {
    if (active !== 'all' && l.category !== active) return false
    if (language && !(l.languages ?? []).includes(language)) return false
    if (ageGroup && !(l.age_groups ?? []).includes(ageGroup)) return false
    if (q) {
      const haystack = [l.title, l.description, l.location, l.postcode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const hasFilters = Boolean(q || language || ageGroup || active !== 'all')

  function clearFilters() {
    setQuery('')
    setLanguage('')
    setAgeGroup('')
    setActive('all')
  }

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
        Trusted babysitters and local family services in Amsterdam — for a little
        more peace of mind.
      </p>

      {sosCount > 0 && (
        <Link to="/sos" className="sos-banner">
          <span className="sos-banner__dot" />
          🚨 {sosCount} {sosCount === 1 ? 'family needs' : 'families need'} a sitter right now
          <span className="sos-banner__cta">See SOS →</span>
        </Link>
      )}

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

      {/* One-line explainer for the selected category */}
      <p className="mt-3 text-white/55 text-sm">{CATEGORY_HINTS[active]}</p>

      {/* Search + filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Search by name, area, keyword…"
          style={{
            ...selectStyle,
            cursor: 'text',
            flex: '1 1 240px',
            minWidth: 200,
          }}
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={selectStyle}
        >
          <option value="" style={{ color: 'black' }}>
            🗣 Any language
          </option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l} style={{ color: 'black' }}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
          style={selectStyle}
        >
          <option value="" style={{ color: 'black' }}>
            👶 Any age group
          </option>
          {AGE_GROUPS.map((a) => (
            <option key={a} value={a} style={{ color: 'black' }}>
              {a}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10,
              padding: '9px 14px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mt-8">
        {loading ? (
          <p className="text-white/50">Loading listings…</p>
        ) : error ? (
          <p style={{ color: '#f87171' }}>Could not load listings: {error}</p>
        ) : visible.length === 0 ? (
          <p className="text-white/50">
            {hasFilters
              ? 'No listings match your search. Try clearing the filters.'
              : 'No listings yet. Be the first to post!'}
          </p>
        ) : (
          <>
            <p className="text-white/40 text-sm mb-4">
              {visible.length} {visible.length === 1 ? 'listing' : 'listings'}
              {hasFilters ? ' found' : ''}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  user={user}
                  isMember={isMember}
                  rating={ratings[listing.id]}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
