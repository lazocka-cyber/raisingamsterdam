// First-party měření zdroje registrací: utm_* / fbclid / referrer zachycené při
// příchodu do appky se uloží do localStorage a po registraci se zapíšou do
// Supabase (profiles.source, listings.source). Díky tomu je u každé registrace
// vidět, která kampaň ji přivedla. Meta Pixel byl odstraněn 3. 10. 2026.

const ATTRIBUTION_KEY = 'ra_attribution'

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
