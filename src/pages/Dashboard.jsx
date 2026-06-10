import { useAuth } from '../context/AuthContext'

const messages = {
  sitter: 'Welcome! You can now post a babysitting listing.',
  parent: 'Welcome! You have full access to all listings.',
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const role = profile?.role
  const message = messages[role] ?? 'Welcome!'

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <div
        style={{ background: '#1a1a2e', borderRadius: 16 }}
        className="p-10 text-center"
      >
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>

        {user?.email && (
          <p className="mt-1 text-white/40 text-sm">{user.email}</p>
        )}

        <p className="mt-6 text-lg text-white/80">{message}</p>

        {role && (
          <span
            className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: 'rgba(167,139,250,0.18)', color: '#a78bfa' }}
          >
            Role: {role}
          </span>
        )}

        <div className="mt-8">
          <button
            type="button"
            onClick={signOut}
            style={{
              background: '#a78bfa',
              color: 'white',
              borderRadius: 10,
              padding: '12px 24px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </section>
  )
}
