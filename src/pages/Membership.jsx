import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MEMBERSHIP_BUY_URL, MEMBERSHIP_PRICE } from '../lib/listingUtils'
import PaymentNote from '../components/PaymentNote'

const GREEN = '#34d399'
const PURPLE = '#a78bfa'
const BLUE = '#60d0ff'
const NAVY = '#042C53'
// Membership is granted SERVER-SIDE by the Edge Function `verify-membership`:
// it checks the Gumroad licence with the secret service-role key and sets
// is_member. The browser can no longer set is_member itself — that column is
// locked in the database, so the only way in is through this verified path.

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 10,
  padding: '12px 14px',
  color: 'white',
  width: '100%',
  outline: 'none',
}

function Perk({ children }) {
  return (
    <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ color: GREEN, fontWeight: 700 }}>✓</span>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14.5, lineHeight: 1.5 }}>
        {children}
      </span>
    </li>
  )
}

export default function Membership() {
  const { user, isMember, refreshProfile } = useAuth()

  const [licenseKey, setLicenseKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  // Parents who posted a request go back to their replies after unlocking.
  const [hasRequests, setHasRequests] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase
      .from('family_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => {
        if (!cancelled) setHasRequests((count ?? 0) > 0)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // Not signed in → ask them to join first (free).
  if (!user) {
    return (
      <section className="mx-auto px-6 py-16" style={{ maxWidth: 520 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center">
          <h1 className="text-white text-2xl font-bold">Become a member</h1>
          <p className="text-white/65 mt-3">
            Sign in first (it's free) — then unlock contact whenever you're ready.
          </p>
          <Link
            to="/register"
            style={{ display: 'inline-block', marginTop: 22, background: GREEN, color: NAVY, borderRadius: 10, padding: '11px 22px', fontWeight: 700 }}
          >
            Sign in / Join free
          </Link>
        </div>
      </section>
    )
  }

  // Already a member.
  if (isMember || done) {
    return (
      <section className="mx-auto px-6 py-16" style={{ maxWidth: 520 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center">
          <div style={{ fontSize: 40 }}>🎉</div>
          <h1 className="text-white text-2xl font-bold mt-2">You're a member!</h1>
          <p className="text-white/65 mt-3">
            You can now message babysitters and local services directly on WhatsApp —
            anytime, no subscription.
          </p>
          <div className="flex flex-col items-center gap-3" style={{ marginTop: 22 }}>
            <Link
              to={hasRequests ? '/my-requests' : '/listings'}
              style={{ display: 'inline-block', background: GREEN, color: NAVY, borderRadius: 10, padding: '11px 22px', fontWeight: 700 }}
            >
              {hasRequests ? 'See who replied to your requests' : 'Browse listings'}
            </Link>
            {hasRequests && (
              <Link to="/listings" className="text-white/60 underline text-sm">
                Browse all listings
              </Link>
            )}
          </div>
        </div>
      </section>
    )
  }

  async function handleUnlock(e) {
    e.preventDefault()
    setError('')
    if (!licenseKey.trim()) {
      setError('Enter your access key, or buy access below.')
      return
    }
    setLoading(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-membership', {
        body: { license_key: licenseKey.trim() },
      })
      if (fnError || !data?.ok) {
        const code = data?.error
        setError(
          code === 'REFUNDED'
            ? 'This purchase was refunded, so it can no longer unlock access.'
            : code === 'INVALID_KEY'
              ? 'That key looks invalid. Double-check it, or buy access below.'
              : 'Could not verify your key right now. Please try again.',
        )
        return
      }
      await refreshProfile()
      setDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto px-6 py-12" style={{ maxWidth: 520 }}>
      <h1 className="text-white text-3xl font-bold">Unlock contact</h1>
      <p className="mt-2 text-white/60">
        <strong className="text-white">{MEMBERSHIP_PRICE} once</strong>, incl. VAT — no
        subscription, no recurring fees.
      </p>

      <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-6 mt-6">
        <p className="text-white/80 font-semibold" style={{ marginBottom: 12 }}>
          Membership unlocks:
        </p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Perk>Message babysitters & local services directly on WhatsApp</Perk>
          <Perk>See which babysitters replied to your request — and message them</Perk>
          <Perk>Reach out as often as you like — pay once, keep forever</Perk>
          <Perk>Support a small, ad-free community for expat parents 💛</Perk>
        </ul>

        <a
          href={MEMBERSHIP_BUY_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            marginTop: 22,
            textAlign: 'center',
            background: `linear-gradient(90deg, ${GREEN}, ${BLUE})`,
            color: NAVY,
            borderRadius: 12,
            padding: 15,
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Get access · {MEMBERSHIP_PRICE}
        </a>
        <PaymentNote style={{ marginTop: 10 }} />

        <p
          className="text-white/70 text-sm font-semibold"
          style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          Already paid? Paste the access key from your Gumroad email:
        </p>
        <form onSubmit={handleUnlock} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="Your access key"
            style={inputStyle}
          />
          {error && <p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'transparent',
              color: 'white',
              border: `1px solid ${PURPLE}`,
              borderRadius: 12,
              padding: 13,
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Unlocking…' : '🔓 Unlock with my key'}
          </button>
        </form>

      </div>
    </section>
  )
}
