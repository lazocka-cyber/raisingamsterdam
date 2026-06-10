export default function Listings() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold text-white">Listings</h1>
      <p className="mt-2 text-white/60">
        Listings from Supabase will appear here (placeholder).
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/40"
          >
            Listing #{i}
          </div>
        ))}
      </div>
    </section>
  )
}
