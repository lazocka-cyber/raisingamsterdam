import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const RED = '#ef4444'
const GREEN = '#34d399'
const NAVY = '#042C53'
const AGE_GROUPS = ['0-1 year', '1-2 years', '2-4 years', '4-6 years', '6-12 years']

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 10,
  padding: '12px 14px',
  color: 'white',
  width: '100%',
  outline: 'none',
}

function Label({ children }) {
  return <span className="text-white/60 text-sm">{children}</span>
}

export default function PostSos() {
  const { user, isMember } = useAuth()
  const navigate = useNavigate()

  // Posting an SOS is a member perk.
  if (!isMember) {
    return (
      <section className="mx-auto px-6 py-16" style={{ maxWidth: 520 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 16 }} className="p-10 text-center">
          <div style={{ fontSize: 38 }}>🚨</div>
          <h1 className="text-white text-2xl font-bold mt-2">Posting SOS is a member feature</h1>
          <p className="text-white/65 mt-3">
            Become a member to post urgent requests and reach nearby babysitters in
            seconds. Browsing and helping out stays free for everyone.
          </p>
          <Link
            to="/membership"
            style={{ display: 'inline-block', marginTop: 22, background: GREEN, color: NAVY, borderRadius: 10, padding: '11px 22px', fontWeight: 700 }}
          >
            Become a member
          </Link>
        </div>
      </section>
    )
  }

  const [neededDate, setNeededDate] = useState('')
  const [neededTime, setNeededTime] = useState('')
  const [area, setArea] = useState('')
  const [postcode, setPostcode] = useState('')
  const [childAge, setChildAge] = useState('')
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!neededDate) {
      setError('Please pick the date you need help.')
      return
    }
    if (!area.trim() && !postcode.trim()) {
      setError('Please add an area or a postcode so sitters know where you are.')
      return
    }
    const normalizedPhone = phone.replace(/[\s-]/g, '')
    if (!/^(\+\d{8,15}|0\d{8,12})$/.test(normalizedPhone)) {
      setError('Enter a valid WhatsApp number, e.g. +31612345678 or 0612345678.')
      return
    }

    // The request stays visible until the end of the day it's needed.
    const expiresAt = new Date(`${neededDate}T23:59:59`).toISOString()

    setSubmitting(true)
    try {
      const { error: dbError } = await supabase.from('sos_requests').insert({
        user_id: user?.id ?? null,
        area: area.trim() || null,
        postcode: postcode.trim() || null,
        child_age: childAge || null,
        needed_date: neededDate,
        needed_time: neededTime.trim() || null,
        note: note.trim() || null,
        phone: normalizedPhone,
        expires_at: expiresAt,
      })
      if (dbError) {
        setError(dbError.message)
        return
      }
      navigate('/sos', { state: { toast: 'Your SOS is live — sitters can see it now! 🚨' } })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto px-6 py-12" style={{ maxWidth: 560 }}>
      <h1 className="text-3xl font-bold text-white flex items-center gap-2">
        🚨 Need a sitter now
      </h1>
      <p className="mt-2 text-white/60">
        Post an urgent request and available sitters in Amsterdam can reach you right away.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: 24,
          background: '#1a1a2e',
          border: `1px solid ${RED}55`,
          borderRadius: 16,
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>When do you need help? *</Label>
          <input
            type="date"
            min={today}
            value={neededDate}
            onChange={(e) => setNeededDate(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>Time</Label>
          <input
            type="text"
            value={neededTime}
            onChange={(e) => setNeededTime(e.target.value)}
            placeholder="e.g. tonight 18:00–22:00"
            style={inputStyle}
          />
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <Label>Area</Label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="De Pijp"
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <Label>Postcode</Label>
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="1234 AB"
              style={inputStyle}
            />
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>Child's age</Label>
          <select
            value={childAge}
            onChange={(e) => setChildAge(e.target.value)}
            style={inputStyle}
          >
            <option value="" style={{ color: 'black' }}>
              Select…
            </option>
            {AGE_GROUPS.map((a) => (
              <option key={a} value={a} style={{ color: 'black' }}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>Note</Label>
          <textarea
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Anything sitters should know…"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>Your WhatsApp number *</Label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+31612345678 or 0612345678"
            style={inputStyle}
          />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            Sitters will message you here.
          </span>
        </label>

        {error && <p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: `linear-gradient(90deg, ${RED}, #f97316)`,
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '14px',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {submitting ? 'Posting…' : '🚨 Post SOS request'}
        </button>
      </form>
    </section>
  )
}
