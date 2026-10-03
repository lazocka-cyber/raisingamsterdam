import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Stars } from './Stars'

// Owner side of references (see supabase/sitter_references.sql): the share
// link, WhatsApp/copy buttons, and approving references families have sent.

const SITE = 'https://raisingamsterdam.com'

const smallBtn = {
  borderRadius: 8,
  padding: '7px 12px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

export default function ReferencesManager({ listingId }) {
  const [refs, setRefs] = useState([])
  const [copied, setCopied] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const link = `${SITE}/reference/${listingId}`
  const message =
    `Hi! I'm collecting references on RaisingAmsterdam. Would you write a few words about working with me? ` +
    `It takes 1 minute, no account needed: ${link}`

  useEffect(() => {
    let cancelled = false
    supabase
      .from('sitter_references')
      .select('id, author_name, relation, rating, comment, status, created_at')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setRefs(data ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [listingId])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copy this link:', link)
    }
  }

  async function setStatus(id, status) {
    setBusyId(id)
    setError('')
    const { error: rpcError } = await supabase.rpc('set_reference_status', {
      p_id: id,
      p_status: status,
    })
    setBusyId(null)
    if (rpcError) {
      setError("Couldn't save — please try again.")
      return
    }
    setRefs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  const pending = refs.filter((r) => r.status === 'pending')
  const approved = refs.filter((r) => r.status === 'approved')

  return (
    <div
      style={{
        border: '1px solid rgba(167,139,250,0.45)',
        background: 'rgba(167,139,250,0.08)',
        borderRadius: 12,
        padding: '14px 14px',
      }}
    >
      <p className="text-white font-semibold">⭐ Get references</p>
      <p className="text-white/60 text-sm" style={{ marginTop: 4, lineHeight: 1.5 }}>
        Families you've worked for can vouch for you — no account needed. You approve each
        one before it shows.
      </p>
      <p
        className="text-white/50 text-xs"
        style={{ marginTop: 8, wordBreak: 'break-all', userSelect: 'all' }}
      >
        {link}
      </p>
      <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...smallBtn, background: '#25D366', color: '#073b1c' }}
        >
          Send on WhatsApp
        </a>
        <button
          type="button"
          onClick={copyLink}
          style={{
            ...smallBtn,
            background: 'transparent',
            color: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
      </div>

      {pending.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="text-white text-sm font-semibold">
            {pending.length} new {pending.length === 1 ? 'reference' : 'references'} to approve
          </p>
          {pending.map((r) => (
            <div key={r.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12 }}>
              <Stars value={r.rating} size={14} />
              <p className="text-white/80 text-sm" style={{ marginTop: 6, whiteSpace: 'pre-line' }}>
                {r.comment}
              </p>
              <p className="text-white/50 text-xs" style={{ marginTop: 4 }}>
                {r.author_name}
                {r.relation ? ` · ${r.relation}` : ''}
              </p>
              <div className="flex gap-2" style={{ marginTop: 10 }}>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => setStatus(r.id, 'approved')}
                  style={{ ...smallBtn, background: '#34d399', color: '#042C53', border: 'none' }}
                >
                  Show on my profile
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => setStatus(r.id, 'hidden')}
                  style={{
                    ...smallBtn,
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  Don't show
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary className="text-white/60 text-sm" style={{ cursor: 'pointer' }}>
            {approved.length} on your profile
          </summary>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approved.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3">
                <span className="text-white/70 text-sm">
                  {r.author_name} · {r.rating}★
                </span>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => setStatus(r.id, 'hidden')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Hide
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{error}</p>}
    </div>
  )
}
