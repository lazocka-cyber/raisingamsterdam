import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { LISTING_COLUMNS } from '../lib/listingUtils'
import { trackLead, getAttribution } from '../lib/tracking.js'
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

// Resize/compress an image in the browser before upload so any phone photo
// works: scale longest side down to `maxSize` px and export as JPEG. Returns
// a Blob, or rejects if the file isn't a readable image.
function resizeImage(file, maxSize = 600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width >= height && width > maxSize) {
        height = Math.round((height * maxSize) / width)
        width = maxSize
      } else if (height > width && height > maxSize) {
        width = Math.round((width * maxSize) / height)
        height = maxSize
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not process that image.'))),
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    img.src = url
  })
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
  const { id } = useParams()
  const isEdit = Boolean(id)

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
  const [photoUrl, setPhotoUrl] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')

  // In edit mode, load the existing listing (only if it belongs to the user)
  // and prefill the form.
  useEffect(() => {
    if (!isEdit || !user) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error: dbError } = await supabase
        .from('listings')
        .select(LISTING_COLUMNS)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      if (cancelled) return
      if (dbError || !data) {
        setError("This listing couldn't be loaded, or it isn't yours to edit.")
        setLoading(false)
        return
      }
      setTitle(data.title ?? '')
      setCategory(data.category ?? 'babysitter')
      setDescription(data.description ?? '')
      setPostcode(data.postcode ?? '')
      setNeighbourhood(data.location ?? '')
      setPrice(data.price ?? '')
      setExperienceYears(
        data.experience_years == null ? '' : String(data.experience_years),
      )
      setAgeGroups(data.age_groups ?? [])
      setLanguages(data.languages ?? [])
      setAvailability(data.availability ?? [])
      setPhotoUrl(data.photo_url ?? '')
      // Phone is no longer part of the public listing row — fetch the owner's
      // own number securely via the contact RPC (it returns it to the owner).
      const { data: ownPhone } = await supabase.rpc('get_listing_contact', {
        p_listing_id: id,
      })
      if (!cancelled) setPhone(ownPhone ?? '')
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isEdit, id, user])

  function toggle(setter) {
    return (value) =>
      setter((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
      )
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setPhotoError('')

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPG or PNG).')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setPhotoError('That image is enormous — please pick one under 25 MB.')
      return
    }
    if (!user) {
      setPhotoError('Please sign in again to upload a photo.')
      return
    }

    setPhotoUploading(true)
    try {
      // Shrink in the browser first, so even big phone photos upload fast.
      const blob = await resizeImage(file)
      const path = `${user.id}/${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('listing-photos')
        .upload(path, blob, { upsert: true, cacheControl: '3600', contentType: 'image/jpeg' })
      if (upErr) {
        setPhotoError(upErr.message)
        return
      }
      const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
      setPhotoUrl(data.publicUrl)
    } catch (err) {
      setPhotoError(err.message || 'Upload failed. Please try again.')
    } finally {
      setPhotoUploading(false)
    }
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
      const payload = {
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
        photo_url: photoUrl || null,
      }

      const { error: dbError } = isEdit
        ? await supabase.from('listings').update(payload).eq('id', id)
        : await supabase
            .from('listings')
            // source = odkud přišel (utm/fbclid/referrer) — jen u nového inzerátu
            .insert({ ...payload, user_id: user?.id ?? null, source: getAttribution() })

      if (dbError) {
        setError(dbError.message)
        return
      }
      if (isEdit) {
        navigate('/my-listings', { state: { toast: 'Listing updated! ✅' } })
      } else {
        // Meta Pixel konverze — až po potvrzeném úspěchu insertu
        trackLead()
        navigate('/listings', { state: { toast: 'Your listing is live! 🎉' } })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isEdit && loading) {
    return (
      <section className="mx-auto px-6 py-16 text-center text-white/60" style={{ maxWidth: 680 }}>
        Loading your listing…
      </section>
    )
  }

  return (
    <section className="mx-auto px-6 py-12" style={{ maxWidth: 680 }}>
      <ParticleHeader>
        <h1 className="pl-title">{isEdit ? 'Edit listing' : 'Post a listing'}</h1>
      </ParticleHeader>

      <p className="mt-3 text-white/60">
        {isEdit
          ? 'Update your listing details below.'
          : 'Share your profile with the RaisingAmsterdam community.'}
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        {/* 1. BASIC INFO */}
        <Card accent={ACCENT.basic} icon={<PencilIcon color={ACCENT.basic} />} title="Basic info">
          {/* Photo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label>Photo</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  flexShrink: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  background: 'rgba(255,255,255,0.07)',
                  border: `2px solid ${ACCENT.basic}55`,
                }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Your listing"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>🍼</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  style={{
                    background: 'rgba(167,139,250,0.15)',
                    color: ACCENT.basic,
                    border: `1px solid ${ACCENT.basic}55`,
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: photoUploading ? 'wait' : 'pointer',
                    width: 'fit-content',
                  }}
                >
                  {photoUploading
                    ? 'Uploading…'
                    : photoUrl
                      ? 'Change photo'
                      : '📷 Upload photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={photoUploading}
                    style={{ display: 'none' }}
                  />
                </label>
                {photoUrl && !photoUploading && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              A friendly face helps parents choose you. Any photo works — we'll resize it for you.
            </span>
            {photoError && (
              <span style={{ color: '#f87171', fontSize: 12 }}>{photoError}</span>
            )}
          </div>

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
              Where you work / where you're based
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
          {submitting
            ? isEdit
              ? 'Saving…'
              : 'Publishing…'
            : isEdit
              ? '✅ Save changes'
              : '🎉 Publish listing'}
        </button>
      </form>
    </section>
  )
}
