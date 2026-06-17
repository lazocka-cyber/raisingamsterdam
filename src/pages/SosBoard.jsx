import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { waNumber } from '../lib/listingUtils'
import NotifyButton from '../components/NotifyButton'

const RED = '#ef4444'

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

function SosCard({ sos, isOwner, onClose, onDelete, busy }) {
  const when = [isToday(sos.needed_date) ? 'Today' : formatDate(sos.needed_date), sos.needed_time]
    .filter(Boolean)
    .join(' · ')
  const where = [sos.area, sos.postcode].filter(Boolean).join(' · ')

  return (
    <div className="sos-card">
      <div className="flex items-start justify-between gap-3">
        <span className="sos-badge">🚨 SOS · needs a sitter</span>
        {isToday(sos.needed_date) && <span className="sos-today">TODAY</span>}
      </div>

      <p className="text-white font-bold text-lg mt-3">{when || 'As soon as possible'}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70 mt-2">
        {where && <span>📍 {where}</span>}
        {sos.child_age && <span>👶 {sos.child_age}</span>}
      </div>

      {sos.note && <p className="text-white/75 text-sm mt-3 whitespace-pre-line">{sos.note}</p>}

      <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        {isOwner ? (
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-sm">This is your request.</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => onClose(sos.id)}
              className="sos-secondary-btn"
            >
              Mark filled
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(sos.id)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}
            >
              Delete
            </button>
          </div>
        ) : sos.phone ? (
          <a
            href={`https://wa.me/${waNumber(sos.phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sos-help-btn"
          >
            💬 Help out — message on WhatsApp
          </a>
        ) : (
          <span className="text-white/40 text-sm">No contact info</span>
        )}
      </div>
    </div>
  )
}

export default function SosBoard() {
  const { user, isMember } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Posting an SOS is a member perk; responding to one stays free for sitters.
  const postTarget = !user ? '/register' : !isMember ? '/membership' : '/sos/new'
  const postLabel = !user ? 'Sign in to post SOS' : !isMember ? '🔒 Unlock to post SOS' : '+ Post SOS'

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
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
    const nowIso = new Date().toISOString()
    const { data, error: dbError } = await supabase
      .from('sos_requests')
      .select('*')
      .eq('status', 'open')
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
    if (dbError) {
      setError(dbError.message)
      setRequests([])
    } else {
      setError('')
      setRequests(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  async function handleClose(id) {
    setBusyId(id)
    const { error: dbError } = await supabase
      .from('sos_requests')
      .update({ status: 'closed' })
      .eq('id', id)
    setBusyId(null)
    if (!dbError) setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleDelete(id) {
    setBusyId(id)
    const { error: dbError } = await supabase.from('sos_requests').delete().eq('id', id)
    setBusyId(null)
    if (!dbError) setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">🚨 SOS babysitters</h1>
          <p className="mt-2 text-white/60">
            Families who need a sitter at short notice. Can you help?
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(postTarget)}
          style={{
            background: `linear-gradient(90deg, ${RED}, #f97316)`,
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '11px 20px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {postLabel}
        </button>
      </div>

      {/* How it works — quick explainer for newcomers */}
      <div
        style={{
          marginTop: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '14px 16px',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13.5,
          lineHeight: 1.55,
        }}
      >
        <strong className="text-white/80">How SOS works:</strong> stuck without a sitter?
        Members can post a quick request — it shows up here in red and nearby babysitters
        get a ping right away, then reach you on WhatsApp. Browsing and helping out is free
        for everyone; turn on alerts below so you never miss an SOS.
      </div>

      <NotifyButton />

      {toast && (
        <div
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: `1px solid ${RED}66`,
            color: '#fca5a5',
            borderRadius: 10,
            padding: '12px 16px',
            marginTop: 16,
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <p className="text-white/50">Loading SOS requests…</p>
        ) : error ? (
          <p style={{ color: '#fca5a5' }}>Could not load requests: {error}</p>
        ) : requests.length === 0 ? (
          <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center">
            <p className="text-white/70 text-lg">No SOS requests right now. 🎉</p>
            <p className="text-white/50 mt-2">When a family needs urgent help, it'll show up here.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {requests.map((sos) => (
              <SosCard
                key={sos.id}
                sos={sos}
                isOwner={Boolean(user) && user.id === sos.user_id}
                onClose={handleClose}
                onDelete={handleDelete}
                busy={busyId === sos.id}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
