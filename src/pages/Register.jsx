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

  async function handleSitterSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: sitterEmail,
        options: { data: { role: 'sitter' } },
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
        options: { data: { role: 'parent', license_key: licenseKey } },
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
            Find an oppas
          </TabButton>
          <TabButton active={tab === 'parent'} onClick={() => switchTab('parent')}>
            Join as parent
          </TabButton>
        </div>

        {/* TAB 1 — Oppas (free) */}
        {tab === 'sitter' && (
          <form
            onSubmit={handleSitterSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}
          >
            <p className="text-white/60 text-sm">
              Register as a sitter — it's free. We'll send you a magic link to sign in.
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
              Join as a parent with your Gumroad license key.
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
