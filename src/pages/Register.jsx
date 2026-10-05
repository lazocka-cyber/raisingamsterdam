import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { setParentIntent } from '../lib/intent'
import { loadRequestDraft } from '../lib/requestDraft'

const PURPLE = '#a78bfa'
// Tutoriál pro chůvy na YouTube — když je ID prázdné, sekce s videem se nevykreslí
const YOUTUBE_VIDEO_ID = 'GcOP2vPfZio'
// Neutral: the same message reaches new babysitters, returning users and parents.
const SUCCESS_MSG =
  'Check your email! 📬 Tap the link inside to sign in. New babysitter? After signing in, post your free listing so families can find you.'
const SUCCESS_MSG_PARENT =
  'Check your email! 📬 Tap the link inside, then post your free request. Babysitters near you reply.'
const SUCCESS_MSG_DRAFT =
  'Check your email! 📬 Tap the link inside and your request goes live. Babysitters near you can then reply.'

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
  // /register?for=parent — arrived from /for-parents or a parent ad
  const [params] = useSearchParams()
  const forParent = params.get('for') === 'parent'
  // Came from the request form without an account: the request is saved,
  // this is the last step (5. 10. 2026).
  const [draft] = useState(() => (forParent ? loadRequestDraft() : null))
  useEffect(() => {
    if (forParent) setParentIntent()
  }, [forParent])
  // Arriving from the bottom of the request form: start at the top, so the
  // "Last step" heading is the first thing the parent sees.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const [videoOpen, setVideoOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  // Arrived from an expired or already-used e-mail link (see AuthCallback).
  const [error, setError] = useState(() =>
    new URLSearchParams(window.location.search).get('link') === 'expired'
      ? 'That sign-in link has expired or was already used. Enter your email below and we\'ll send you a fresh one.'
      : '',
  )
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
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          // New accounts get their profile role from this (profiles trigger),
          // so a parent never lands on the babysitter listing form — even when
          // the e-mail link opens in another browser. Existing accounts ignore it.
          // The saved request travels with the new account too, so it still gets
          // posted when the link opens in another browser.
          ...(forParent ? { data: { role: 'parent', ...(draft ? { request_draft: draft } : {}) } } : {}),
        },
      })
      if (otpError) {
        setError(otpError.message)
      } else {
        setSuccess(draft ? SUCCESS_MSG_DRAFT : forParent ? SUCCESS_MSG_PARENT : SUCCESS_MSG)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ minHeight: '100%' }} className="w-full px-6 pt-6 pb-16 flex flex-col items-center">

      {YOUTUBE_VIDEO_ID && !forParent && (
        <button
          type="button"
          onClick={() =>
            document.getElementById('tutorial-video')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          className="text-sm font-semibold mb-4"
          style={{ color: '#34d399', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          &#9654; Watch how it works (2 min)
        </button>
      )}

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
          {draft ? 'Last step: publish your request' : forParent ? 'Post your free request' : 'Join RaisingAmsterdam'}
        </h1>
        <p className="text-white/60 text-sm text-center mt-2">
          {draft
            ? 'Your request is saved. Create your free account so babysitters can see it, and you can see who replies.'
            : forParent
            ? 'Create your free account, then tell babysitters what you need. They reply, you choose who to message.'
            : "It's free to join. Browse, post a listing, and meet other expat parents. Unlock contact whenever you're ready."}
        </p>
        <p
          className="text-center text-sm mt-3"
          style={{ color: '#34d399', fontWeight: 600 }}
        >
          {draft
            ? 'Step 2 of 2: your free account'
            : forParent
            ? 'Step 1 of 2: create your account · Step 2: post your request'
            : 'Step 1 of 2: create your account · Step 2: post your listing'}
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
          {!forParent && (
            <p className="text-white/45 text-xs text-center">
              Looking for a babysitter?{' '}
              <Link to="/for-parents" style={{ color: '#60d0ff' }}>Post a free request</Link>
            </p>
          )}
        </div>
      </div>

      {/* Tutoriálové video pro chůvy — POD registrační kartou (od 1. 10. 2026).
          Nad kartou zabíralo na iPhonu celou první obrazovku a tlačítko registrace
          nebylo vidět. Aby se video znovu neztratilo (29. 8.: nikdo ho nenašel),
          vede na něj odkaz „Watch how it works“ nad kartou. */}
      {YOUTUBE_VIDEO_ID && !forParent && (
        <div id="tutorial-video" className="w-full mt-8" style={{ maxWidth: 460 }}>
          <h2 className="text-white text-lg font-semibold text-center">
            See how to post your listing
          </h2>
          <p className="text-white/60 text-sm text-center mt-1">
            2 minutes, start to finish
          </p>
          <div
            className="aspect-video mt-4 rounded-xl overflow-hidden"
            style={{ position: 'relative', background: '#000' }}
          >
            {videoOpen ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1`}
                title="How to post your listing on RaisingAmsterdam"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              /* Náhled s pulzujícím tlačítkem — YouTube se načte až po kliknutí.
                 Stránka je tím rychlejší a hlavně: pulzování oko zastaví. */
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                aria-label="Play the 2-minute video on how to post your listing"
                style={{
                  position: 'relative',
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  padding: 0,
                  border: 0,
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                  alt="Preview of the tutorial showing babysitters how to post a listing on RaisingAmsterdam"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <span
                  className="listing-cta-pulse"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    background: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0b1f17',
                    fontSize: 26,
                    paddingLeft: 4,
                  }}
                >
                  &#9654;
                </span>
              </button>
            )}
          </div>
        </div>
      )}

    </section>
  )
}
