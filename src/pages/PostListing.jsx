import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const PURPLE = '#a78bfa'
const DESC_MAX = 500

const CATEGORIES = [
  { value: 'babysitter', label: 'Babysitter' },
  { value: 'services', label: 'Services' },
  { value: 'community', label: 'Community' },
]

const EXPERIENCE = [
  { value: 0, label: 'Less than 1 year' },
  { value: 1, label: '1-2 years' },
  { value: 3, label: '3-5 years' },
  { value: 5, label: '5+ years' },
]

const AGE_GROUPS = ['0-1 year', '1-2 years', '2-4 years', '4-6 years', '6-12 years']
const LANGUAGES = ['English', 'Dutch', 'French', 'German', 'Spanish', 'Other']
const AVAILABILITY = [
  'Monday-Friday mornings',
  'Monday-Friday afternoons',
  'Monday-Friday evenings',
  'Weekends',
  'Flexible / on-call',
  'Overnight stays',
]

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 10,
  padding: '12px 16px',
  color: 'white',
  width: '100%',
  outline: 'none',
}

function Section({ title, children }) {
  return (
    <div style={{ paddingTop: 24, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <h2 style={{ fontSize: 18, marginBottom: 16 }} className="text-white font-semibold">
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

function Label({ children }) {
  return <span className="text-white/60 text-sm">{children}</span>
}

function Pill({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: '7px 14px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        color: 'white',
        background: selected ? PURPLE : 'transparent',
        border: selected ? `1px solid ${PURPLE}` : '1px solid rgba(255,255,255,0.25)',
      }}
    >
      {children}
    </button>
  )
}

function PillGroup({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Pill key={opt} selected={selected.includes(opt)} onClick={() => onToggle(opt)}>
          {opt}
        </Pill>
      ))}
    </div>
  )
}

export default function PostListing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('babysitter')
  const [description, setDescription] = useState('')
  const [postcode, setPostcode] = useState('')
  const [neighbourhood, setNeighbourhood] = useState('')
  const [price, setPrice] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [ageGroups, setAgeGroups] = useState([])
  const [languages, setLanguages] = useState([])
  const [availability, setAvailability] = useState([])
  const [contactEmail, setContactEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggle(setter) {
    return (value) =>
      setter((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
      )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim() || !category || !postcode.trim() || !price.trim()) {
      setError('Please fill in title, category, postcode and price.')
      return
    }

    setSubmitting(true)
    try {
      const { error: dbError } = await supabase.from('listings').insert({
        user_id: user?.id ?? null,
        title: title.trim(),
        category,
        description: description.trim() || null,
        postcode: postcode.trim(),
        location: neighbourhood.trim() || null,
        price: price.trim(),
        experience_years: experienceYears === '' ? null : Number(experienceYears),
        age_groups: ageGroups.length ? ageGroups : null,
        languages: languages.length ? languages : null,
        availability: availability.length ? availability : null,
        contact_email: contactEmail.trim() || null,
        phone: phone.trim() || null,
      })
      if (dbError) {
        setError(dbError.message)
        return
      }
      navigate('/listings', { state: { toast: 'Your listing is live! 🎉' } })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto px-6 py-12" style={{ maxWidth: 680 }}>
      <h1 className="text-3xl font-bold text-white">Post a listing</h1>
      <p className="mt-2 text-white/60">
        Share your profile with the RaisingAmsterdam community.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ background: '#1a1a2e', borderRadius: 16, padding: '2rem', marginTop: 24 }}
      >
        {/* 1. BASIC INFO */}
        <h2 style={{ fontSize: 18, marginBottom: 16 }} className="text-white font-semibold">
          Basic info
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Title</Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Experienced babysitter in De Pijp"
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} style={{ color: 'black' }}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Description</Label>
            <textarea
              value={description}
              maxLength={DESC_MAX}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Tell families about yourself…"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <span
              style={{ color: '#9ca3af', fontSize: 12, textAlign: 'right' }}
            >
              {description.length}/{DESC_MAX}
            </span>
          </label>
        </div>

        {/* 2. LOCATION & RATE */}
        <Section title="Location & rate">
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Postcode</Label>
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="1234 AB"
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Neighbourhood</Label>
            <input
              type="text"
              value={neighbourhood}
              onChange={(e) => setNeighbourhood(e.target.value)}
              placeholder="De Pijp, Oud-West…"
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Price</Label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="€12/hour or Free or negotiable"
              style={inputStyle}
            />
          </label>
        </Section>

        {/* 3. EXPERIENCE */}
        <Section title="Experience">
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Years of experience</Label>
            <select
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              style={inputStyle}
            >
              <option value="" style={{ color: 'black' }}>
                Select…
              </option>
              {EXPERIENCE.map((x) => (
                <option key={x.value} value={x.value} style={{ color: 'black' }}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label>Age groups you work with</Label>
            <PillGroup
              options={AGE_GROUPS}
              selected={ageGroups}
              onToggle={toggle(setAgeGroups)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label>Languages spoken</Label>
            <PillGroup
              options={LANGUAGES}
              selected={languages}
              onToggle={toggle(setLanguages)}
            />
          </div>
        </Section>

        {/* 4. AVAILABILITY */}
        <Section title="Availability">
          <PillGroup
            options={AVAILABILITY}
            selected={availability}
            onToggle={toggle(setAvailability)}
          />
        </Section>

        {/* 5. CONTACT */}
        <Section title="Contact">
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Contact email</Label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Phone / WhatsApp (optional)</Label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+31 6 …"
              style={inputStyle}
            />
          </label>
        </Section>

        {error && (
          <p style={{ color: '#f87171', marginTop: 16, fontSize: 14 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 24,
            background: PURPLE,
            color: 'white',
            borderRadius: 10,
            padding: 14,
            width: '100%',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {submitting ? 'Publishing…' : 'Publish listing'}
        </button>
      </form>
    </section>
  )
}
