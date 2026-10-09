import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { setParentIntent } from '../lib/intent'
import { MEMBERSHIP_PRICE } from '../lib/listingUtils'
import SosSpotlight from '../components/SosSpotlight'
import SeeBabysittersLink from '../components/SeeBabysittersLink'

// Landing page for PARENTS (ads, group posts, flyers): /for-parents.
// One job: get a parent to post a free request. Everything here is true today —
// the counts are live from the database, the phone screen is labelled "Example".

const NAVY = '#042C53'
const GREEN = '#34d399'
const CYAN = '#60d0ff'
const PURPLE = '#a78bfa'
const CARD = '#1a1a2e'
const CTA_GRADIENT = 'linear-gradient(90deg, #34d399, #60d0ff)'

const SERVICES = ['Tutors & homework help', 'Dutch lessons for parents', 'Kids yoga', 'Birthday parties', 'Private chef & family meals', 'Cleaning & home help']

const STEPS = [
  { n: 1, title: 'Post what you need', text: 'Your neighbourhood, the days you need help and your kids’ ages. Free.' },
  { n: 2, title: 'Babysitters reply', text: 'Babysitters who can help tap “I can help”. You see their profile and references.' },
  { n: 3, title: 'Message them on WhatsApp', text: `Pick who you like. One payment of ${MEMBERSHIP_PRICE} unlocks WhatsApp for every babysitter and service.` },
]

function CtaButton({ onClick, children, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: CTA_GRADIENT,
        color: NAVY,
        border: 'none',
        borderRadius: 14,
        padding: small ? '13px 22px' : '17px 30px',
        fontWeight: 800,
        fontSize: small ? 16 : 18,
        cursor: 'pointer',
        boxShadow: '0 14px 34px rgba(52,211,153,0.25)',
      }}
    >
      {children}
    </button>
  )
}

