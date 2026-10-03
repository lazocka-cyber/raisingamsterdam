// Remembers that a visitor came in as a PARENT (via /for-parents or
// /register?for=parent), so that after signing in they skip the
// "which one are you?" screen and land straight on the request form.
//
// localStorage survives the Google sign-in redirect. A magic link opened in a
// different browser loses it — that case is covered by the signup metadata
// (role: 'parent', see Register.jsx) and the parent dashboard.

const KEY = 'ra_intent'
// Valid for a day — so a babysitter who once tapped a parent button and signs
// in weeks later isn't switched to "parent" by surprise.
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export function setParentIntent() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 'parent', t: Date.now() }))
  } catch {
    // storage blocked (private mode, in-app browser) — the metadata still helps
  }
}

export function hasParentIntent() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    return raw?.v === 'parent' && Date.now() - raw.t < MAX_AGE_MS
  } catch {
    return false
  }
}

export function clearParentIntent() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}
