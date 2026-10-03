import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  shouldTrackRegistration,
  trackRegistration,
  isFreshAccount,
  getAttribution,
} from '../lib/tracking.js'
import { clearParentIntent, hasParentIntent } from '../lib/intent'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isMember: false,
  // null = not known yet (query in flight), boolean once loaded.
  hasListing: null,
  markListingPosted: () => {},
  // In-memory "leave me alone" flag for the listing gate. Deliberately NOT
  // persisted: it must work in webviews with blocked storage, and resetting
  // on refresh is desired — the gate should catch the user again next visit.
  listingSnoozed: false,
  snoozeListingGate: () => {},
  refreshProfile: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasListing, setHasListing] = useState(null)
  const [listingSnoozed, setListingSnoozed] = useState(false)

  useEffect(() => {
    let active = true
    let sourceSaveStarted = false
    let intentApplied = false

    // Came in as a parent (/for-parents) → make the profile a parent right away,
    // before the profile is shown, so the listing gate never sends them to the
    // babysitter form. Only for accounts without a listing (real sitters stay sitters).
    async function maybeApplyParentIntent(currentUser, currentProfile) {
      if (intentApplied || !hasParentIntent()) return currentProfile
      intentApplied = true
      if (currentProfile?.role === 'parent') {
        clearParentIntent()
        return currentProfile
      }
      const { count } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
      clearParentIntent()
      if ((count ?? 0) > 0) return currentProfile
      const { error: rpcError } = await supabase.rpc('choose_parent')
      if (rpcError) {
        console.warn('Could not switch to parent:', rpcError.message)
        return currentProfile
      }
      return { ...currentProfile, role: 'parent' }
    }

    // Registrace jde přes Google OAuth / magic link (redirect), takže žádný
    // signUp success handler neexistuje — konverzi měříme tady, když se nový
    // uživatel poprvé objeví se session. shouldTrackRegistration hlídá, aby
    // událost nechodila při každém přihlášení.
    function maybeTrackRegistration(currentUser) {
      if (!shouldTrackRegistration(currentUser)) return
      trackRegistration()
    }

    // First-party zdroj (utm/fbclid/referrer z localStorage) → profiles.source.
    // Zapisuje se jen jednou, jen u čerstvých účtů, a jen když řádek profilu
    // už existuje (trigger ho vytváří server-side s malým zpožděním — pokud
    // ještě není, zkusí se to při příštím načtení).
    async function maybeSaveSource(currentUser, profileRow) {
      if (!profileRow || profileRow.source) return
      if (!isFreshAccount(currentUser)) return
      const attribution = getAttribution()
      if (!attribution) return
      // getSession i onAuthStateChange načtou profil zároveň → zapsat jen jednou.
      if (sourceSaveStarted) return
      sourceSaveStarted = true
      // profiles nemá UPDATE pro klienta (paywall zámek) → přes RPC, viz
      // supabase/profiles_write_rpcs.sql.
      const { error: sourceError } = await supabase.rpc('save_signup_source', {
        p_source: attribution,
      })
      if (sourceError) {
        console.warn('Could not save signup source:', sourceError.message)
      }
    }

    // Lightweight "does this user have any listing?" check — drives the
    // listing gate. head:true means no rows travel over the wire.
    async function loadHasListing(currentUser) {
      if (!currentUser) {
        if (active) setHasListing(null)
        return
      }
      const { count, error } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
      if (!active) return
      // On error stay at null — the gate treats "unknown" as "don't redirect".
      setHasListing(error ? null : (count ?? 0) > 0)
    }

    async function loadProfile(currentUser) {
      if (!currentUser) {
        if (active) setProfile(null)
        return
      }
      maybeTrackRegistration(currentUser)
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
      // Fire-and-forget — zápis zdroje nesmí zdržet načtení profilu.
      if (data) maybeSaveSource(currentUser, data)
      const finalProfile = data ? await maybeApplyParentIntent(currentUser, baseProfile) : baseProfile
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
        if (active) {
          loadProfile(nextUser)
          loadHasListing(nextUser)
        }
      }, 0)
    })

    // 2) Then load any existing session on mount.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return
      setUser(session?.user ?? null)
      await Promise.all([
        loadProfile(session?.user ?? null),
        loadHasListing(session?.user ?? null),
      ])
      if (active) setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // Re-read the profile from the database (e.g. after unlocking membership).
  async function refreshProfile() {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    setProfile(data ?? null)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setHasListing(null)
    setListingSnoozed(false)
  }

  // Flip the flag instantly after a successful insert — no refetch needed.
  function markListingPosted() {
    setHasListing(true)
  }

  function snoozeListingGate() {
    setListingSnoozed(true)
  }

  const isMember = Boolean(profile?.is_member)

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isMember,
        hasListing,
        markListingPosted,
        listingSnoozed,
        snoozeListingGate,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
