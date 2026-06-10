export default function Listings() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-white">Nabídky</h1>
      <p className="mt-2 text-white/60">
        Tady se budou zobrazovat nabídky ze Supabase (placeholder).
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/40"
          >
            Nabídka #{i}
          </div>
        ))}
      </div>
    </section>
  )
}
