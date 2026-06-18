import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Stars, StarInput } from './Stars'

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

const card = { background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 18px' }

// Category-aware copy so reviews read naturally for sitters, services and groups.
function reviewPrompts(category) {
  switch (category) {
    case 'services':
      return { invite: 'Used this service? Leave a review', join: 'to review this service' }
    case 'community':
      return { invite: 'Been to this group? Leave a review', join: 'to review this group' }
    case 'babysitter':
      return { invite: 'Worked with this babysitter? Leave a review', join: 'to review this babysitter' }
    default:
      return { invite: 'Leave a review', join: 'to leave a review' }
  }
}

export default function ReviewsSection({ listingId, listingOwnerId, category, user, isMember, onSummary }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isOwner = Boolean(user) && user.id === listingOwnerId
  const myReview = user ? reviews.find((r) => r.reviewer_id === user.id) : null
  const canReview = isMember && !isOwner
  const prompts = reviewPrompts(category)

  async function load() {
    setLoading(true)
    const { data, error: dbError } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
    if (dbError) {
      setError(dbError.message)
      setReviews([])
    } else {
      const list = data ?? []
      setReviews(list)
      // Prefill the form from the user's own review, if any.
      const mine = user ? list.find((r) => r.reviewer_id === user.id) : null
      if (mine) {
        setRating(mine.rating)
        setComment(mine.comment ?? '')
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId])

  // Report the average up to the parent (for the header summary).
  const count = reviews.length
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
  useEffect(() => {
    onSummary?.({ avg, count })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avg, count])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (rating < 1) {
      setError('Please pick a star rating.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        listing_id: listingId,
        reviewer_id: user.id,
        rating,
        comment: comment.trim() || null,
      }
      const { error: dbError } = myReview
        ? await supabase.from('reviews').update(payload).eq('id', myReview.id)
        : await supabase.from('reviews').insert(payload)
      if (dbError) {
        setError(dbError.message)
        return
      }
      await load()
    } catch (err) {
      setError(err.message || 'Could not save your review.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!myReview) return
    setSubmitting(true)
    setError('')
    const { error: dbError } = await supabase.from('reviews').delete().eq('id', myReview.id)
    setSubmitting(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setRating(0)
    setComment('')
    await load()
  }

  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 18 }}>
        <h2 className="text-white font-bold text-xl">Reviews</h2>
        {count > 0 && (
          <span className="flex items-center gap-2 text-white/60 text-sm">
            <Stars value={avg} size={16} />
            {avg.toFixed(1)} · {count} {count === 1 ? 'review' : 'reviews'}
          </span>
        )}
      </div>

      {/* Review form (parents only) */}
      {canReview && (
        <form onSubmit={handleSubmit} style={{ ...card, marginBottom: 20 }}>
          <p className="text-white/80 font-semibold" style={{ marginBottom: 10 }}>
            {myReview ? 'Edit your review' : prompts.invite}
          </p>
          <StarInput value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Share your experience (optional)…"
            className="pl-input"
            style={{ resize: 'vertical', marginTop: 12 }}
          />
          {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{error}</p>}
          <div className="flex items-center gap-3" style={{ marginTop: 12 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'linear-gradient(90deg, #fbbf24, #f97316)',
                color: '#0b1220',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Saving…' : myReview ? 'Update review' : 'Submit review'}
            </button>
            {myReview && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      )}

      {/* Prompt for non-members */}
      {!canReview && !isOwner && (
        <p className="text-white/50 text-sm" style={{ marginBottom: 16 }}>
          <Link to={user ? '/membership' : '/register'} className="underline">
            {user ? 'Become a member' : 'Sign in'}
          </Link>{' '}
          {prompts.join}.
        </p>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-white/50 text-sm">Loading reviews…</p>
      ) : count === 0 ? (
        <p className="text-white/50 text-sm">No reviews yet — be the first to leave one.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map((r) => (
            <div key={r.id} style={card}>
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} size={14} />
                <span className="text-white/40 text-xs">{formatDate(r.created_at)}</span>
              </div>
              {r.comment && (
                <p className="text-white/75 text-sm" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
