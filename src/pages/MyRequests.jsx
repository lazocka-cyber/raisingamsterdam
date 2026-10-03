import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BADGE, daysAgo, openListingContact } from '../lib/listingUtils'
import { Stars } from '../components/Stars'
import NotifyButton from '../components/NotifyButton'

// The parent's side of "Families looking for help": her requests and who
// offered help. WhatsApp stays locked until membership (get_listing_contact
// only answers paying members).

const NAVY = '#042C53'
const GREEN = '#34d399'
const CTA_GRADIENT = 'linear-gradient(90deg, #34d399, #60d0ff)'

function OfferRow({ offer, rating, isMember }) {
  const l = offer.listing
  const badge = BADGE[l?.category] ?? BADGE.babysitter
  if (!l) return null
  return (
    <div
      className="flex items-center gap-3"
      style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 12px' }}
    >
      <Link
        to={`/listings/${l.id}`}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          background: `${badge.color}26`,
          color: badge.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
        }}
      >
        {l.photo_url ? (
          <img src={l.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          (l.title || '?').trim().charAt(0).toUpperCase()
        )}
      </Link>
      <Link to={`/listings/${l.id}`} className="min-w-0 flex-1">
        <p className="text-white font-semibold text-sm leading-snug" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {l.title}
        </p>
        <p className="text-white/50 text-xs flex items-center gap-1" style={{ marginTop: 2 }}>
          {rating ? (
            <>
              <Stars value={rating.avg_rating} size={11} /> {rating.review_count}
            </>
          ) : (
            <span>{badge.label} · new</span>
          )}
        </p>
      </Link>
      {isMember ? (
        <button
          type="button"
          onClick={() => openListingContact(l.id)}
          style={{
            background: '#25D366',
            color: '#073b1c',
            border: 'none',
            borderRadius: 10,
            padding: '8px 12px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          WhatsApp
        </button>
      ) : (
        <span title="Unlock with membership" style={{ fontSize: 18, opacity: 0.55 }} aria-label="locked">
          🔒
        </span>
      )}
    </div>
  )
}

export default function MyRequests() {
  const { user, isMember } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [requests, setRequests] = useState([])
  const [offers, setOffers] = useState({}) // request_id → offers[]
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(location.state?.toast || '')

  useEffect(() => {
    if (!location.state?.toast) return
    window.history.replaceState({}, '')
    const t = setTimeout(() => setToast(''), 8000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data: reqs } = await supabase
        .from('family_requests')
        .select('id, area, days, age_groups, note, status, expires_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      const list = reqs ?? []
      let grouped = {}
      let ratingMap = {}
      if (list.length) {
        const { data: offerRows } = await supabase
          .from('request_offers')
          .select('id, request_id, created_at, listing:listings(id, title, photo_url, category)')
          .in('request_id', list.map((r) => r.id))
          .order('created_at', { ascending: true })
        for (const o of offerRows ?? []) {
          ;(grouped[o.request_id] ??= []).push(o)
        }
        const listingIds = [...new Set((offerRows ?? []).map((o) => o.listing?.id).filter(Boolean))]
        if (listingIds.length) {
          const { data: ratingRows } = await supabase
            .from('listing_ratings')
            .select('*')
            .in('listing_id', listingIds)
          ratingMap = Object.fromEntries((ratingRows ?? []).map((r) => [r.listing_id, r]))
        }
      }
      if (cancelled) return
      setRequests(list)
      setOffers(grouped)
      setRatings(ratingMap)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  async function closeRequest(id) {
    setBusyId(id)
    const { error } = await supabase.from('family_requests').update({ status: 'closed' }).eq('id', id)
    setBusyId(null)
    if (!error) setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'closed' } : r)))
  }

  const isOpen = (r) => r.status === 'open' && new Date(r.expires_at) > new Date()
  const totalOffers = Object.values(offers).reduce((n, list) => n + list.length, 0)

  return (
    <section className="mx-auto px-6 py-10" style={{ maxWidth: 640 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-white">My requests</h1>
        <button
          type="button"
          onClick={() => navigate('/families/new')}
          style={{ background: GREEN, color: NAVY, border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}
        >
          + New request
        </button>
      </div>

      {toast && (
        <div
          style={{
            background: 'rgba(52,211,153,0.15)',
            border: '1px solid rgba(52,211,153,0.4)',
            color: GREEN,
            borderRadius: 10,
            padding: '12px 16px',
            marginTop: 16,
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}

      <NotifyButton variant="family" />

      {/* Unlock — shown once someone replied and the parent isn't a member yet */}
      {!isMember && totalOffers > 0 && (
        <div
          style={{
            marginTop: 16,
            border: '1px solid rgba(167,139,250,0.5)',
            background: 'rgba(167,139,250,0.1)',
            borderRadius: 16,
            padding: '16px 18px',
          }}
        >
          <p className="text-white font-bold" style={{ fontSize: 18 }}>
            {totalOffers} {totalOffers === 1 ? 'babysitter wants' : 'babysitters want'} to help you
          </p>
          <p className="text-white/65 text-sm" style={{ marginTop: 4 }}>
            Unlock WhatsApp to message them directly. One payment, no subscription.
          </p>
          <Link
            to="/membership"
            style={{
              display: 'block',
              marginTop: 12,
              textAlign: 'center',
              background: CTA_GRADIENT,
              color: NAVY,
              borderRadius: 12,
              padding: '13px 16px',
              fontWeight: 800,
            }}
          >
            🔓 Unlock WhatsApp
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {loading ? (
          <p className="text-white/50">Loading your requests…</p>
        ) : requests.length === 0 ? (
          <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center">
            <p className="text-white/70 text-lg">You haven't posted a request yet.</p>
            <Link
              to="/families/new"
              style={{ display: 'inline-block', marginTop: 16, background: CTA_GRADIENT, color: NAVY, borderRadius: 10, padding: '11px 20px', fontWeight: 800 }}
            >
              Post a free request
            </Link>
          </div>
        ) : (
          requests.map((r) => {
            const list = offers[r.id] ?? []
            const open = isOpen(r)
            return (
              <div key={r.id} style={{ background: '#1a1a2e', borderRadius: 16, padding: '1.25rem', opacity: open ? 1 : 0.6 }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-bold">📍 {r.area}</p>
                    <p className="text-white/50 text-xs" style={{ marginTop: 2 }}>
                      {[...(r.days ?? []), ...(r.age_groups ?? [])].join(' · ')}
                    </p>
                  </div>
                  <span className="text-white/40 text-xs" style={{ whiteSpace: 'nowrap' }}>
                    {open ? `posted ${daysAgo(r.created_at)}` : 'closed'}
                  </span>
                </div>

                <p className="text-white text-sm font-semibold" style={{ marginTop: 14 }}>
                  {list.length === 0
                    ? 'No replies yet'
                    : `${list.length} ${list.length === 1 ? 'reply' : 'replies'}`}
                </p>
                {list.length === 0 && open && (
                  <p className="text-white/50 text-sm" style={{ marginTop: 4 }}>
                    Babysitters can see your request now. Replies appear here.
                  </p>
                )}
                <div className="flex flex-col gap-2" style={{ marginTop: 10 }}>
                  {list.map((o) => (
                    <OfferRow key={o.id} offer={o} rating={ratings[o.listing?.id]} isMember={isMember} />
                  ))}
                </div>

                {open && (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => closeRequest(r.id)}
                    style={{ marginTop: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Found someone ✓ close this request
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
