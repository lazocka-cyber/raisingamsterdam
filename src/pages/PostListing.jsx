import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ParticleHeader from '../components/ParticleHeader'

const DESC_MAX = 500

// Section accent colours
const ACCENT = {
  basic: '#a78bfa',
  location: '#60d0ff',
  experience: '#34d399',
  contact: '#f97316',
}

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

// ─── Animated draw-on section icons (same style as the homepage icons) ───
function Icon({ children }) {
  return (
    <span className="feature-icon">
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  )
}

function PencilIcon({ color }) {
  return (
    <Icon>
      <path
        className="draw-path"
        pathLength="1"
        stroke={color}
        d="M4 20l4-1 9.6-9.6a2 2 0 0 0-2.8-2.8L5.2 15.2 4 20z"
      />
      <path className="draw-path" pathLength="1" stroke={color} d="M18.5 4.5l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5L16.4 6.6l1.5-.6z" />
    </Icon>
  )
}

function PinIcon({ color }) {
  return (
    <Icon>
      <path className="draw-path" pathLength="1" stroke={color} d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11z" />
      <circle className="draw-path" pathLength="1" stroke={color} cx="12" cy="10" r="2.6" />
    </Icon>
  )
}

function StarIcon({ color }) {
  return (
    <Icon>
      <path
        className="draw-path"
        pathLength="1"
        stroke={color}
        d="M12 3.2l2.6 5.6 6 .8-4.4 4.1 1.1 6L12 16.9 6.7 19.7l1.1-6L3.4 9.6l6-.8z"
      />
    </Icon>
  )
}

function ChatIcon({ color }) {
  return (
    <Icon>
      <path
        className="draw-path"
        pathLength="1"
        stroke={color}
        d="M5 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3.5V6a1 1 0 0 1 1-1z"
      />
      <path className="draw-path" pathLength="1" stroke={color} d="M8 9.5h8" />
      <path className="draw-path" pathLength="1" stroke={color} d="M8 12.5h5" />
    </Icon>
  )
}

// ─── Layout helpers ───
function Card({ accent, icon, title, children }) {
  return (
    <div className="pl-card" style={{ '--accent': accent }}>
      <div className="pl-card__title">
        {icon}
        <span>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

function Label({ children }) {
  return <span className="text-white/60 text-sm">{children}</span>
}

function Pill({ selected, onClick, children }) {
  const [pop, setPop] = useState(false)
  return (
    <button
      type="button"
      className={`pl-pill${selected ? ' pl-pill--on' : ''}${pop ? ' pl-pop' : ''}`}
      onClick={() => {
        setPop(true)
        onClick()
      }}
      onAnimationEnd={() => setPop(false)}
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

    const normalizedPhone = phone.replace(/[\s-]/g, '')
    if (!normalizedPhone) {
      setError('Please enter a WhatsApp number so members can contact you.')
      return
    }
    if (!/^(\+\d{8,15}|0\d{8,12})$/.test(normalizedPhone)) {
      setError('Enter a valid WhatsApp number, e.g. +31612345678 or 0612345678.')
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
        phone: normalizedPhone,
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
      <ParticleHeader>
        <h1 className="pl-title">Post a listing</h1>
      </ParticleHeader>

      <p className="mt-3 text-white/60">
        Share your profile with the RaisingAmsterdam community.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        {/* 1. BASIC INFO */}
        <Card accent={ACCENT.basic} icon={<PencilIcon color={ACCENT.basic} />} title="Basic info">
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Title</Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Experienced babysitter in De Pijp"
              className="pl-input"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pl-input"
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
              className="pl-input"
              style={{ resize: 'vertical' }}
            />
            <span style={{ color: '#9ca3af', fontSize: 12, textAlign: 'right' }}>
              {description.length}/{DESC_MAX}
            </span>
          </label>
        </Card>

        {/* 2. LOCATION & RATE */}
        <Card
          accent={ACCENT.location}
          icon={<PinIcon color={ACCENT.location} />}
          title="Location & rate"
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Postcode</Label>
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="1234 AB"
              className="pl-input"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Area(s)</Label>
            <input
              type="text"
              value={neighbourhood}
              onChange={(e) => setNeighbourhood(e.target.value)}
              placeholder="De Pijp, Oud-West…"
              className="pl-input"
            />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              Where you work or where the item can be picked up
            </span>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Price</Label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="€12/hour or Free or negotiable"
              className="pl-input"
            />
          </label>
        </Card>

        {/* 3. EXPERIENCE + AVAILABILITY */}
        <Card
          accent={ACCENT.experience}
          icon={<StarIcon color={ACCENT.experience} />}
          title="Experience & availability"
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Years of experience</Label>
            <select
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="pl-input"
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
            <PillGroup options={AGE_GROUPS} selected={ageGroups} onToggle={toggle(setAgeGroups)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label>Languages spoken</Label>
            <PillGroup options={LANGUAGES} selected={languages} onToggle={toggle(setLanguages)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label>Availability</Label>
            <PillGroup
              options={AVAILABILITY}
              selected={availability}
              onToggle={toggle(setAvailability)}
            />
          </div>
        </Card>

        {/* 4. CONTACT */}
        <Card accent={ACCENT.contact} icon={<ChatIcon color={ACCENT.contact} />} title="Contact">
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>WhatsApp number</Label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+31612345678 or 0612345678"
              className="pl-input"
            />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              Members will contact you via WhatsApp
            </span>
          </label>
        </Card>

        {error && <p style={{ color: '#f87171', marginTop: 16, fontSize: 14 }}>{error}</p>}

        <button type="submit" disabled={submitting} className="pl-submit">
          {submitting ? 'Publishing…' : '🎉 Publish listing'}
        </button>
      </form>
    </section>
  )
}
