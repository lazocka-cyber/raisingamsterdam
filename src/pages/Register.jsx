import { useState } from 'react'
import { supabase } from '../lib/supabase'

const PURPLE = '#a78bfa'
const SUCCESS_MSG = 'Check your email for a magic link! 🎉'

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 10,
  padding: '12px 16px',
  color: 'white',
  width: '100%',
  outline: 'none',
}

const buttonStyle = {
  background: PURPLE,
  color: 'white',
  borderRadius: 10,
  padding: 12,
  width: '100%',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '12px 8px',
        fontWeight: 600,
        fontSize: 15,
        color: active ? 'white' : 'rgba(255,255,255,0.4)',
        borderBottom: active ? `2px solid ${PURPLE}` : '2px solid transparent',
      }}
    >
      {children}
    </button>
  )
}

export default function Register() {
  const [tab, setTab] = useState('sitter')

  // shared form state per tab
  const [sitterEmail, setSitterEmail] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [licenseKey, setLicenseKey] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function switchTab(next) {
    setTab(next)
    setError('')
    setSuccess('')
  }

  async function handleGoogleSignIn() {
    setError('')
    setSuccess('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (oauthError) {
      setError(oauthError.message)
    }
    // On success the browser is redirected to Google, so nothing else runs here.
  }

  async function handleSitterSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: sitterEmail,
        options: {
          data: { role: 'sitter' },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (otpError) {
        setError(otpError.message)
      } else {
        setSuccess(SUCCESS_MSG)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleParentSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      // a) Verify the Gumroad license
      const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          product_permalink: 'raisingamsterdam',
          license_key: licenseKey,
        }),
      })
      const data = await res.json().catch(() => ({ success: false }))

      // b) Invalid license
      if (!data.success) {
        setError('Invalid license key. Buy access at gumroad.com')
        return
      }

      // c) Valid → send magic link with parent role + license
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: parentEmail,
        options: {
          data: { role: 'parent', license_key: licenseKey },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (otpError) {
        setError(otpError.message)
        return
      }

      // d) Success
      setSuccess(SUCCESS_MSG)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      style={{ minHeight: '100%' }}
      className="w-full px-6 py-16 flex justify-center"
    >
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: 16,
          padding: '2.5rem',
          maxWidth: 460,
          width: '100%',
        }}
      >
        {/* Tabs */}
        <div
          style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <TabButton active={tab === 'sitter'} onClick={() => switchTab('sitter')}>
            🍼 I'm a babysitter
          </TabButton>
          <TabButton active={tab === 'parent'} onClick={() => switchTab('parent')}>
            👨‍👩‍👧 I'm a parent
          </TabButton>
        </div>

        {/* TAB 1 — Oppas (free) */}
        {tab === 'sitter' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
            <p className="text-white/60 text-sm">
              Offer babysitting to families in Amsterdam. Free — sign in below.
            </p>

            {/* Primary: one-click Google sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                background: 'white',
                color: '#1f1f1f',
                borderRadius: 10,
                padding: 12,
                width: '100%',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
              or
              <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
            </div>
          </div>
        )}

        {/* TAB 1 — email fallback */}
        {tab === 'sitter' && (
          <form
            onSubmit={handleSitterSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}
          >
            <p className="text-white/60 text-sm">
              No Google account? We'll email you a sign-in link instead.
            </p>
            <input
              type="email"
              required
              placeholder="Your email"
              value={sitterEmail}
              onChange={(e) => setSitterEmail(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        {/* TAB 2 — Parent (paid) */}
        {tab === 'parent' && (
          <form
            onSubmit={handleParentSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}
          >
            <p className="text-white/60 text-sm">
              Find babysitters and local services. Enter your Gumroad license key from your purchase.
            </p>
            <input
              type="email"
              required
              placeholder="Your email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              required
              placeholder="Your Gumroad license key"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Verifying…' : 'Verify & send magic link'}
            </button>
          </form>
        )}

        {/* Feedback */}
        {error && (
          <p style={{ color: '#f87171', marginTop: 16, fontSize: 14 }}>{error}</p>
        )}
        {success && (
          <p style={{ color: '#34d399', marginTop: 16, fontSize: 14 }}>{success}</p>
        )}
      </div>
    </section>
  )
}
