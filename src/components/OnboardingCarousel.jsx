import { useCallback, useEffect, useRef, useState } from 'react'

// First-launch welcome carousel. Shows once, then remembers via localStorage.
// Self-contained (emoji + text), English — matches the RaisingAmsterdam look.
const SEEN_KEY = 'ra_onboarding_seen_v1'

const PURPLE = '#a78bfa'
const GREEN = '#34d399'
const CYAN = '#5ab0f0'

const SLIDES = [
  {
    emoji: '🌍',
    accent: CYAN,
    title: 'Welcome to RaisingAmsterdam',
    body: 'The expat parent community in Amsterdam — find help, meet people, and figure out the Dutch way of doing things.',
  },
  {
    emoji: '🍼',
    accent: GREEN,
    title: 'Find a sitter you trust',
    body: 'Browse babysitters and local family services, read real reviews, and message them straight on WhatsApp.',
  },
  {
    emoji: '👋',
    accent: PURPLE,
    title: 'Meet other parents',
    body: 'Plan a coffee or a playdate — or just say hi to families nearby. Your people are closer than you think.',
  },
  {
    emoji: '🚨',
    accent: '#ff8359',
    title: 'Stuck? Post an SOS',
    body: 'Need someone last-minute? Post an urgent request and nearby babysitters get pinged right away.',
  },
  {
    emoji: '📖',
    accent: CYAN,
    title: 'The Dutch system, explained',
    body: 'Health, childcare, school, kraamzorg, the swim diploma and the paperwork — all in plain English.',
  },
]

export default function OnboardingCarousel() {
  const [show, setShow] = useState(false)
  const [i, setI] = useState(0)
  const touchX = useRef(null)

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setShow(true)
    } catch {
      // localStorage blocked — just don't show it.
    }
  }, [])

  const close = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    setShow(false)
  }, [])

  const next = useCallback(() => {
    setI((c) => (c < SLIDES.length - 1 ? c + 1 : c))
  }, [])
  const prev = useCallback(() => setI((c) => Math.max(0, c - 1)), [])

  if (!show) return null

  const slide = SLIDES[i]
  const last = i === SLIDES.length - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'linear-gradient(180deg, #0e2a4e 0%, #081a33 100%)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx < -40) next()
        else if (dx > 40) prev()
        touchX.current = null
      }}
    >
      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 20 }}>
        <button
          type="button"
          onClick={close}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
        >
          Skip
        </button>
      </div>

      {/* Slide */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 32px',
          maxWidth: 520,
          margin: '0 auto',
        }}
      >
        <div
          key={i}
          style={{
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: `${slide.accent}22`,
            border: `1px solid ${slide.accent}66`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 72,
            marginBottom: 36,
            animation: 'raPop 0.4s ease',
          }}
        >
          {slide.emoji}
        </div>
        <h2 style={{ color: 'white', fontSize: 28, fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
          {slide.title}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, lineHeight: 1.55, marginTop: 16 }}>
          {slide.body}
        </p>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px 0 20px' }}>
        {SLIDES.map((_, n) => (
          <button
            key={n}
            type="button"
            aria-label={`Go to slide ${n + 1}`}
            onClick={() => setI(n)}
            style={{
              width: n === i ? 26 : 9,
              height: 9,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: n === i ? 'white' : 'rgba(255,255,255,0.3)',
              transition: 'width 0.25s ease',
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, padding: '0 24px 28px', maxWidth: 520, margin: '0 auto', width: '100%' }}>
        {i > 0 && (
          <button
            type="button"
            onClick={prev}
            style={{ flex: '0 0 auto', padding: '16px 22px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)', background: 'none', color: 'white', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={last ? close : next}
          style={{ flex: 1, padding: '16px', borderRadius: 14, border: 'none', background: GREEN, color: '#042C53', fontSize: 17, fontWeight: 700, cursor: 'pointer' }}
        >
          {last ? 'Get started' : 'Next'}
        </button>
      </div>

      <style>{`@keyframes raPop { 0% { transform: scale(0.7); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }`}</style>
    </div>
  )
}
