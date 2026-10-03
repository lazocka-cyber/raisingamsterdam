import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { StarInput } from '../components/Stars'

// Public page a sitter shares with families she has worked for
// (/reference/<listing id>). No account needed: first name, stars and a few
// sentences. The reference stays hidden until the sitter approves it — see
// supabase/sitter_references.sql.

const PURPLE = '#a78bfa'

const ERRORS = {
  LISTING_NOT_FOUND: 'This link no longer works — the listing was removed.',
  OWN_LISTING: "This is your own listing — send the link to a family you've worked for.",
  TOO_MANY_PENDING: 'This profile has a lot of references waiting. Please try again in a few days.',
}

export default function Reference() {
  const { listingId } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [relation, setRelation] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('listings')
      .select('id, title, photo_url, category')
      .eq('id', listingId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setListing(data ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [listingId])


  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (rating < 1) return setError('Pick a star rating first.')
    if (comment.trim().length < 10) return setError('Write at least one sentence.')
    if (!name.trim()) return setError('Add your first name.')
    setSubmitting(true)
    const { error: rpcError } = await supabase.rpc('submit_reference', {
      p_listing_id: listingId,
      p_author_name: name.trim().slice(0, 40),
      p_relation: relation.trim().slice(0, 80),
      p_rating: rating,
      p_comment: comment.trim().slice(0, 600),
    })
    setSubmitting(false)
    if (rpcError) {
      const code = Object.keys(ERRORS).find((k) => rpcError.message?.includes(k))
      setError(code ? ERRORS[code] : "Couldn't send your reference. Please try again.")
      return
    }
    setSent(true)
  }

  if (loading) {
    return <div className="px-6 py-16 text-center text-white/60">Loading…</div>
  }

  if (!listing) {
    return (
      <section className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-white/70">{ERRORS.LISTING_NOT_FOUND}</p>
        <Link to="/listings" className="underline text-white/60" style={{ display: 'inline-block', marginTop: 16 }}>
          See babysitters in Amsterdam
        </Link>
      </section>
    )
  }

  const avatar = (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        background: 'rgba(167,139,250,0.18)',
        color: PURPLE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      {listing.photo_url ? (
        <img src={listing.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        (listing.title || '?').trim().charAt(0).toUpperCase()
      )}
    </div>
  )

  if (sent) {
    return (
      <section className="mx-auto max-w-md px-6 py-14 text-center">
        <div style={{ display: 'flex', justifyContent: 'center' }}>{avatar}</div>
        <h1 className="text-white font-bold" style={{ fontSize: 24, marginTop: 16 }}>
          Thank you{name.trim() ? `, ${name.trim()}` : ''}!
        </h1>
        <p className="text-white/70" style={{ marginTop: 10, lineHeight: 1.6 }}>
          Your reference was sent. It appears on the profile as soon as it's approved.
        </p>
        <div
          style={{
            marginTop: 28,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            padding: '20px 18px',
            textAlign: 'left',
          }}
        >
          <p className="text-white font-semibold">Need a babysitter yourself?</p>
          <p className="text-white/60 text-sm" style={{ marginTop: 6, lineHeight: 1.6 }}>
            RaisingAmsterdam is a local community of babysitters and families in Amsterdam.
          </p>
          <Link
            to="/listings"
            style={{
              display: 'block',
              marginTop: 14,
              textAlign: 'center',
              background: 'linear-gradient(90deg, #34d399, #60d0ff)',
              color: '#042C53',
              borderRadius: 12,
              padding: '13px 18px',
              fontWeight: 800,
            }}
          >
            See babysitters near you
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-md px-6 py-10" style={{ '--accent': PURPLE }}>
      <div className="flex items-center gap-3">
        {avatar}
        <div>
          <h1 className="text-white font-bold" style={{ fontSize: 20, lineHeight: 1.3 }}>
            You were asked for a reference
          </h1>
          <p className="text-white/80 text-sm" style={{ marginTop: 2 }}>
            {listing.title}
          </p>
          <p className="text-white/50 text-xs" style={{ marginTop: 2 }}>
            Takes 1 minute · no account needed
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <p className="text-white/70 text-sm" style={{ marginBottom: 8 }}>
            How was it?
          </p>
          <StarInput value={rating} onChange={setRating} size={34} />
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-white/70 text-sm">What was it like working together?</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={600}
            placeholder="Always on time, calm and creative. Our kids loved every evening."
            className="pl-input"
            style={{ resize: 'vertical' }}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-white/70 text-sm">How long did you work together? (optional)</span>
          <input
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            maxLength={80}
            placeholder="6 months, two evenings a week"
            className="pl-input"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-white/70 text-sm">Your first name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="given-name"
            placeholder="Sophie"
            className="pl-input"
          />
        </label>
        {error && (
          <p role="alert" style={{ color: '#f87171', fontSize: 14 }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: PURPLE,
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: 14,
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          {submitting ? 'Sending…' : 'Send reference'}
        </button>
        <p className="text-white/40 text-xs text-center">
          Only your first name is shown. The profile owner decides whether it appears.
        </p>
      </form>
    </section>
  )
}
