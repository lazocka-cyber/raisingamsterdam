import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { buzz } from '../lib/attention'

// The one place that makes sure a signed-in sitter without a listing always
// ends up on /post-listing, no matter where they land (magic link, navbar,
// deep link). Runs purely on React state — no storage — so it also works in
// in-app webviews (Gmail/Facebook) where sessionStorage is blocked.
//
// Leaving /post-listing by tapping the navbar isn't hard-blocked; instead we
// let the navigation happen and drop a full-screen "your listing isn't live
// yet" modal over the destination. "Finish my listing" goes back (the draft
// autosave keeps their answers); "Leave anyway" snoozes the gate until the
// next full page load.

const EXEMPT_PREFIXES = ['/post-listing', '/delete-account', '/membership']

function isExempt(pathname) {
  return EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))
}

export default function ListingGate() {
  const { user, profile, loading, hasListing, listingSnoozed, snoozeListingGate } =
    useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const prevPathRef = useRef(location.pathname)
  const [showExitModal, setShowExitModal] = useState(false)

  const role = profile?.role ?? 'sitter'
  const gateActive =
    !loading &&
    Boolean(user) &&
    Boolean(profile) && // wait for the profile — don't misroute parents as sitters
    hasListing === false && // null = still unknown → stay quiet
    role !== 'parent' &&
    !listingSnoozed

  useEffect(() => {
    const prevPath = prevPathRef.current
    prevPathRef.current = location.pathname

    if (!gateActive) return
    if (isExempt(location.pathname)) {
      // Back on the form (or another exempt page) — the warning is moot.
      setShowExitModal(false)
      return
    }

    // Came from the form and tapped away → soft-block with the modal.
    if (prevPath.startsWith('/post-listing')) {
      setShowExitModal(true)
      buzz()
      return
    }

    // Landed anywhere else (fresh load, magic link, navbar) → straight to
    // the form. replace:true keeps the back button sane.
    navigate('/post-listing?welcome=1', { replace: true })
  }, [gateActive, location.pathname, navigate])

  // Gate turned off (published / snoozed / signed out) → drop the modal.
  useEffect(() => {
    if (!gateActive && showExitModal) setShowExitModal(false)
  }, [gateActive, showExitModal])

  if (!showExitModal || !gateActive) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'rgba(4, 20, 40, 0.88)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: 20,
          padding: '2rem 1.75rem',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
        }}
        className="listing-cta-pulse"
      >
        <div style={{ fontSize: 46, lineHeight: 1 }}>⚠️</div>
        <h2 className="text-white font-bold" style={{ fontSize: 22, marginTop: 14 }}>
          Your listing isn't live yet!
        </h2>
        <p className="text-white/70" style={{ fontSize: 15, marginTop: 10, lineHeight: 1.5 }}>
          Signing up is only step 1. Until you post your listing,{' '}
          <strong className="text-white">parents cannot see you at all</strong> — your
          profile is invisible.
        </p>
        <button
          type="button"
          onClick={() => {
            setShowExitModal(false)
            navigate('/post-listing?welcome=1')
          }}
          style={{
            marginTop: 20,
            width: '100%',
            background: 'linear-gradient(90deg, #34d399, #60d0ff)',
            color: '#042C53',
            border: 'none',
            borderRadius: 12,
            padding: '15px 20px',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ✍️ Finish my listing (2 min)
        </button>
        <button
          type="button"
          onClick={() => {
            snoozeListingGate()
            setShowExitModal(false)
          }}
          style={{
            marginTop: 12,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 13,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Leave anyway — I understand nobody can find me
        </button>
      </div>
    </div>
  )
}
