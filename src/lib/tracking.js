// Měření zdrojů registrací — Meta Pixel + first-party attribution.
//
// Dvě větve:
//  1) Meta Pixel události (PageView / CompleteRegistration / Lead) — aby Meta
//     uměla optimalizovat kampaně. Každá konverze má event_id kvůli pozdější
//     deduplikaci s Conversions API (Fáze 2).
//  2) First-party attribution — utm_* / fbclid / referrer zachycené při
//     příchodu do appky se uloží do localStorage a po registraci se zapíšou
//     do Supabase (profiles.source, listings.source). Díky tomu je u každé
//     registrace přesně vidět, která reklama/video ji přivedla — nezávisle
//     na Metě.

const ATTRIBUTION_KEY = 'ra_attribution'
const REG_TRACKED_KEY = 'ra_reg_tracked'

// ---------------------------------------------------------------------------
// Attribution (first-party)
// ---------------------------------------------------------------------------

function readStoredAttribution() {
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Volat jednou při startu appky (main.jsx). Tagovaný příchod (utm_* nebo
// fbclid v URL) vždy přepíše dřívější záznam — počítá se poslední kliknutá
// reklama. Netagovaný příchod se uloží jen jako první záznam (referrer).
export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search)
    const tagged = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid']) {
      const value = params.get(key)
      if (value) tagged[key] = value.slice(0, 500)
    }

    const hasTags = Object.keys(tagged).length > 0
    const stored = readStoredAttribution()
    if (!hasTags && stored) return // netagovaná návštěva nepřepisuje uložený zdroj

    const record = {
      ...tagged,
      referrer: document.referrer ? document.referrer.slice(0, 500) : null,
      landing_page: window.location.pathname,
      landed_at: new Date().toISOString(),
    }
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(record))
  } catch {
    // localStorage nedostupný (private mode apod.) — měření prostě nebude
  }
}

// Uložený zdroj pro zápis do Supabase; null když nic zachyceno není.
export function getAttribution() {
  return readStoredAttribution()
}

// ---------------------------------------------------------------------------
// Meta Pixel události
// ---------------------------------------------------------------------------

function newEventId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `ev-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
  }
}

// PageView při změně routy (base kód v index.html pokrývá jen první načtení).
export function trackPageView() {
  if (window.fbq) window.fbq('track', 'PageView')
}

// Dokončená registrace. Vrací event_id (pro Fázi 2 / CAPI), nebo null když
// pixel neběží (adblock apod.).
export function trackRegistration() {
  if (!window.fbq) return null
  const eventId = newEventId()
  window.fbq('track', 'CompleteRegistration', {}, { eventID: eventId })
  return eventId
}

// Vytvořený inzerát.
export function trackLead() {
  if (!window.fbq) return null
  const eventId = newEventId()
  window.fbq('track', 'Lead', { content_category: 'listing' }, { eventID: eventId })
  return eventId
}

// ---------------------------------------------------------------------------
// Detekce nové registrace (login flow nemá klasický signUp success handler —
// Google OAuth i magic link se vrací redirectem, viz AuthContext)
// ---------------------------------------------------------------------------

// Účet je "čerstvý" do 72 h od vytvoření: magic link může být kliknutý
// s odstupem (user vzniká už při odeslání OTP), reklamní registrace se ale
// odehrají v řádu hodin.
const FRESH_ACCOUNT_MS = 72 * 60 * 60 * 1000

// Čerstvě založený účet — u starších uživatelů zdroj nezapisujeme, aby se
// dodatečně nepřilepil špatný (aktuální) referrer.
export function isFreshAccount(user) {
  if (!user?.created_at) return false
  const age = Date.now() - new Date(user.created_at).getTime()
  return !Number.isNaN(age) && age >= 0 && age <= FRESH_ACCOUNT_MS
}

// True právě jednou pro nového uživatele v tomto prohlížeči; pak si to
// zapamatuje, aby CompleteRegistration nechodila při každém přihlášení.
export function shouldTrackRegistration(user) {
  if (!user?.id || !user?.created_at) return false
  const age = Date.now() - new Date(user.created_at).getTime()
  if (Number.isNaN(age) || age < 0 || age > FRESH_ACCOUNT_MS) return false
  try {
    if (localStorage.getItem(`${REG_TRACKED_KEY}_${user.id}`)) return false
    localStorage.setItem(`${REG_TRACKED_KEY}_${user.id}`, new Date().toISOString())
    return true
  } catch {
    return false // bez localStorage radši neměřit než počítat každý login
  }
}
