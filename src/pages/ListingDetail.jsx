import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BADGE, EXPERIENCE_LABELS, formatPrice, LISTING_COLUMNS, openListingContact } from '../lib/listingUtils'
import { Stars } from '../components/Stars'
import ReviewsSection from '../components/ReviewsSection'

function CategoryBadge({ category }) {
  const badge = BADGE[category] ?? { label: category, color: '#9ca3af' }
  return (
    <span
      style={{
        background: `${badge.color}26`,
        color: badge.color,
        borderRadius: 999,
        padding: '4px 12px',
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {badge.label}
    </span>
  )
}

// Small filled pills for array values (age groups, languages, availability).
function Pills({ values, color }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <span
          key={v}
          style={{
            background: color,
            color: '#0b1220',
            borderRadius: 999,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {v}
        </span>
      ))}
    </div>
  )
}

function InfoBlock({ icon, label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="text-white/50 text-sm">
        {icon} {label}
      </span>
      <div className="text-white/90">{children}</div>
    </div>
  )
}

function ContactButton({ listing, user, isMember }) {
  const base = {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    borderRadius: 12,
    padding: '15px',
    fontWeight: 700,
    fontSize: 15,
    textDecoration: 'none',
  }

  // Not signed in → invite to join (free).
  if (!user) {
    return (
      <Link
        to="/register"
        style={{
          ...base,
          background: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        Sign in to contact
      </Link>
    )
  }

  // Signed in but not a member → send to the unlock page.
  if (!isMember) {
    return (
      <Link
        to="/membership"
        style={{
          ...base,
          background: 'linear-gradient(90deg, #a78bfa, #60d0ff)',
          color: '#042C53',
        }}
      >
        🔒 Unlock to contact
      </Link>
    )
  }

  // Member → fetch the number securely on click, then open WhatsApp.
  return (
    <button
      type="button"
      onClick={() => openListingContact(listing.id)}
      style={{
        ...base,
        background: 'linear-gradient(90deg, #34d399, #60d0ff)',
        color: '#0b1220',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      💬 Contact via WhatsApp
    </button>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const isMember = Boolean(profile?.is_member)

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewSummary, setReviewSummary] = useState({ avg: 0, count: 0 })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: dbError } = await supabase
        .from('listings')
        .select(LISTING_COLUMNS)
        .eq('id', id)
        .single()
      if (cancelled) return
      if (dbError) {
        setError(dbError.message)
        setListing(null)
      } else {
        setError('')
        setListing(data)
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const area = listing
    ? [listing.location, listing.postcode].filter(Boolean).join(' | ')
    : ''
  const experienceLabel =
    listing && listing.experience_years != null
      ? EXPERIENCE_LABELS[listing.experience_years] ?? `${listing.experience_years} years`
      : ''

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/listings" className="text-white/60 hover:text-white text-sm font-medium">
        ← Back to listings
      </Link>

      <div style={{ marginTop: 20 }}>
        {loading ? (
          <p className="text-white/50">Loading listing…</p>
        ) : error ? (
          <p style={{ color: '#f87171' }}>Could not load listing: {error}</p>
        ) : !listing ? (
          <p className="text-white/50">This listing doesn’t exist anymore.</p>
        ) : (
          <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '2rem' }}>
            {/* Header */}
            <div className="flex items-start gap-5">
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  flexShrink: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 38,
                  background: 'rgba(167,139,250,0.15)',
                  border: '2px solid rgba(167,139,250,0.4)',
                }}
              >
                {listing.photo_url ? (
                  <img
                    src={listing.photo_url}
                    alt={listing.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>
                    {listing.category === 'babysitter'
                      ? '🍼'
                      : listing.category === 'services'
                        ? '🛠'
                        : '🤝'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-white font-bold text-3xl leading-tight">
                    {listing.title}
                  </h1>
                  <CategoryBadge category={listing.category} />
                </div>
                {reviewSummary.count > 0 && (
                  <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
                    <Stars value={reviewSummary.avg} size={16} />
                    <span className="text-white/60 text-sm">
                      {reviewSummary.avg.toFixed(1)} · {reviewSummary.count}{' '}
                      {reviewSummary.count === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Full description */}
            {listing.description && (
              <p className="text-white/70 mt-4 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            )}

            {/* Info grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5"
              style={{ marginTop: 28 }}
            >
              {area && (
                <InfoBlock icon="📍" label="Area">
                  {area}
                </InfoBlock>
              )}
              {listing.price && (
                <InfoBlock icon="💶" label="Price">
                  {formatPrice(listing.price)}
                </InfoBlock>
              )}
              {experienceLabel && (
                <InfoBlock icon="⭐" label="Experience">
                  {experienceLabel}
                </InfoBlock>
              )}
              {listing.age_groups?.length > 0 && (
                <InfoBlock icon="👶" label="Age groups">
                  <Pills values={listing.age_groups} color="#a78bfa" />
                </InfoBlock>
              )}
              {listing.languages?.length > 0 && (
                <InfoBlock icon="🗣" label="Languages">
                  <Pills values={listing.languages} color="#34d399" />
                </InfoBlock>
              )}
              {listing.availability?.length > 0 && (
                <InfoBlock icon="📅" label="Availability">
                  <Pills values={listing.availability} color="#60d0ff" />
                </InfoBlock>
              )}
            </div>

            {/* Contact */}
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <ContactButton listing={listing} user={user} isMember={isMember} />
            </div>

            {/* Reviews */}
            <ReviewsSection
              listingId={listing.id}
              listingOwnerId={listing.user_id}
              category={listing.category}
              user={user}
              isMember={isMember}
              onSummary={setReviewSummary}
            />
          </div>
        )}
      </div>
    </section>
  )
}
