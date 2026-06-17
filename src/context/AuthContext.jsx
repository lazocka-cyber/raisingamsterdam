import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Set by the parent "Continue with Google" flow in Register.jsx. A new Google
// account is created with the default 'sitter' role, so after the redirect we
// re-verify the stored license and upgrade the profile to 'parent'.
const PENDING_PARENT_KEY = 'ra_pending_parent_license'
const GUMROAD_PERMALINK = 'raisingamsterdam'

async function verifyGumroadLicense(licenseKey) {
  try {
    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink: GUMROAD_PERMALINK,
        license_key: licenseKey,
        // Don't burn a use on every login — the use was already counted at signup.
        increment_uses_count: 'false',
      }),
    })
    const data = await res.json().catch(() => ({ success: false }))
    return Boolean(data.success)
  } catch {
    // Network hiccup — leave the flag in place so we can retry on next load.
    return null
  }
}

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // If the parent signed in with Google, their profile was created as
    // 'sitter'. Re-verify the stored license and flip it to 'parent'.
    // Returns the (possibly upgraded) profile.
    async function maybeUpgradeToParent(currentUser, currentProfile) {
      let pending = null
      try {
        pending = localStorage.getItem(PENDING_PARENT_KEY)
      } catch {
        pending = null
      }
      if (!pending) return currentProfile

      // Already a parent → nothing to do, clear the flag.
      if (currentProfile?.role === 'parent') {
        try { localStorage.removeItem(PENDING_PARENT_KEY) } catch {}
        return currentProfile
      }

      // On the local dev server, skip re-verification (matches Register.jsx
      // test mode). Always re-verifies in the production build on Vercel.
      const valid = import.meta.env.DEV ? true : await verifyGumroadLicense(pending)
      if (valid === null) return currentProfile // network issue — retry next load
      if (!valid) {
        // Bogus/tampered key — drop it, leave the role as 'sitter'.
        try { localStorage.removeItem(PENDING_PARENT_KEY) } catch {}
        return currentProfile
      }

      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'parent' })
        .eq('id', currentUser.id)
        .select()
        .maybeSingle()
      try { localStorage.removeItem(PENDING_PARENT_KEY) } catch {}
      if (updateError) {
        console.warn('Could not upgrade profile to parent:', updateError.message)
        return currentProfile
      }
      return updated ?? { ...currentProfile, role: 'parent' }
    }

    async function loadProfile(currentUser) {
      if (!currentUser) {
        if (active) setProfile(null)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()
      if (!active) return
      if (error) {
        console.warn('Could not load profile:', error.message)
        setProfile(null)
        return
      }
      // New users may briefly have no profile row yet (trigger runs server
      // side). Treat a missing role as 'sitter' so the UI behaves sensibly.
      const baseProfile = data ?? { id: currentUser.id, role: 'sitter' }
      const finalProfile = await maybeUpgradeToParent(currentUser, baseProfile)
      if (!active) return
      setProfile(finalProfile)
    }

    // 1) Register the listener FIRST so we never miss the SIGNED_IN event
    //    fired when Supabase processes a magic-link redirect on load.
    //    Profile fetch is deferred with setTimeout to avoid the known
    //    Supabase deadlock when awaiting supabase calls inside this callback.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      const nextUser = session?.user ?? null
      setUser(nextUser)
      setTimeout(() => {
        if (active) loadProfile(nextUser)
      }, 0)
    })

    // 2) Then load any existing session on mount.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return
      setUser(session?.user ?? null)
      await loadProfile(session?.user ?? null)
      if (active) setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
