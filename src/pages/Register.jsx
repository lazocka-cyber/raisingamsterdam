import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const PURPLE = '#a78bfa'
// Tutoriál pro chůvy na YouTube — když je ID prázdné, sekce s videem se nevykreslí
const YOUTUBE_VIDEO_ID = 'GcOP2vPfZio'
const SUCCESS_MSG =
  "Check your email! 📬 Click the link inside to finish step 2 — posting your listing. Takes 2 minutes, and without it parents can't find you."

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

function GoogleButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
  )
}

export default function Register() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleGoogleSignIn() {
    setError('')
    setSuccess('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (oauthError) setError(oauthError.message)
    // On success the browser is redirected to Google.
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
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

  return (
    <section style={{ minHeight: '100%' }} className="w-full px-6 py-16 flex flex-col items-center">
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: 16,
          padding: '2.5rem',
          maxWidth: 460,
          width: '100%',
        }}
      >
        <h1 className="text-white text-2xl font-bold text-center">
          Join RaisingAmsterdam
        </h1>
        <p className="text-white/60 text-sm text-center mt-2">
          It's free to join. Browse, post a listing, and meet other expat parents.
          Unlock contact whenever you're ready.
        </p>
        <p
          className="text-center text-sm mt-3"
          style={{ color: '#34d399', fontWeight: 600 }}
        >
          Step 1 of 2: create your account · Step 2: post your listing
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
          {/* Primary: one-click Google */}
          <GoogleButton onClick={handleGoogleSignIn} />

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
            or
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Email magic link */}
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p className="text-white/60 text-sm">
              No Google account? We'll email you a sign-in link.
            </p>
            <input
              type="email"
              required
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>

          {error && <p style={{ color: '#f87171', fontSize: 14 }}>{error}</p>}
          {success && (
            <p
              style={{
                color: '#34d399',
                fontSize: 14,
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.4)',
                borderRadius: 10,
                padding: '12px 14px',
                fontWeight: 600,
              }}
            >
              {success}
            </p>
          )}

          <p className="text-white/45 text-xs text-center" style={{ marginTop: 4 }}>
            Already bought access? Sign in, then add your key on the{' '}
            <Link to="/membership" style={{ color: '#60d0ff' }}>Membership</Link> page.
          </p>
        </div>
      </div>

      {/* Tutoriálové video pro chůvy — pod registrační kartou */}
      {YOUTUBE_VIDEO_ID && (
        <div className="w-full mt-10" style={{ maxWidth: 460 }}>
          <h2 className="text-white text-lg font-semibold text-center">
            See how to post your listing
          </h2>
          <p className="text-white/60 text-sm text-center mt-1">
            2 minutes, start to finish
          </p>
          <div className="aspect-video mt-4 rounded-xl overflow-hidden">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}`}
              title="How to post your listing on RaisingAmsterdam"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  )
}
