import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { waNumber } from '../lib/listingUtils'

const PURPLE = '#a78bfa'
const BLUE = '#60d0ff'
const GREEN = '#34d399'

const TYPE = {
  meetup: { label: '🗓️ Meetup', color: BLUE },
  intro: { label: '👋 Intro', color: GREEN },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'meetup', label: '🗓️ Meetups' },
  { key: 'intro', label: '👋 Intros' },
]

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return ''
  }
}

function isToday(value) {
  if (!value) return false
  return value === new Date().toISOString().slice(0, 10)
}

function MeetupCard({ item, isOwner, onDelete, busy }) {
  const badge = TYPE[item.type] ?? TYPE.meetup
  const when =
    item.type === 'meetup'
      ? [isToday(item.event_date) ? 'Today' : formatDate(item.event_date), item.event_time]
          .filter(Boolean)
          .join(' · ')
      : ''

  return (
    <div
      style={{
        background: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: badge.color,
            background: `${badge.color}1f`,
            border: `1px solid ${badge.color}55`,
            borderRadius: 999,
            padding: '4px 10px',
          }}
        >
          {badge.label}
        </span>
        {item.type === 'meetup' && isToday(item.event_date) && (
          <span style={{ color: BLUE, fontWeight: 700, fontSize: 12 }}>TODAY</span>
        )}
      </div>

      <h3 className="text-white font-bold text-lg mt-3">{item.title}</h3>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70 mt-2">
        {when && <span>🗓️ {when}</span>}
        {item.area && <span>📍 {item.area}</span>}
      </div>

      {item.body && (
        <p className="text-white/75 text-sm mt-3 whitespace-pre-line">{item.body}</p>
      )}

      <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        {isOwner ? (
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-sm">This is your post.</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(item.id)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}
            >
              Delete
            </button>
          </div>
        ) : item.whatsapp ? (
          <a
            href={`https://wa.me/${waNumber(item.whatsapp)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: GREEN,
              color: '#0b1220',
              borderRadius: 10,
              padding: '9px 16px',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            💬 Message on WhatsApp
          </a>
        ) : (
          <span className="text-white/40 text-sm">No contact info shared</span>
        )}
      </div>
    </div>
  )
}

export default function Meetups() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState(location.state?.toast || '')

  useEffect(() => {
    if (!location.state?.toast) return
    window.history.replaceState({}, '')
    const t = setTimeout(() => setToast(''), 5000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    const { data, error: dbError } = await supabase
      .from('meetups')
      .select('*')
      .order('created_at', { ascending: false })
    if (dbError) {
      setError(dbError.message)
      setItems([])
    } else {
      setError('')
      // Hide meetups whose day has passed (expires_at in the past).
      const now = Date.now()
      setItems(
        (data ?? []).filter((m) => !m.expires_at || new Date(m.expires_at).getTime() > now),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleDelete(id) {
    setBusyId(id)
    const { error: dbError } = await supabase.from('meetups').delete().eq('id', id)
    setBusyId(null)
    if (!dbError) setItems((prev) => prev.filter((m) => m.id !== id))
  }

  const visible = filter === 'all' ? items : items.filter((m) => m.type === filter)

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Meet other parents</h1>
          <p className="mt-2 text-white/60">
            Casual meetups and friendly hellos from expat parents around Amsterdam.
          </p>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => navigate('/meetups/new')}
            style={{
              background: `linear-gradient(90deg, ${PURPLE}, ${BLUE})`,
              color: '#0b1220',
              border: 'none',
              borderRadius: 10,
              padding: '11px 20px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + New post
          </button>
        )}
      </div>

      {toast && (
        <div
          style={{
            background: 'rgba(96,208,255,0.12)',
            border: `1px solid ${BLUE}66`,
            color: '#bae6fd',
            borderRadius: 10,
            padding: '12px 16px',
            marginTop: 16,
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}

      {/* Signed-out gate */}
      {!authLoading && !user ? (
        <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center mt-8">
          <p className="text-white/80 text-lg">Sign in to meet other parents 👋</p>
          <p className="text-white/55 mt-2">
            This board is for the community, so it’s only visible to members.
          </p>
          <Link
            to="/register"
            style={{
              display: 'inline-block',
              marginTop: 20,
              background: GREEN,
              color: '#042C53',
              borderRadius: 10,
              padding: '11px 22px',
              fontWeight: 700,
            }}
          >
            Sign in / Join
          </Link>
        </div>
      ) : (
        <>
          {/* How it works — so parents instantly get the two post types */}
          <div
            className="mt-6"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: '14px 16px',
            }}
          >
            <p className="text-white/80 text-sm font-semibold" style={{ marginBottom: 10 }}>
              New here? Two easy ways to connect 👇
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span style={{ color: BLUE, fontWeight: 700, fontSize: 13 }}>🗓️ Meetup</span>
                <p className="text-white/60 text-sm mt-1">
                  Plan a get-together at a set time — a coffee, a walk, a playdate — and
                  other parents can join.
                </p>
              </div>
              <div>
                <span style={{ color: GREEN, fontWeight: 700, fontSize: 13 }}>👋 Intro</span>
                <p className="text-white/60 text-sm mt-1">
                  No plan yet? Just say hi — share your area and your kids’ ages, and
                  nearby families can reach out to you.
                </p>
              </div>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            {FILTERS.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  style={{
                    borderRadius: 999,
                    padding: '7px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: active ? '#0b1220' : 'white',
                    background: active ? PURPLE : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${active ? PURPLE : 'rgba(255,255,255,0.15)'}`,
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <div className="mt-6">
            {loading ? (
              <p className="text-white/50">Loading…</p>
            ) : error ? (
              <p style={{ color: '#fca5a5' }}>Could not load posts: {error}</p>
            ) : visible.length === 0 ? (
              <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center">
                <p className="text-white/70 text-lg">Nothing here yet. 🌱</p>
                <p className="text-white/50 mt-2">
                  Be the first — post a meetup or a quick hello.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {visible.map((item) => (
                  <MeetupCard
                    key={item.id}
                    item={item}
                    isOwner={Boolean(user) && user.id === item.user_id}
                    onDelete={handleDelete}
                    busy={busyId === item.id}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
