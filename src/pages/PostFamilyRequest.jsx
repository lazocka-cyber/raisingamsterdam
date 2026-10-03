import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AGE_GROUP_OPTIONS, AVAILABILITY_OPTIONS } from '../lib/listingUtils'

// A parent's free request ("Families looking for help"). No phone number:
// the parent contacts sitters on WhatsApp after unlocking membership.

const NAVY = '#042C53'
const ACCENT = '#34d399'

function PillGroup({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`pl-pill${selected.includes(opt) ? ' pl-pill--on' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function PostFamilyRequest() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [area, setArea] = useState('')
  const [days, setDays] = useState([])
  const [ages, setAges] = useState([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggle = (setter) => (value) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (area.trim().length < 2) {
      setError('Add your neighbourhood so babysitters know where you are.')
      return
    }
    if (days.length === 0) {
      setError('Pick at least one moment you need help.')
      return
    }
    setSubmitting(true)
    const { error: dbError } = await supabase.from('family_requests').insert({
      user_id: user.id,
      area: area.trim().slice(0, 80),
      days,
      age_groups: ages,
      note: note.trim().slice(0, 500) || null,
    })
    setSubmitting(false)
    if (dbError) {
      // 42501 = blocked by the database rule "max 3 open requests per account".
      setError(
        dbError.code === '42501'
          ? 'You already have 3 open requests. Close one under My requests first.'
          : "Couldn't post your request — please try again.",
      )
      return
    }
    navigate('/my-requests', {
      state: { toast: 'Your request is live! Babysitters can see it now.' },
      replace: true,
    })
  }

  return (
    <section className="mx-auto px-6 py-10" style={{ maxWidth: 560, '--accent': ACCENT }}>
      <h1 className="text-3xl font-bold text-white">What help do you need?</h1>
      <p className="mt-2 text-white/60">Free. Babysitters near you reply.</p>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: 22,
          background: '#1a1a2e',
          borderRadius: 16,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <label className="flex flex-col gap-2">
          <span className="text-white/70 text-sm">Neighbourhood</span>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            maxLength={80}
            placeholder="Amsterdam-Oost, De Pijp…"
            className="pl-input"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-white/70 text-sm">When?</span>
          <PillGroup options={AVAILABILITY_OPTIONS} selected={days} onToggle={toggle(setDays)} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-white/70 text-sm">Age of your children</span>
          <PillGroup options={AGE_GROUP_OPTIONS} selected={ages} onToggle={toggle(setAges)} />
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-white/70 text-sm">A few words (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="One toddler, bedtime at 19:30. English or Dutch."
            className="pl-input"
            style={{ resize: 'vertical' }}
          />
        </label>

        {error && (
          <p role="alert" style={{ color: '#fca5a5', fontSize: 14 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: 'linear-gradient(90deg, #34d399, #60d0ff)',
            color: NAVY,
            border: 'none',
            borderRadius: 12,
            padding: 14,
            fontWeight: 800,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          {submitting ? 'Posting…' : 'Post my request'}
        </button>
        <p className="text-white/40 text-xs text-center" style={{ marginTop: -8 }}>
          No phone number needed. You choose who to message.
        </p>
      </form>
    </section>
  )
}
