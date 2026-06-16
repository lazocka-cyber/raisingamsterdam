import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo3D from '../components/Logo3D'

const STROKE = '#a78bfa'
const ACCENT = '#34d399'

const svgProps = {
  width: 56,
  height: 56,
  viewBox: '0 0 56 56',
  fill: 'none',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const features = [
  {
    text: 'Find trusted babysitters',
    delay: '0s',
    icon: (
      <svg {...svgProps}>
        <circle className="draw-path" pathLength="1" cx="28" cy="20" r="9" stroke={STROKE} />
        <path className="draw-path" pathLength="1" d="M12 48c0-8.8 7.2-16 16-16s16 7.2 16 16" stroke={STROKE} />
        <circle className="draw-path" pathLength="1" cx="42" cy="16" r="6" stroke={ACCENT} />
        <path className="draw-path" pathLength="1" d="M47 30c4 1.8 7 5.8 7 10.5" stroke={ACCENT} />
      </svg>
    ),
  },
  {
    text: 'Meet expat parents nearby',
    delay: '0.5s',
    icon: (
      <svg {...svgProps}>
        <circle className="draw-path" pathLength="1" cx="22" cy="20" r="8" stroke={STROKE} />
        <circle className="draw-path" pathLength="1" cx="36" cy="20" r="8" stroke={STROKE} />
        <path className="draw-path" pathLength="1" d="M6 48c0-8.8 7.2-16 16-16" stroke={STROKE} />
        <path className="draw-path" pathLength="1" d="M50 48c0-8.8-7.2-16-16-16" stroke={STROKE} />
        <path className="draw-path" pathLength="1" d="M22 32c2-0.7 4-1 6-1s4 0.3 6 1" stroke={ACCENT} />
      </svg>
    ),
  },
  {
    text: 'Discover local services',
    delay: '1s',
    icon: (
      <svg {...svgProps}>
        <rect className="draw-path" pathLength="1" x="10" y="12" width="36" height="26" rx="4" stroke={STROKE} />
        <path className="draw-path" pathLength="1" d="M20 44h16" stroke={STROKE} />
        <path className="draw-path" pathLength="1" d="M28 38v6" stroke={STROKE} />
        <path className="draw-path" pathLength="1" d="M20 26l5 5 11-11" stroke={ACCENT} />
      </svg>
    ),
  },
]

const TW_FULL = 'RaisingAmsterdam'
const TW_SPLIT = 7 // „Raising" bíle | „Amsterdam" fialově

// Typewriter nadpis hero sekce — vypíše „RaisingAmsterdam" znak po znaku,
// po dopsání zůstane stát s blikajícím kurzorem.
function Typewriter() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(TW_FULL.length)
      return
    }
    let i = 0
    let timer
    const tick = () => {
      i += 1
      setCount(i)
      if (i < TW_FULL.length) timer = setTimeout(tick, 80)
    }
    timer = setTimeout(tick, 400) // krátká prodleva po načtení
    return () => clearTimeout(timer)
  }, [])

  const head = TW_FULL.slice(0, Math.min(count, TW_SPLIT))
  const tail = TW_FULL.slice(TW_SPLIT, count)
  return (
    <h1
      aria-label={TW_FULL}
      className="mt-6 text-4xl sm:text-6xl font-bold text-white tracking-tight min-h-[1.3em]"
    >
      {head}
      {tail && <span className="text-[#a78bfa]">{tail}</span>}
      <span className="tw-cursor" aria-hidden="true" />
    </h1>
  )
}

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero — full width */}
      <section className="w-full px-6 py-20 sm:py-28 text-center">
        <div className="mx-auto max-w-4xl flex flex-col items-center">
          <Logo3D size={300} />
          <Typewriter />
          <p className="mt-5 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
            The expat parent community in Amsterdam — connect, share and belong.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-7 py-3 rounded-lg bg-sky-400 text-[#042C53] font-semibold hover:bg-sky-300 transition-colors"
            >
              Get started
            </Link>
            <Link
              to="/listings"
              className="px-7 py-3 rounded-lg border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Browse listings
            </Link>
          </div>
        </div>
      </section>

      {/* Tagline section — 3 animated SVG icons */}
      <section className="w-full px-6 pb-24">
        <div className="mx-auto max-w-5xl grid gap-8 sm:grid-cols-3">
          {features.map(({ icon, text, delay }) => (
            <div
              key={text}
              className="flex flex-col items-center text-center gap-3 rounded-xl border border-white/10 px-6 py-8"
              style={{ background: '#1a1a2e' }}
            >
              <span
                className="feature-icon"
                style={{ animationDelay: delay }}
                aria-hidden="true"
              >
                {icon}
              </span>
              <p className="text-white/80 font-medium">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
