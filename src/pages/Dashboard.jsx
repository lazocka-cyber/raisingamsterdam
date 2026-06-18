import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const GREEN = '#34d399'
const PURPLE = '#a78bfa'
const NAVY = '#042C53'

function StepIcon({ done, n }) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 700,
        color: done ? NAVY : 'rgba(255,255,255,0.7)',
        background: done ? GREEN : 'rgba(255,255,255,0.08)',
        border: done ? 'none' : '1px solid rgba(255,255,255,0.2)',
      }}
    >
      {done ? '✓' : n}
    </div>
  )
}

function ChecklistStep({ step, n, isNext }) {
  return (
    <div
      className="flex items-start gap-3"
      style={{
        background: isNext ? 'rgba(167,139,250,0.1)' : 'transparent',
        border: isNext ? `1px solid ${PURPLE}55` : '1px solid transparent',
        borderRadius: 12,
        padding: '12px 14px',
      }}
    >
      <StepIcon done={step.done} n={n} />
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold"
          style={{
            color: step.done ? 'rgba(255,255,255,0.5)' : 'white',
            textDecoration: step.done ? 'line-through' : 'none',
          }}
        >
          {step.title}
        </p>
        {!step.done && <p className="text-white/55 text-sm mt-1">{step.desc}</p>}
      </div>
      {isNext && step.cta && (
        <Link
          to={step.cta.to}
          style={{
            background: PURPLE,
            color: 'white',
            borderRadius: 9,
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: 14,
            whiteSpace: 'nowrap',
          }}
        >
          {step.cta.label}
        </Link>
      )}
    </div>
  )
}

