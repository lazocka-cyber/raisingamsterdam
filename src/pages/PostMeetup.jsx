import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const PURPLE = '#a78bfa'
const BLUE = '#60d0ff'
const GREEN = '#34d399'

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

function TypeButton({ active, color, onClick, emoji, label, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: 'left',
        background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 12,
        padding: '12px 14px',
        cursor: 'pointer',
      }}
    >
      <span className="block font-semibold text-white">
        {emoji} {label}
      </span>
      <span className="block text-white/55 text-xs mt-1">{hint}</span>
    </button>
  )
}

export default function PostMeetup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [type, setType] = useState('meetup')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [area, setArea] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const isMeetup = type === 'meetup'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Please add a short title.')
      return
    }
    if (isMeetup && !eventDate) {
      setError('Please pick a date for your meetup.')
      return
    }
    // WhatsApp is optional, but if given it must look valid.
    let normalizedPhone = ''
    if (whatsapp.trim()) {
      normalizedPhone = whatsapp.replace(/[\s-]/g, '')
      if (!/^(\+\d{8,15}|0\d{8,12})$/.test(normalizedPhone)) {
        setError('Enter a valid WhatsApp number, e.g. +31612345678 or 0612345678.')
        return
      }
    }

    // Meetups disappear at the end of the event day; intros stay until removed.
    const expiresAt = isMeetup
      ? new Date(`${eventDate}T23:59:59`).toISOString()
      : null

    setSubmitting(true)
    try {
      const { error: dbError } = await supabase.from('meetups').insert({
        user_id: user?.id ?? null,
        type,
        title: title.trim(),
        body: body.trim() || null,
        area: area.trim() || null,
        event_date: isMeetup ? eventDate : null,
        event_time: isMeetup ? eventTime.trim() || null : null,
        whatsapp: normalizedPhone || null,
        expires_at: expiresAt,
      })
      if (dbError) {
        setError(dbError.message)
        return
      }
      navigate('/meetups', {
        state: {
          toast: isMeetup
            ? 'Your meetup is live — other parents can join! 🎉'
            : 'Your intro is live — say hi to the community! 👋',
        },
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto px-6 py-12" style={{ maxWidth: 560 }}>
      <h1 className="text-3xl font-bold text-white">New post</h1>
      <p className="mt-2 text-white/60">
        Organise a get-together, or simply introduce yourself to other expat parents nearby.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: 24,
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Type chooser */}
        <div style={{ display: 'flex', gap: 10 }}>
          <TypeButton
            active={isMeetup}
            color={BLUE}
            onClick={() => setType('meetup')}
            emoji="🗓️"
            label="Meetup"
            hint="A coffee, walk or playdate at a set time"
          />
          <TypeButton
            active={!isMeetup}
            color={GREEN}
            onClick={() => setType('intro')}
            emoji="👋"
            label="Intro"
            hint="Say hi and find families nearby"
          />
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>Title *</Label>
          <input
            type="text"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isMeetup ? 'Coffee & babies in Vondelpark' : 'Mum of a 2yo in Noord, would love to meet'}
            style={inputStyle}
          />
        </label>

        {isMeetup && (
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <Label>Date *</Label>
              <input
                type="date"
                min={today}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <Label>Time</Label>
              <input
                type="text"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="10:00"
                style={inputStyle}
              />
            </label>
          </div>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>Area / neighbourhood</Label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Amsterdam Noord"
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>{isMeetup ? 'Details' : 'About you'}</Label>
          <textarea
            value={body}
            maxLength={400}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder={
              isMeetup
                ? 'Who it’s for, what to bring, where exactly to meet…'
                : 'Your kids’ ages, languages you speak, what you’re looking for…'
            }
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>Your WhatsApp number (optional)</Label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+31612345678 or 0612345678"
            style={inputStyle}
          />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            Other parents will reach you here. Leave empty to keep it private.
          </span>
        </label>

        {error && <p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: `linear-gradient(90deg, ${PURPLE}, ${BLUE})`,
            color: '#0b1220',
            border: 'none',
            borderRadius: 12,
            padding: '14px',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {submitting ? 'Posting…' : isMeetup ? '🗓️ Post meetup' : '👋 Post intro'}
        </button>
      </form>
    </section>
  )
}
