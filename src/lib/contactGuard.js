// Free-text fields of a parent's request must not carry contact details:
// the parent unlocks WhatsApp with membership. Same rule lives in the database
// (supabase/family_requests_no_contact.sql) so it can't be bypassed via the API.
//
// Blocked: 6+ digits in a row (single space, dot, dash or bracket between
// digits is ignored, so "06 12 34 56 78" and "+31 6-1234-5678" are caught),
// "@", links, "wa.me" and the word "whatsapp".
// Allowed: "2 years", "from 8:30", "3 days a week".

const LONG_NUMBER = /[0-9]([ .()-]?[0-9]){5,}/
const OTHER_CONTACT = /@|https?:|www\.|wa\.me|whatsapp/i

export function hasContactDetails(text) {
  if (!text) return false
  return LONG_NUMBER.test(text) || OTHER_CONTACT.test(text)
}

export const CONTACT_ERROR =
  "Please don't write a phone number, email or link here. You unlock WhatsApp after a babysitter replies."
