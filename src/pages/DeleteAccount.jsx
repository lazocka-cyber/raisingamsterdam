import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Permanent account + data deletion.
// This page doubles as the publicly reachable deletion URL required by
// Google Play (/delete-account) and the in-app "Delete account" path.
export default function DeleteAccount() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleDelete() {
    setError('')
    setBusy(true)
    try {
      const { error } = await supabase.functions.invoke('delete-account')
      if (error) throw error
      await signOut()
      setDone(true)
    } catch (e) {
      setError(e?.message || 'Something went wrong — please try again.')
    } finally {
      setBusy(false)
    }
  }

  const card = {
    background: '#1a1a2e',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.1)',
  }

  return (
    <section className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-3xl font-bold text-white">Delete your account</h1>

      {/* Success state */}
      {done ? (
        <div style={card} className="mt-6 p-6 text-center">
          <div style={{ fontSize: 40 }}>👋</div>
          <p className="text-white font-semibold text-lg mt-2">
            Your account and data have been deleted.
          </p>
          <p className="text-white/60 mt-2">
            Thanks for being part of RaisingAmsterdam. You're always welcome back.
          </p>
          <Link
            to="/"
            className="inline-block mt-6 px-6 py-3 rounded-xl font-semibold"
            style={{ background: '#34d399', color: '#042C53' }}
          >
            Back to home
          </Link>
        </div>
      ) : loading ? (
        <p className="mt-6 text-white/60">Loading…</p>
      ) : !user ? (
        // Public / signed-out view — explains the process (Google Play requirement).
        <div style={card} className="mt-6 p-6">
          <p className="text-white/80 leading-relaxed">
            You can permanently delete your RaisingAmsterdam account and all of
            your data — your profile, listings, reviews, meetups and SOS posts.
          </p>
          <p className="text-white/80 leading-relaxed mt-4">
            To do it, please <strong>sign in first</strong> and come back to this
            page. For security, an account can only be deleted by the person
            signed in to it.
          </p>
          <Link
            to="/register"
            className="inline-block mt-6 px-6 py-3 rounded-xl font-semibold"
            style={{ background: '#34d399', color: '#042C53' }}
          >
            Sign in
          </Link>
          <p className="text-white/45 text-sm mt-6">
            Prefer us to do it for you? Email{' '}
            <a className="underline" href="mailto:raisingamsterdam.info@gmail.com">
              raisingamsterdam.info@gmail.com
            </a>{' '}
            from your account address and we'll remove it.
          </p>
        </div>
      ) : (
        // Signed-in view — confirm + delete.
        <div style={card} className="mt-6 p-6">
          <p className="text-white/80 leading-relaxed">
            This permanently deletes your account
            {user.email ? (
              <>
                {' '}(<span className="text-white">{user.email}</span>)
              </>
            ) : null}{' '}
            and <strong>everything tied to it</strong>:
          </p>
          <ul className="mt-4 space-y-2 text-white/75">
            <li>• Your profile and membership</li>
            <li>• Your listings</li>
            <li>• Your reviews</li>
            <li>• Your meetups and intros</li>
            <li>• Your SOS posts and alerts</li>
          </ul>
          <p className="text-white/80 mt-4">
            This <strong>can't be undone</strong>. To confirm, type{' '}
            <span className="font-mono text-white">DELETE</span> below.
          </p>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="mt-4 w-full rounded-xl px-4 py-3 bg-white/5 border border-white/15 text-white outline-none"
          />

          {error && <p className="text-red-300 text-sm mt-3">{error}</p>}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              disabled={confirmText.trim() !== 'DELETE' || busy}
              onClick={handleDelete}
              className="px-6 py-3 rounded-xl font-semibold transition-opacity disabled:opacity-40"
              style={{ background: '#ef4444', color: 'white' }}
            >
              {busy ? 'Deleting…' : 'Delete my account'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl font-semibold text-white/70 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