export default function ForParents() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [counts, setCounts] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('listings')
      .select('category')
      .then(({ data }) => {
        if (cancelled || !data) return
        setCounts({
          sitters: data.filter((l) => l.category === 'babysitter').length,
          services: data.filter((l) => l.category === 'services').length,
        })
      })
    return () => {
      cancelled = true
    }
  }, [])

  // The request form first, the account last (5. 10. 2026).
  function start() {
    if (!user) setParentIntent()
    navigate('/families/new')
  }

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="mx-auto px-6 pt-12 pb-10" style={{ maxWidth: 1000 }}>
        <div className="grid gap-10 items-center md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p style={{ color: GREEN, fontWeight: 700, letterSpacing: 1.2, fontSize: 13, textTransform: 'uppercase' }}>
              For parents in Amsterdam
            </p>
            <h1 className="text-white font-bold" style={{ fontSize: 'clamp(38px, 6vw, 60px)', lineHeight: 1.04, letterSpacing: -1.2, marginTop: 10 }}>
              Post once.
              <br />
              <span style={{ background: CTA_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                Babysitters come to you.
              </span>
            </h1>
            <p className="text-white/70" style={{ fontSize: 19, lineHeight: 1.55, marginTop: 18, maxWidth: 520 }}>
              Tell us your neighbourhood, days and your kids’ ages. Babysitters who can help reply, and you choose who to message.
            </p>
            <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
              <CtaButton onClick={start}>Post your free request →</CtaButton>
              <SeeBabysittersLink />
              <p className="text-white/55" style={{ fontSize: 14 }}>
                Free to post · {MEMBERSHIP_PRICE} once to message · No subscription
              </p>
            </div>
            {counts && (
              <div className="flex flex-wrap gap-3" style={{ marginTop: 22 }}>
                <span style={{ background: 'rgba(167,139,250,0.16)', border: `1px solid ${PURPLE}66`, color: '#ddd6fe', borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: 14 }}>
                  {counts.sitters} babysitters
                </span>
                <span style={{ background: 'rgba(96,208,255,0.14)', border: `1px solid ${CYAN}66`, color: '#bae6fd', borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: 14 }}>
                  {counts.services} family services
                </span>
                <span style={{ background: 'rgba(52,211,153,0.14)', border: `1px solid ${GREEN}66`, color: '#a7f3d0', borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: 14 }}>
                  References from families
                </span>
              </div>
            )}
            {counts && (
              <p className="text-white/60" style={{ fontSize: 14, marginTop: 14 }}>
                We’re new in Amsterdam. The more families post, the more babysitters join. Posting costs nothing.
              </p>
            )}
          </div>

          {/* Example screen in a phone frame */}
          <figure style={{ margin: 0, justifySelf: 'center' }}>
            <div
              style={{
                width: 270,
                padding: 10,
                borderRadius: 44,
                background: 'linear-gradient(150deg, #3a4357 0%, #121725 25%, #0b0f1a 60%, #262d3d 100%)',
                boxShadow: '8px 10px 0 #060911, 0 40px 80px rgba(0,0,0,0.45)',
                transform: 'rotate(2.5deg)',
              }}
            >
              <img
                src="/img/for-parents-example.jpg"
                alt="Example: a parent's request with three babysitters who want to help"
                width={250}
                height={466}
                style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 34 }}
              />
            </div>
            <figcaption className="text-white/40 text-xs text-center" style={{ marginTop: 14 }}>
              Example
            </figcaption>
          </figure>
        </div>
      </section>

      {/* SOS — need someone today */}
      <section className="mx-auto px-6 pb-12" style={{ maxWidth: 1000 }}>
        <SosSpotlight forSitters={false} />
      </section>

      {/* How it works */}
      <section className="mx-auto px-6 pb-12" style={{ maxWidth: 1000 }}>
        <h2 className="text-white font-bold text-2xl">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3" style={{ marginTop: 18 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ background: CARD, borderRadius: 18, padding: '22px 22px 24px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  background: `linear-gradient(${CARD}, ${CARD}) padding-box, ${CTA_GRADIENT} border-box`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: 20,
                }}
              >
                {s.n}
              </div>
              <p className="text-white font-bold" style={{ fontSize: 19, marginTop: 14 }}>{s.title}</p>
              <p className="text-white/65" style={{ fontSize: 15, lineHeight: 1.55, marginTop: 6 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Not only babysitters */}
      <section className="mx-auto px-6 pb-12" style={{ maxWidth: 1000 }}>
        <h2 className="text-white font-bold text-2xl">Not only babysitters</h2>
        <p className="text-white/65" style={{ marginTop: 8 }}>Local family services in Amsterdam are on RaisingAmsterdam too.</p>
        <div className="flex flex-wrap gap-2" style={{ marginTop: 16 }}>
          {SERVICES.map((c, i) => (
            <span
              key={c}
              style={{
                borderRadius: 999,
                padding: '9px 16px',
                fontWeight: 600,
                fontSize: 15,
                color: 'white',
                background: [`${GREEN}22`, `${CYAN}22`, `${PURPLE}26`][i % 3],
                border: `1px solid ${[GREEN, CYAN, PURPLE][i % 3]}77`,
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <p style={{ marginTop: 14 }}>
          <Link to="/listings" style={{ color: CYAN, fontWeight: 600 }}>Browse all listings →</Link>
        </p>
      </section>

      {/* Price */}
      <section className="mx-auto px-6 pb-16" style={{ maxWidth: 1000 }}>
        <div style={{ background: CARD, borderRadius: 22, padding: '26px 24px', border: `1px solid ${GREEN}55` }}>
          <h2 className="text-white font-bold text-2xl">One payment. No subscription.</h2>
          <div style={{ marginTop: 14, display: 'grid', gap: 8, maxWidth: 520 }}>
            {[
              ['Post your requests', 'Free', GREEN],
              ['See who wants to help', 'Free', GREEN],
              ['WhatsApp every babysitter & service', `${MEMBERSHIP_PRICE} once`, CYAN],
              ['Send an SOS when you need someone fast', 'Included', CYAN],
              ['Access', 'Lifetime', CYAN],
            ].map(([a, b, col]) => (
              <div key={a} className="flex items-center justify-between gap-4" style={{ fontSize: 16 }}>
                <span className="text-white/80">{a}</span>
                <b style={{ color: col, whiteSpace: 'nowrap' }}>{b}</b>
              </div>
            ))}
          </div>
          <p className="text-white/45" style={{ fontSize: 13, marginTop: 12 }}>Incl. VAT. You only pay when you want to message someone.</p>
          <div style={{ marginTop: 20 }}>
            <CtaButton onClick={start} small>Post your free request →</CtaButton>
          </div>
        </div>
      </section>
    </div>
  )
}
