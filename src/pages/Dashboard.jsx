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

function ParentWelcome() {
  return (
    <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center">
      <h2 className="text-white text-xl font-bold">Welcome! 👋</h2>
      <p className="text-white/70 mt-2">
        You have full access to all listings. Browse babysitters and local services, and
        contact them directly via WhatsApp.
      </p>
      <Link
        to="/listings"
        style={{
          display: 'inline-block',
          marginTop: 24,
          background: GREEN,
          color: NAVY,
          borderRadius: 10,
          padding: '12px 24px',
          fontWeight: 600,
        }}
      >
        Browse listings
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
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
          {user?.email && <p className="mt-1 text-white/40 text-sm">{user.email}</p>}
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

      {loading ? (
        <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center text-white/50">
          Loading…
        </div>
      ) : role === 'parent' ? (
        <ParentWelcome />
      ) : (
        <SitterOnboarding listings={listings} />
      )}
    </section>
  )
}
