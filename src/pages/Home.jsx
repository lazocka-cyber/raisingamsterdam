import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="text-center py-16">
      <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
        Vítej v <span className="text-sky-300">RaisingAmsterdam</span>
      </h1>
      <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
        Komunita pro rodiče v Amsterdamu — sdílej, objevuj a propojuj se.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          to="/register"
          className="px-6 py-3 rounded-lg bg-sky-400 text-[#042C53] font-semibold hover:bg-sky-300 transition-colors"
        >
          Začít
        </Link>
        <Link
          to="/listings"
          className="px-6 py-3 rounded-lg border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
        >
          Prohlédnout nabídky
        </Link>
      </div>
    </section>
  )
}
