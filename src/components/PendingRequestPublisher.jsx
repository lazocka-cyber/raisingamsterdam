import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { clearRequestDraft, draftFromUser, loadRequestDraft } from '../lib/requestDraft'

// Posts the request a parent filled in before they had an account
// (see lib/requestDraft.js), right after they sign in, and opens My requests.
export default function PendingRequestPublisher() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const started = useRef(false)

  useEffect(() => {
    if (!user || started.current) return
    const local = loadRequestDraft()
    const fromAccount = draftFromUser(user)
    const draft = local || fromAccount
    if (!draft) return
    started.current = true
    // Clear first, so a reload or a second tab never posts it twice.
    clearRequestDraft()
    if (fromAccount) supabase.auth.updateUser({ data: { request_draft: null } })

    supabase
      .from('family_requests')
      .insert({
        user_id: user.id,
        area: draft.area,
        days: draft.days,
        age_groups: draft.age_groups || [],
        note: draft.note || null,
      })
      .then(({ error }) => {
        navigate('/my-requests', {
          replace: true,
          state: {
            toast: error
              ? error.code === '42501'
                ? 'You already have 3 open requests. Close one under My requests first.'
                : "Couldn't post your request — please post it again."
              : 'Your request is live! Babysitters can see it now.',
          },
        })
      })
  }, [user, navigate])

  return null
}
