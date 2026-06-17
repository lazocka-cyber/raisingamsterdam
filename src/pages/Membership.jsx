import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const GREEN = '#34d399'
const PURPLE = '#a78bfa'
const BLUE = '#60d0ff'
const NAVY = '#042C53'
const GUMROAD_PERMALINK = 'raisingamsterdam'
// On localhost we skip the Gumroad check so membership can be tested without a
// real key. ALWAYS enforced in the production build on Vercel.
const DEV_SKIP_LICENSE = import.meta.env.DEV

async function verifyGumroadLicense(licenseKey) {
  const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      product_permalink: GUMROAD_PERMALINK,
      license_key: licenseKey,
      increment_uses_count: 'false',
    }),
  })
  const data = await res.json().catch(() => ({ success: false }))
  return Boolean(data.success)
}

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
          <Link
            to="/listings"
            style={{ display: 'inline-block', marginTop: 22, background: GREEN, color: NAVY, borderRadius: 10, padding: '11px 22px', fontWeight: 700 }}
          >
            Browse listings
          </Link>
        </div>
      </section>
    )
  }

  async function handleUnlock(e) {
    e.preventDefault()
    setError('')
    if (!DEV_SKIP_LICENSE && !licenseKey.trim()) {
      setError('Enter your access key, or buy access below.')
      return
    }
    setLoading(true)
    try {
      const valid = DEV_SKIP_LICENSE ? true : await verifyGumroadLicense(licenseKey.trim())
      if (!valid) {
        setError('That key looks invalid. Double-check it, or buy access below.')
        return
      }
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ is_member: true, license_key: licenseKey.trim() || null })
        .eq('id', user.id)
      if (dbError) {
        setError(dbError.message)
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
        One-time payment — full access, no subscription, no recurring fees.
      </p>

      <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-6 mt-6">
        <p className="text-white/80 font-semibold" style={{ marginBottom: 12 }}>
          Membership unlocks:
        </p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Perk>Message babysitters & local services directly on WhatsApp</Perk>
          <Perk>Reach out as often as you like — pay once, keep forever</Perk>
          <Perk>Support a small, ad-free community for expat parents 💛</Perk>
        </ul>

        <form onSubmit={handleUnlock} style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              background: `linear-gradient(90deg, ${PURPLE}, ${BLUE})`,
              color: NAVY,
              border: 'none',
              borderRadius: 12,
              padding: 14,
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Unlocking…' : '🔓 Unlock with my key'}
          </button>
        </form>

        <p className="text-white/50 text-sm" style={{ marginTop: 16 }}>
          Don't have a key yet?{' '}
          <a
            href="https://gumroad.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: BLUE, fontWeight: 600 }}
          >
            Get access →
          </a>
        </p>
      </div>
    </section>
  )
}
