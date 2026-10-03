import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { daysAgo } from '../lib/listingUtils'
import LinkifiedText from '../components/LinkifiedText'
import { setParentIntent } from '../lib/intent'

// "Families looking for help" — parents post requests for free, sitters and
// services with a listing tap "I can help". See supabase/family_requests.sql.

const GREEN = '#34d399'
const NAVY = '#042C53'
const CTA_GRADIENT = 'linear-gradient(90deg, #34d399, #60d0ff)'

function Tag({ children, color }) {
  return (
    <span
      style={{
        background: `${color}26`,
        color,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function RequestCard({ request, offerCount, action }) {
  return (
    <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '1.25rem 1.25rem 1rem' }}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-white font-bold text-lg leading-snug">📍 {request.area}</p>
        <span className="text-white/40 text-xs" style={{ whiteSpace: 'nowrap', marginTop: 4 }}>
          {daysAgo(request.created_at)}
        </span>
      </div>

      {(request.days?.length > 0 || request.age_groups?.length > 0) && (
        <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
          {request.days?.map((d) => (
            <Tag key={d} color="#60d0ff">
              {d}
            </Tag>
          ))}
          {request.age_groups?.map((a) => (
            <Tag key={a} color="#a78bfa">
              👶 {a}
            </Tag>
          ))}
        </div>
      )}

      {request.note && (
        <LinkifiedText
          text={request.note}
          className="text-white/75 text-sm whitespace-pre-line"
          style={{ marginTop: 10 }}
        />
      )}

      {offerCount > 0 && (
        <p className="text-white/50 text-xs" style={{ marginTop: 10 }}>
          🙋 {offerCount} {offerCount === 1 ? 'person has' : 'people have'} offered help
        </p>
      )}

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {action}
      </div>
    </div>
  )
}

const helpBtn = {
  width: '100%',
  background: CTA_GRADIENT,
  color: NAVY,
  border: 'none',
  borderRadius: 10,
  padding: '11px 16px',
  fontWeight: 800,
  fontSize: 15,
  cursor: 'pointer',
  textAlign: 'center',
  display: 'block',
}

export default function FamilyRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [requests, setRequests] = useState([])
  const [counts, setCounts] = useState({})
  const [myListings, setMyListings] = useState([])
  const [myOffers, setMyOffers] = useState({}) // request_id → offer id
  const [chosenListing, setChosenListing] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(location.state?.toast || '')
  const [offerError, setOfferError] = useState('')

  useEffect(() => {
    if (!location.state?.toast) return
    window.history.replaceState({}, '')
    const t = setTimeout(() => setToast(''), 8000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const nowIso = new Date().toISOString()
      const [reqRes, countRes, listRes, offerRes] = await Promise.all([
        supabase
          .from('family_requests')
          .select('id, user_id, area, days, age_groups, note, created_at')
          .eq('status', 'open')
          .gt('expires_at', nowIso)
          .order('created_at', { ascending: false }),
        supabase.rpc('request_offer_counts'),
        user
          ? supabase
              .from('listings')
              .select('id, title, category')
              .eq('user_id', user.id)
              .neq('category', 'community')
              .order('created_at', { ascending: true })
          : Promise.resolve({ data: [] }),
        user
          ? supabase.from('request_offers').select('id, request_id').eq('sitter_id', user.id)
          : Promise.resolve({ data: [] }),
      ])
      if (cancelled) return
      if (reqRes.error) {
        setError(reqRes.error.message)
        setRequests([])
      } else {
        setError('')
        setRequests(reqRes.data ?? [])
      }
      setCounts(Object.fromEntries((countRes.data ?? []).map((c) => [c.request_id, Number(c.offer_count)])))
      const listings = listRes.data ?? []
      setMyListings(listings)
      setChosenListing((prev) => prev || listings[0]?.id || '')
      setMyOffers(Object.fromEntries((offerRes.data ?? []).map((o) => [o.request_id, o.id])))
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  async function offerHelp(requestId) {
    if (!chosenListing) return
    setOfferError('')
    setBusyId(requestId)
    const { data, error: dbError } = await supabase
      .from('request_offers')
      .insert({ request_id: requestId, listing_id: chosenListing, sitter_id: user.id })
      .select('id')
      .single()
    setBusyId(null)
    if (dbError) {
      setOfferError("Couldn't send your offer — please try again.")
      return
    }
    setMyOffers((prev) => ({ ...prev, [requestId]: data.id }))
    setCounts((prev) => ({ ...prev, [requestId]: (prev[requestId] ?? 0) + 1 }))
  }

  async function withdraw(requestId) {
    const offerId = myOffers[requestId]
    if (!offerId) return
    setBusyId(requestId)
    const { error: dbError } = await supabase.from('request_offers').delete().eq('id', offerId)
    setBusyId(null)
    if (dbError) return
    setMyOffers((prev) => {
      const next = { ...prev }
      delete next[requestId]
      return next
    })
    setCounts((prev) => ({ ...prev, [requestId]: Math.max(0, (prev[requestId] ?? 1) - 1) }))
  }

  function actionFor(request) {
    if (user && request.user_id === user.id) {
      return (
        <Link to="/my-requests" style={{ ...helpBtn, background: 'rgba(255,255,255,0.08)', color: 'white' }}>
          Your request · see who replied
        </Link>
      )
    }
    if (myOffers[request.id]) {
      return (
        <div className="flex items-center justify-between gap-3">
          <span style={{ color: GREEN, fontWeight: 700, fontSize: 14 }}>✓ You offered help</span>
          <button
            type="button"
            disabled={busyId === request.id}
            onClick={() => withdraw(request.id)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Withdraw
          </button>
        </div>
      )
    }
    if (!user) {
      return (
        <Link to="/register" style={helpBtn}>
          I can help · sign up free
        </Link>
      )
    }
    if (myListings.length === 0) {
      return (
        <Link to="/post-listing" style={helpBtn}>
          I can help · post your free listing first
        </Link>
      )
    }
    return (
      <button type="button" disabled={busyId === request.id} onClick={() => offerHelp(request.id)} style={helpBtn}>
        {busyId === request.id ? 'Sending…' : '🙋 I can help'}
      </button>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-white">Families looking for help</h1>
      <p className="mt-2 text-white/60">
        Parents in Amsterdam post what they need. Babysitters and services can offer help — free.
      </p>

      {/* Parents: the free first step */}
      <div
        style={{
          marginTop: 20,
          background: 'rgba(52,211,153,0.08)',
          border: '1px solid rgba(52,211,153,0.35)',
          borderRadius: 16,
          padding: '16px 18px',
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <div style={{ flex: '1 1 220px' }}>
          <p className="text-white font-semibold">Looking for a babysitter?</p>
          <p className="text-white/60 text-sm" style={{ marginTop: 2 }}>
            Post a free request. Babysitters near you reply.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (user) return navigate('/families/new')
            setParentIntent()
            navigate('/register?for=parent')
          }}
          style={{ ...helpBtn, width: 'auto', padding: '11px 20px' }}
        >
          Post a free request
        </button>
      </div>

      {/* Sitters with more than one listing pick which one they offer with */}
      {myListings.length > 1 && (
        <label className="flex flex-wrap items-center gap-2 text-white/60 text-sm" style={{ marginTop: 16 }}>
          Offer help with:
          <select
            value={chosenListing}
            onChange={(e) => setChosenListing(e.target.value)}
            className="pl-input"
            style={{ width: 'auto', padding: '6px 10px' }}
          >
            {myListings.map((l) => (
              <option key={l.id} value={l.id} style={{ color: 'black' }}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
      )}

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

      {offerError && (
        <p role="alert" style={{ color: '#fca5a5', marginTop: 16, fontWeight: 600 }}>
          {offerError}
        </p>
      )}

      <div className="mt-8">
        {loading ? (
          <p className="text-white/50">Loading requests…</p>
        ) : error ? (
          <p style={{ color: '#fca5a5' }}>Could not load requests: {error}</p>
        ) : requests.length === 0 ? (
          <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center">
            <p className="text-white/70 text-lg">No requests right now.</p>
            <p className="text-white/50 mt-2">When a family posts what they need, it shows up here.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {requests.map((r) => (
              <RequestCard key={r.id} request={r} offerCount={counts[r.id] ?? 0} action={actionFor(r)} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
