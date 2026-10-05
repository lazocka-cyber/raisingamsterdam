// A parent's request filled in BEFORE they have an account (5. 10. 2026).
// Parents from the ad left before signing up, so the form now comes first:
// the request is kept here, the parent creates an account, and
// PendingRequestPublisher (App.jsx) posts it right after sign-in.
//
// localStorage survives the Google redirect. A magic link opened in another
// browser loses it — that case is covered by the signup metadata
// (request_draft, see Register.jsx), which new accounts get from Supabase.

const KEY = 'ra_request_draft'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function isFresh(draft) {
  return (
    draft &&
    typeof draft.area === 'string' &&
    Array.isArray(draft.days) &&
    draft.days.length > 0 &&
    Date.now() - (draft.t || 0) < MAX_AGE_MS
  )
}

export function saveRequestDraft({ area, days, age_groups, note }) {
  const draft = { area, days, age_groups, note, t: Date.now() }
  try {
    localStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // storage blocked (in-app browser) — the signup metadata still carries it
  }
  return draft
}

export function loadRequestDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(KEY) || 'null')
    return isFresh(draft) ? draft : null
  } catch {
    return null
  }
}

// Draft carried in the account itself (magic link opened in another browser).
export function draftFromUser(user) {
  const draft = user?.user_metadata?.request_draft
  return isFresh(draft) ? draft : null
}

export function clearRequestDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}
