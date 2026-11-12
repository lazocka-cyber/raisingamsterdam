import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo3D from '../components/Logo3D'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../lib/listingUtils'

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
    to: '/listings?cat=babysitter',
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
    to: '/listings?cat=community',
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
    to: '/listings?cat=services',
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

const BLUE = '#00b8ff'

// Two front doors: parents go straight to the babysitters (no account needed),
// babysitters go to a sign-up page written only for them.
function Door({ to, title, sub, bg, color }) {
  return (
    <Link
      to={to}
      className="home-door"
      style={{ background: bg, color }}
    >
      <span>
        <span className="home-door__title">{title}</span>
        <span className="home-door__sub">{sub}</span>
      </span>
      <span className="home-door__arrow" aria-hidden="true">→</span>
    </Link>
  )
}

function SitterCard({ listing }) {
  const meta = [listing.location, formatPrice(listing.price)].filter(Boolean).join(' · ')
  return (
    <Link to={`/listings/${listing.id}`} className="home-sitter">
      <span className="home-sitter__photo">
        {listing.photo_url ? (
          <img src={listing.photo_url} alt="" />
        ) : (
          <span aria-hidden="true">{(listing.title || 'B').trim().charAt(0).toUpperCase()}</span>
        )}
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="home-sitter__name">{listing.title}</span>
        {meta && <span className="home-sitter__meta">{meta}</span>}
      </span>
    </Link>
  )
}

export default function Home() {
  const [sitters, setSitters] = useState([])
  const [count, setCount] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, location, photo_url, created_at')
        .eq('category', 'babysitter')
        .order('created_at', { ascending: false })
      if (cancelled || error || !data) return
      setCount(data.length)
      // Faces first: babysitters with a photo, newest on top.
      const withPhoto = data.filter((l) => l.photo_url)
      const rest = data.filter((l) => !l.photo_url)
      setSitters([...withPhoto, ...rest].slice(0, 3))
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="w-full">
      <section className="w-full px-6 pt-6 pb-12 sm:pt-14">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-center gap-4">
            <div className="home-logo">
              <Logo3D size={84} />
            </div>
            <h1 className="text-[31px] leading-[1.12] sm:text-5xl font-extrabold text-white tracking-tight">
              Babysitters in <span style={{ color: '#60d0ff' }}>Amsterdam</span>
            </h1>
          </div>
          <p className="mt-3 text-[17px] sm:text-xl text-white/75 leading-snug">
            English-speaking babysitters for international families. You message them on WhatsApp.
          </p>

          <Door
            to="/listings?cat=babysitter"
            title="I need a babysitter"
            sub={count ? `See ${count} babysitters · free to look` : 'See babysitters · free to look'}
            bg={BLUE}
            color="#06243f"
          />
          <Door
            to="/register?for=sitter"
            title="I am a babysitter"
            sub="Get found by families · always free"
            bg={ACCENT}
            color="#06301f"
          />

          {/* SOS — on the first screen, calm: same background as the page, only the button is orange */}
          <div className="home-sos">
            <span>
              <span className="home-sos__title">Need a babysitter today?</span>
              <span className="home-sos__sub">Babysitters get a ping on their phone</span>
            </span>
            <Link to="/sos/new" className="home-sos__btn">
              Send SOS
            </Link>
          </div>

          {sitters.length > 0 && (
            <>
              <h2 className="home-label">Babysitters on RaisingAmsterdam</h2>
              {sitters.map((l) => (
                <SitterCard key={l.id} listing={l} />
              ))}
              <Link to="/listings?cat=babysitter" className="home-all">
                See all babysitters →
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Tagline section — 3 animated SVG icons */}
      <section className="w-full px-6 pb-24">
        <div className="mx-auto max-w-5xl grid gap-8 sm:grid-cols-3">
          {features.map(({ icon, text, delay, to }) => (
            <Link
              key={text}
              to={to}
              className="flex flex-col items-center text-center gap-3 rounded-xl border border-violet-400/55 px-6 py-8 transition-colors transition-transform hover:border-violet-300 hover:-translate-y-1"
              style={{ background: 'transparent' }}
            >
              <span
                className="feature-icon"
                style={{ animationDelay: delay }}
                aria-hidden="true"
              >
                {icon}
              </span>
              <p className="text-white/80 font-medium">{text}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
