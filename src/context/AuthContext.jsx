import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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

    async function loadProfile(currentUser) {
      if (!currentUser) {
        if (active) setProfile(null)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      if (!active) return
      if (error) {
        console.warn('Could not load profile:', error.message)
        setProfile(null)
      } else {
        setProfile(data ?? null)
      }
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
