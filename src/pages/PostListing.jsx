import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { LISTING_COLUMNS } from '../lib/listingUtils'
import { trackLead, getAttribution } from '../lib/tracking.js'
import { buzz, playTada } from '../lib/attention.js'
import ParticleHeader from '../components/ParticleHeader'
import ConfettiBurst from '../components/ConfettiBurst'

const DESC_MAX = 500

// Remembers "I offer babysitting" across mounts for this browser session, so
// coming back from the exit-warning modal doesn't re-ask the role question.
// Module-level on purpose: survives SPA navigation, resets on full reload.
let sitterRoleChosen = false

// Unfinished new-listing answers survive tab closes and the exit modal.
const DRAFT_KEY = 'ra_listing_draft_v1'

const NEGOTIABLE_PRICE = 'To be agreed with the parents'

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

// "Part X of 3" progress bar for the create wizard.
function WizardProgress({ step }) {
  const LABELS = ['What you offer', 'Contact & area', 'Finishing touches']
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              background:
                n <= step ? 'linear-gradient(90deg, #34d399, #60d0ff)' : 'rgba(255,255,255,0.12)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
      <p className="text-white/60 text-sm mt-2" style={{ fontWeight: 600 }}>
        Part {step} of 3 — {LABELS[step - 1]}
        {step === 3 && <span className="text-white/40"> (optional)</span>}
      </p>
    </div>
  )
}

function readDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
  } catch {
    return null
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export default function PostListing() {
  const { user, markListingPosted, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  // Set when the listing gate forwarded a user who has no listing yet.
  const isWelcome = !isEdit && searchParams.get('welcome') === '1'
  // Draft is read once per mount (create mode only) and seeds the fields, so
  // closing the tab or wandering off never loses the answers.
  const [draft] = useState(() => (isEdit ? null : readDraft()))
  const draftRestored = Boolean(
    draft && (draft.title || draft.description || draft.phone || draft.postcode),
  )

  // Welcome flow starts with a role fork: sitters continue to the form,
  // parents get their profile flipped and are sent to browse listings.
  // A saved draft counts as "already chose sitter" — don't ask again.
  const [roleChosen, setRoleChosenState] = useState(() => sitterRoleChosen || draftRestored)
  function setRoleChosen(v) {
    sitterRoleChosen = v
    setRoleChosenState(v)
  }
  const [roleSaving, setRoleSaving] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  const [step, setStep] = useState(() => (draft?.step === 2 ? 2 : 1))
  const [createdId, setCreatedId] = useState(null)
  const published = Boolean(createdId)

  const [title, setTitle] = useState(draft?.title ?? '')
  const [category, setCategory] = useState(draft?.category ?? 'babysitter')
  const [description, setDescription] = useState(draft?.description ?? '')
  const [postcode, setPostcode] = useState(draft?.postcode ?? '')
  const [neighbourhood, setNeighbourhood] = useState(draft?.neighbourhood ?? '')
  const [price, setPrice] = useState(draft?.price ?? '')
  const [priceNegotiable, setPriceNegotiable] = useState(draft?.priceNegotiable ?? false)
  const [experienceYears, setExperienceYears] = useState(draft?.experienceYears ?? '')
  const [ageGroups, setAgeGroups] = useState(draft?.ageGroups ?? [])
  const [languages, setLanguages] = useState(draft?.languages ?? [])
  const [availability, setAvailability] = useState(draft?.availability ?? [])
  const [phone, setPhone] = useState(draft?.phone ?? '')
  const [photoUrl, setPhotoUrl] = useState('')

  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')

  // Refs so a failed validation can scroll straight to the guilty field.
  const titleRef = useRef(null)
  const descriptionRef = useRef(null)
  const ageGroupsRef = useRef(null)
  const phoneRef = useRef(null)
  const postcodeRef = useRef(null)

  // A little phone buzz on arriving at the welcome step — "one more thing!".
  useEffect(() => {
    if (isWelcome) buzz()
  }, [isWelcome])

  // Autosave the draft (debounced) while the new listing isn't published yet.
  useEffect(() => {
    if (isEdit || published) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            step: step === 3 ? 2 : step,
            title,
            category,
            description,
            postcode,
            neighbourhood,
            price,
            priceNegotiable,
            experienceYears,
            ageGroups,
            languages,
            availability,
            phone,
          }),
        )
      } catch {
        // Storage blocked — the form still works, the draft just won't survive.
      }
    }, 500)
    return () => clearTimeout(t)
  }, [
    isEdit,
    published,
    step,
    title,
    category,
    description,
    postcode,
    neighbourhood,
    price,
    priceNegotiable,
    experienceYears,
    ageGroups,
    languages,
    availability,
    phone,
  ])

  // Native browser warning when closing/reloading the tab with an unsaved,
  // unpublished form (create mode only). The draft catches most of it, but
  // storage-blocked webviews still benefit.
  const dirty =
    !isEdit &&
    !celebrating &&
    !published &&
    Boolean(
      title.trim() ||
        description.trim() ||
        postcode.trim() ||
        price.trim() ||
        phone.trim(),
    )
  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(e) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  async function chooseParent() {
    if (!user || roleSaving) return
    setRoleSaving(true)
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'parent' })
      .eq('id', user.id)
    if (roleError) {
      setRoleSaving(false)
      setError("Couldn't save your choice — please try again.")
      return
    }
    await refreshProfile()
    navigate('/listings', {
      state: { toast: 'Welcome! Browse sitters below 👋' },
      replace: true,
    })
  }

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
      setPriceNegotiable(data.price === NEGOTIABLE_PRICE)
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

  function fail(field, ref, message) {
    setError(message)
    setErrorField(field)
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    ref?.current?.focus?.()
  }

  function clearFail() {
    setError('')
    setErrorField('')
  }

  function validateStep1() {
    if (!title.trim()) {
      fail('title', titleRef, 'Please add a short title, e.g. "Experienced babysitter in De Pijp".')
      return false
    }
    if (!description.trim()) {
      fail(
        'description',
        descriptionRef,
        'Please describe what you offer — parents read this first.',
      )
      return false
    }
    if (category === 'babysitter' && ageGroups.length === 0) {
      fail('ageGroups', ageGroupsRef, 'Please pick at least one age group you work with.')
      return false
    }
    return true
  }

  function validateStep2() {
    const normalizedPhone = phone.replace(/[\s-]/g, '')
    if (!normalizedPhone) {
      fail('phone', phoneRef, 'Please enter a WhatsApp number so parents can contact you.')
      return false
    }
    if (!/^(\+\d{8,15}|0\d{8,12})$/.test(normalizedPhone)) {
      fail(
        'phone',
        phoneRef,
        'Enter a valid WhatsApp number, e.g. +31612345678 or 0612345678.',
      )
      return false
    }
    if (!postcode.trim()) {
      fail(
        'postcode',
        postcodeRef,
        "Please fill in a postcode — not sure? Just type 0000.",
      )
      return false
    }
    return true
  }

  function handleNext(e) {
    e.preventDefault()
    if (!validateStep1()) return
    clearFail()
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handlePublish(e) {
    e.preventDefault()
    if (!validateStep2()) return
    clearFail()

    const normalizedPhone = phone.replace(/[\s-]/g, '')
    const finalPrice = priceNegotiable ? NEGOTIABLE_PRICE : price.trim() || null

    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        category,
        description: description.trim() || null,
        postcode: postcode.trim(),
        location: neighbourhood.trim() || null,
        price: finalPrice,
        experience_years: experienceYears === '' ? null : Number(experienceYears),
        age_groups: ageGroups.length ? ageGroups : null,
        languages: languages.length ? languages : null,
        availability: availability.length ? availability : null,
        phone: normalizedPhone,
        photo_url: photoUrl || null,
      }

      const { data: inserted, error: dbError } = await supabase
        .from('listings')
        // source = odkud přišel (utm/fbclid/referrer) — jen u nového inzerátu
        .insert({ ...payload, user_id: user?.id ?? null, source: getAttribution() })
        .select('id')
        .single()

      if (dbError) {
        setError(dbError.message)
        return
      }
      // Meta Pixel konverze — až po potvrzeném úspěchu insertu
      trackLead()
      // Tell the gate the listing exists so it stops redirecting instantly.
      markListingPosted()
      clearDraft()
      setCreatedId(inserted?.id ?? null)
      // Celebrate: sound (allowed — we're inside the submit gesture),
      // vibration, confetti. Step 3 opens when the confetti ends.
      playTada()
      buzz([60, 40, 60, 40, 160])
      setCelebrating(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Step 3 saves the optional extras onto the already-published row.
  async function handleSaveExtras(e) {
    e.preventDefault()
    if (!createdId) {
      navigate('/listings', { state: { toast: 'Your listing is live! 🎉' } })
      return
    }
    setSubmitting(true)
    try {
      const { error: dbError } = await supabase
        .from('listings')
        .update({
          photo_url: photoUrl || null,
          location: neighbourhood.trim() || null,
          experience_years: experienceYears === '' ? null : Number(experienceYears),
          languages: languages.length ? languages : null,
          availability: availability.length ? availability : null,
        })
        .eq('id', createdId)
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

  async function handleEditSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim() || !category || !postcode.trim()) {
      setError('Please fill in title, category and postcode.')
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
        price: priceNegotiable ? NEGOTIABLE_PRICE : price.trim() || null,
        experience_years: experienceYears === '' ? null : Number(experienceYears),
        age_groups: ageGroups.length ? ageGroups : null,
        languages: languages.length ? languages : null,
        availability: availability.length ? availability : null,
        phone: normalizedPhone,
        photo_url: photoUrl || null,
      }
      const { error: dbError } = await supabase.from('listings').update(payload).eq('id', id)
      if (dbError) {
        setError(dbError.message)
        return
      }
      navigate('/my-listings', { state: { toast: 'Listing updated! ✅' } })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function inputClass(field) {
    return `pl-input${errorField === field ? ' pl-input--error' : ''}`
  }

  // ─── Shared field blocks (used by both the wizard and edit mode) ───

  const photoField = (
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
  )

  const priceField = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label>
        Price{' '}
        <span style={{ color: 'rgba(52,211,153,0.9)', fontWeight: 600 }}>(recommended)</span>
      </Label>
      <input
        type="text"
        value={priceNegotiable ? '' : price}
        disabled={priceNegotiable}
        onChange={(e) => setPrice(e.target.value)}
        placeholder={priceNegotiable ? NEGOTIABLE_PRICE : '€12/hour'}
        className="pl-input"
        style={priceNegotiable ? { opacity: 0.55 } : undefined}
      />
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'rgba(255,255,255,0.55)',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={priceNegotiable}
          onChange={(e) => setPriceNegotiable(e.target.checked)}
          style={{ accentColor: '#34d399', width: 15, height: 15 }}
        />
        To be agreed with the parents
      </label>
    </div>
  )

  const areasField = (
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
  )

  const experienceField = (
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
  )

  const languagesField = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Label>Languages spoken</Label>
      <PillGroup options={LANGUAGES} selected={languages} onToggle={toggle(setLanguages)} />
    </div>
  )

  const availabilityField = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Label>Availability</Label>
      <PillGroup
        options={AVAILABILITY}
        selected={availability}
        onToggle={toggle(setAvailability)}
      />
    </div>
  )

  if (isEdit && loading) {
    return (
      <section className="mx-auto px-6 py-16 text-center text-white/60" style={{ maxWidth: 680 }}>
        Loading your listing…
      </section>
    )
  }

  // Welcome step 0: role fork. Every new account defaults to 'sitter', so
  // parents who just signed up land here too — give them a way out instead
  // of pushing them into a babysitter form they don't understand.
  if (isWelcome && !roleChosen) {
    return (
      <section className="mx-auto px-6 py-12" style={{ maxWidth: 560 }}>
        <p
          className="text-center font-bold"
          style={{ color: '#34d399', fontSize: 14, letterSpacing: '0.06em' }}
        >
          STEP 2 OF 2
        </p>
        <h1 className="text-white text-3xl font-bold text-center mt-2">
          You're in! 🎉 One thing left…
        </h1>
        <p className="text-white/65 text-center mt-3">Which one are you?</p>

        <button
          type="button"
          onClick={() => {
            buzz()
            setRoleChosen(true)
          }}
          className="listing-cta-pulse"
          style={{
            display: 'block',
            width: '100%',
            marginTop: 28,
            background: 'linear-gradient(135deg, rgba(52,211,153,0.22), rgba(96,208,255,0.18))',
            border: '2px solid rgba(52,211,153,0.65)',
            borderRadius: 18,
            padding: '22px 20px',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <span className="text-white font-bold" style={{ fontSize: 19 }}>
            🍼 I offer babysitting or a service
          </span>
          <span className="block text-white/70 mt-1" style={{ fontSize: 14 }}>
            Post your free listing so families can find you — takes 2 minutes.
          </span>
        </button>

        <button
          type="button"
          onClick={chooseParent}
          disabled={roleSaving}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 14,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 18,
            padding: '18px 20px',
            textAlign: 'left',
            cursor: roleSaving ? 'wait' : 'pointer',
          }}
        >
          <span className="text-white font-bold" style={{ fontSize: 17 }}>
            👨‍👩‍👧 I'm a parent looking for help
          </span>
          <span className="block text-white/60 mt-1" style={{ fontSize: 14 }}>
            {roleSaving ? 'One moment…' : 'Browse babysitters and local services.'}
          </span>
        </button>

        {error && <p style={{ color: '#f87171', marginTop: 16, fontSize: 14 }}>{error}</p>}
      </section>
    )
  }

  // ─── Edit mode: the classic single-page form ───
  if (isEdit) {
    return (
      <section className="mx-auto px-6 py-12" style={{ maxWidth: 680 }}>
        <ParticleHeader>
          <h1 className="pl-title">Edit listing</h1>
        </ParticleHeader>
        <p className="mt-3 text-white/60">Update your listing details below.</p>

        <form onSubmit={handleEditSubmit} style={{ marginTop: 24 }}>
          <Card accent={ACCENT.basic} icon={<PencilIcon color={ACCENT.basic} />} title="Basic info">
            {photoField}
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
            {areasField}
            {priceField}
          </Card>

          <Card
            accent={ACCENT.experience}
            icon={<StarIcon color={ACCENT.experience} />}
            title="Experience & availability"
          >
            {experienceField}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Label>Age groups you work with</Label>
              <PillGroup options={AGE_GROUPS} selected={ageGroups} onToggle={toggle(setAgeGroups)} />
            </div>
            {languagesField}
            {availabilityField}
          </Card>

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
            {submitting ? 'Saving…' : '✅ Save changes'}
          </button>
        </form>
      </section>
    )
  }

  // ─── Create mode: 3-part wizard ───
  return (
    <section className="mx-auto px-6 py-12" style={{ maxWidth: 680 }}>
      <ParticleHeader>
        <h1 className="pl-title">Post a listing</h1>
      </ParticleHeader>

      {isWelcome && step < 3 && (
        <div
          className="listing-cta-pulse"
          style={{
            marginTop: 20,
            background: 'rgba(52,211,153,0.14)',
            border: '2px solid rgba(52,211,153,0.55)',
            borderRadius: 14,
            padding: '16px 20px',
          }}
        >
          <p className="text-white font-bold" style={{ fontSize: 16 }}>
            ✍️ Step 2 of 2: publish your listing
          </p>
          <p className="text-white/75 text-sm mt-1">
            Just a few questions — takes 2 minutes.{' '}
            <strong className="text-white">
              Without a listing, your profile stays invisible.
            </strong>
          </p>
        </div>
      )}

      {draftRestored && !published && (
        <p
          className="text-white/70 text-sm"
          style={{
            marginTop: 14,
            background: 'rgba(96,208,255,0.1)',
            border: '1px solid rgba(96,208,255,0.35)',
            borderRadius: 10,
            padding: '10px 14px',
          }}
        >
          ✍️ Picked up where you left off — your answers were saved.
        </p>
      )}

      <WizardProgress step={step} />

      {step === 1 && (
        <form onSubmit={handleNext} style={{ marginTop: 20 }}>
          <Card
            accent={ACCENT.basic}
            icon={<PencilIcon color={ACCENT.basic} />}
            title="What do you offer?"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Label>I offer…</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Pill
                    key={c.value}
                    selected={category === c.value}
                    onClick={() => setCategory(c.value)}
                  >
                    {c.label}
                  </Pill>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label>Title</Label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Experienced babysitter in De Pijp"
                className={inputClass('title')}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label>What you offer — tell the families about yourself</Label>
              <textarea
                ref={descriptionRef}
                value={description}
                maxLength={DESC_MAX}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="I'm a warm, reliable sitter with 5 years of experience…"
                className={inputClass('description')}
                style={{ resize: 'vertical' }}
              />
              <span style={{ color: '#9ca3af', fontSize: 12, textAlign: 'right' }}>
                {description.length}/{DESC_MAX}
              </span>
            </label>

            {category === 'babysitter' && (
              <div
                ref={ageGroupsRef}
                tabIndex={-1}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, outline: 'none' }}
              >
                <Label>Age groups you work with</Label>
                <PillGroup
                  options={AGE_GROUPS}
                  selected={ageGroups}
                  onToggle={toggle(setAgeGroups)}
                />
              </div>
            )}

            {priceField}
          </Card>

          {error && <p style={{ color: '#f87171', marginTop: 16, fontSize: 14 }}>{error}</p>}

          <button type="submit" className={`pl-submit${isWelcome ? ' listing-cta-pulse' : ''}`}>
            Next → contact details
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handlePublish} style={{ marginTop: 20 }}>
          <Card
            accent={ACCENT.contact}
            icon={<ChatIcon color={ACCENT.contact} />}
            title="How can parents reach you?"
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label>WhatsApp number</Label>
              <input
                ref={phoneRef}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+31612345678 or 0612345678"
                className={inputClass('phone')}
                style={{ fontSize: 17, padding: '14px 16px' }}
              />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                Parents will contact you via WhatsApp — this is how you get jobs.
              </span>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label>Postcode</Label>
              <input
                ref={postcodeRef}
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="1234 AB"
                className={inputClass('postcode')}
              />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                Not from Amsterdam or not sure? Just type <strong>0000</strong>.
              </span>
            </label>
          </Card>

          {error && <p style={{ color: '#f87171', marginTop: 16, fontSize: 14 }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting || celebrating}
            className={`pl-submit${isWelcome && !celebrating ? ' listing-cta-pulse' : ''}`}
          >
            {submitting ? 'Publishing…' : '🎉 Publish my listing'}
          </button>

          <button
            type="button"
            onClick={() => {
              clearFail()
              setStep(1)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            style={{
              display: 'block',
              margin: '14px auto 0',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSaveExtras} style={{ marginTop: 20 }}>
          <div
            style={{
              background: 'rgba(52,211,153,0.14)',
              border: '2px solid rgba(52,211,153,0.55)',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 20,
            }}
          >
            <p className="text-white font-bold" style={{ fontSize: 16 }}>
              🎉 Your listing is live!
            </p>
            <p className="text-white/75 text-sm mt-1">
              A photo and a few details get you far more replies — add them now while
              you're here, or skip and do it later.
            </p>
          </div>

          <Card
            accent={ACCENT.experience}
            icon={<StarIcon color={ACCENT.experience} />}
            title="Stand out (optional)"
          >
            {photoField}
            {areasField}
            {experienceField}
            {languagesField}
            {availabilityField}
          </Card>

          {error && <p style={{ color: '#f87171', marginTop: 16, fontSize: 14 }}>{error}</p>}

          <button type="submit" disabled={submitting} className="pl-submit">
            {submitting ? 'Saving…' : '💾 Save details'}
          </button>
          <button
            type="button"
            onClick={() =>
              navigate('/listings', { state: { toast: 'Your listing is live! 🎉' } })
            }
            style={{
              display: 'block',
              margin: '14px auto 0',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Skip — I'm done
          </button>
        </form>
      )}

      {celebrating && (
        <>
          <ConfettiBurst
            onDone={() => {
              setCelebrating(false)
              setStep(3)
              window.scrollTo({ top: 0 })
            }}
          />
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 79,
              background: 'rgba(4, 20, 40, 0.72)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 24,
            }}
          >
            <div>
              <div style={{ fontSize: 64, lineHeight: 1 }}>🎉</div>
              <h2 className="text-white font-bold" style={{ fontSize: 30, marginTop: 16 }}>
                Your listing is LIVE!
              </h2>
              <p className="text-white/75 mt-2" style={{ fontSize: 16 }}>
                Families in Amsterdam can now find you.
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
