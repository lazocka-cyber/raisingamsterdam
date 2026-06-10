import { Link } from 'react-router-dom'
import { Baby, Users, Sparkles } from 'lucide-react'

const features = [
  { Icon: Baby, text: 'Find trusted babysitters' },
  { Icon: Users, text: 'Meet expat parents nearby' },
  { Icon: Sparkles, text: 'Discover local services' },
]

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero — full width */}
      <section className="w-full px-6 py-20 sm:py-28 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
            Welcome to <span className="text-sky-300">RaisingAmsterdam</span>
          </h1>
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

      {/* Tagline section — 3 icons */}
      <section className="w-full px-6 pb-24">
        <div className="mx-auto max-w-5xl grid gap-8 sm:grid-cols-3">
          {features.map(({ Icon, text }) => (
            <div
              key={text}
              className="flex flex-col items-center text-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-8"
            >
              <Icon size={48} stroke="white" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-white/80 font-medium">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