function SitterOnboarding({ listings }) {
  const hasListing = listings.length > 0
  const hasPhoto = listings.some((l) => l.photo_url)
  const profileComplete = listings.some(
    (l) => l.description && l.languages?.length && l.availability?.length,
  )
  const firstId = listings[0]?.id

  const steps = [
    {
      done: hasListing,
      title: 'Post your first listing',
      desc: 'Tell families who you are and how you can help.',
      cta: { to: '/post-listing', label: 'Start' },
    },
    {
      done: hasPhoto,
      title: 'Add a photo',
      desc: 'A friendly face gets far more replies from parents.',
      cta: firstId ? { to: `/post-listing/${firstId}`, label: 'Add photo' } : { to: '/post-listing', label: 'Start' },
    },
    {
      done: profileComplete,
      title: 'Complete your profile',
      desc: 'Add a description, the languages you speak and your availability.',
      cta: firstId ? { to: `/post-listing/${firstId}`, label: 'Finish' } : { to: '/post-listing', label: 'Start' },
    },
  ]

  const nextIndex = steps.findIndex((s) => !s.done)
  const allDone = nextIndex === -1
  const completed = steps.filter((s) => s.done).length

  return (
    <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-8 text-left">
      {allDone ? (
        <>
          <h2 className="text-white text-xl font-bold">You're all set! 🎉</h2>
          <p className="text-white/60 mt-2">
            Your profile is complete and live. Parents can now find and message you.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-white text-xl font-bold">Finish setting up your profile</h2>
          <p className="text-white/60 mt-2">
            {completed} of {steps.length} done — just a couple more steps to start getting replies.
          </p>
        </>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {steps.map((step, i) => (
          <ChecklistStep key={step.title} step={step} n={i + 1} isNext={i === nextIndex} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/my-listings"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 10,
            padding: '10px 20px',
            fontWeight: 600,
          }}
        >
          My listings{hasListing ? ` (${listings.length})` : ''}
        </Link>
        <Link
          to="/listings"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 10,
            padding: '10px 20px',
            fontWeight: 600,
          }}
        >
          Browse listings
        </Link>
      </div>
    </div>
  )
}

// A single onboarding card: emoji, title, body and optional action buttons.
function GuideCard({ emoji, title, children, actions }) {
  return (
    <div
      style={{ background: '#1a1a2e', borderRadius: 16 }}
      className="p-6 text-left"
    >
      <div className="flex items-start gap-3">
        <span style={{ fontSize: 26, lineHeight: 1 }} aria-hidden="true">
          {emoji}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold">{title}</h3>
          <div className="text-white/65 text-sm mt-1">{children}</div>
          {actions && <div className="mt-4 flex flex-wrap gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  )
}

function GuideButton({ to, label, primary }) {
  return (
    <Link
      to={to}
      style={{
        background: primary ? GREEN : 'rgba(255,255,255,0.08)',
        color: primary ? NAVY : 'white',
        border: primary ? 'none' : '1px solid rgba(255,255,255,0.18)',
        borderRadius: 10,
        padding: '9px 18px',
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      {label}
    </Link>
  )
}

// A numbered, easy-to-follow step list.
function Steps({ steps, note }) {
  return (
    <>
      <ol style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        {steps.map((step, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span
              style={{
                flexShrink: 0,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(167,139,250,0.18)',
                border: `1px solid ${PURPLE}66`,
                color: 'white',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i + 1}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.5, paddingTop: 1 }}>
              {step}
            </span>
          </li>
        ))}
      </ol>
      {note && (
        <p
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.3)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {note}
        </p>
      )}
    </>
  )
}

// Platform-aware "Add to home screen" instructions. Hides itself once the app
// is already running as an installed PWA (standalone display mode).
function AddToHomeScreen() {
  const [installed, setInstalled] = useState(false)
  const [platform, setPlatform] = useState('other') // 'ios' | 'android' | 'other'

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    setInstalled(Boolean(standalone))

    const ua = window.navigator.userAgent || ''
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform('ios')
    else if (/Android/i.test(ua)) setPlatform('android')
  }, [])

  if (installed) {
    return (
      <GuideCard emoji="✅" title="App added to your home screen">
        You're all set — open RaisingAmsterdam any time straight from your home
        screen, and you'll be able to receive SOS alerts.
      </GuideCard>
    )
  }

  let body
  if (platform === 'ios') {
    body = (
      <Steps
        steps={[
          <>Open this page in <strong>Safari</strong> (it won't work in Chrome or in-app browsers on iPhone).</>,
          <>Tap the <strong>Share</strong> button — the square with an arrow pointing up <span aria-hidden="true">⬆️</span> — in the bar at the bottom of the screen.</>,
          <>In the menu that slides up, scroll down and tap <strong>Add to Home Screen</strong>.</>,
          <>Tap <strong>Add</strong> in the top-right corner.</>,
          <>Done! The <strong>RaisingAmsterdam</strong> icon is now on your home screen — open it from there from now on.</>,
        ]}
        note="📌 On iPhone, adding the app to your home screen is required to receive SOS alerts. Once added, open the app and tap “🔔 Get SOS alerts” on the SOS page to turn on notifications."
      />
    )
  } else if (platform === 'android') {
    body = (
      <Steps
        steps={[
          <>Open this page in <strong>Chrome</strong>.</>,
          <>Tap the menu — the three dots <span aria-hidden="true">⋮</span> in the top-right corner.</>,
          <>Tap <strong>Install app</strong> (on some phones it says <strong>Add to Home screen</strong>).</>,
          <>Confirm by tapping <strong>Install</strong> / <strong>Add</strong>.</>,
          <>Done! The <strong>RaisingAmsterdam</strong> icon is now on your home screen.</>,
        ]}
        note="🔔 After installing, open the app and tap “Get SOS alerts” on the SOS page to turn on notifications."
      />
    )
  } else {
    body = (
      <>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
          You're on a computer right now. To add RaisingAmsterdam to your phone,
          open <strong>raisingamsterdam.vercel.app</strong> on your phone and follow
          the steps below.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* iPhone column */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <p style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              📱 On iPhone (Safari)
            </p>
            <Steps
              steps={[
                <>Open the page in <strong>Safari</strong>.</>,
                <>Tap the <strong>Share</strong> button <span aria-hidden="true">⬆️</span> at the bottom.</>,
                <>Scroll down and tap <strong>Add to Home Screen</strong>.</>,
                <>Tap <strong>Add</strong> in the top-right corner.</>,
              ]}
              note="📌 On iPhone this is required to receive SOS alerts."
            />
          </div>

          {/* Android column */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <p style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              🤖 On Android (Chrome)
            </p>
            <Steps
              steps={[
                <>Open the page in <strong>Chrome</strong>.</>,
                <>Tap the menu <span aria-hidden="true">⋮</span> (top-right).</>,
                <>Tap <strong>Install app</strong> / <strong>Add to Home screen</strong>.</>,
                <>Confirm with <strong>Install</strong> / <strong>Add</strong>.</>,
              ]}
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <GuideCard emoji="📲" title="Add the app to your home screen">
      {body}
    </GuideCard>
  )
}

function ParentOnboarding() {
  return (
    <div className="flex flex-col gap-4">
      <div
        style={{ background: '#1a1a2e', borderRadius: 16 }}
        className="p-8 text-center"
      >
        <h2 className="text-white text-xl font-bold">Welcome! 👋</h2>
        <p className="text-white/65 mt-2">
          You have full access to RaisingAmsterdam. Here's how to make the most of it.
        </p>
      </div>

      <GuideCard
        emoji="🔎"
        title="Find babysitters & local services"
        actions={
          <>
            <GuideButton to="/listings?cat=babysitter" label="Find a babysitter" primary />
            <GuideButton to="/listings?cat=services" label="Local services" />
          </>
        }
      >
        Browse trusted babysitters and family services in Amsterdam. Use the
        filters to narrow by area, language and age group.
      </GuideCard>

      <AddToHomeScreen />

      <GuideCard
        emoji="🚨"
        title="Need someone last-minute? Use SOS"
        actions={<GuideButton to="/sos" label="Open SOS board" />}
      >
        Stuck without a sitter? Post a quick SOS request — it shows up in red and
        nearby babysitters see it right away.
      </GuideCard>

      <GuideCard
        emoji="💬"
        title="How to get in touch"
        actions={<GuideButton to="/listings?cat=babysitter" label="Browse babysitters" />}
      >
        Found someone? Open their listing and tap{' '}
        <strong>Contact via WhatsApp</strong> to message them directly — no
        middleman, no waiting.
      </GuideCard>
    </div>
  )
}

function MemberBadge({ isMember }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        padding: '4px 10px',
        borderRadius: 999,
        color: isMember ? NAVY : 'rgba(255,255,255,0.75)',
        background: isMember ? GREEN : 'rgba(255,255,255,0.08)',
        border: isMember ? 'none' : '1px solid rgba(255,255,255,0.2)',
      }}
    >
      {isMember ? '💜 Member' : 'Free account'}
    </span>
  )
}

function MembershipBanner() {
  return (
    <div
      style={{
        background: 'rgba(167,139,250,0.1)',
        border: `1px solid ${PURPLE}55`,
        borderRadius: 16,
      }}
      className="p-6 mb-6"
    >
      <h2 className="text-white font-bold text-lg">🔓 Unlock contact</h2>
      <p className="text-white/65 text-sm mt-1">
        One-time payment — full access, no subscription. Message babysitters and local
        services directly on WhatsApp, as often as you like.
      </p>
      <Link
        to="/membership"
        style={{
          display: 'inline-block',
          marginTop: 16,
          background: `linear-gradient(90deg, ${PURPLE}, #60d0ff)`,
          color: NAVY,
          borderRadius: 10,
          padding: '10px 20px',
          fontWeight: 700,
        }}
      >
        Become a member
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const { user, profile, signOut, isMember } = useAuth()
  const role = profile?.role ?? 'sitter'

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (cancelled) return
      setListings(data ?? [])
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {user?.email && <span className="text-white/40 text-sm">{user.email}</span>}
            <MemberBadge isMember={isMember} />
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            borderRadius: 10,
            padding: '10px 18px',
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.18)',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>

      {/* Model B: anyone can unlock contact (one-time). Members don't see this. */}
      {!isMember && <MembershipBanner />}

      {/* Anyone can offer something — listing is free. */}
      <div className="mb-6">
        <Link
          to="/post-listing"
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 10,
            padding: '10px 18px',
            fontWeight: 600,
          }}
        >
          ＋ Offer babysitting or a service — post a listing (free)
        </Link>
      </div>

      {loading ? (
        <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center text-white/50">
          Loading…
        </div>
      ) : role === 'parent' ? (
        <ParentOnboarding />
      ) : (
        <SitterOnboarding listings={listings} />
      )}

      {/* Account management */}
      <div className="mt-10 pt-6 border-t border-white/10 text-center">
        <Link to="/delete-account" className="text-white/40 text-sm hover:text-white/70 underline">
          🗑️ Delete account
        </Link>
      </div>
    </section>
  )
}
