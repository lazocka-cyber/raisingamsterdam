// Shared listing helpers — used by Listings.jsx and ListingDetail.jsx.

// Category badge colours (match the form's section accent colours).
export const BADGE = {
  babysitter: { label: 'Babysitter', color: '#a78bfa' },
  secondhand: { label: 'Second-hand', color: '#34d399' },
  services: { label: 'Services', color: '#60d0ff' },
  community: { label: 'Community', color: '#f97316' },
}

// Map of stored experience_years value → human label (mirrors PostListing).
export const EXPERIENCE_LABELS = {
  0: 'Less than 1 year',
  1: '1-2 years',
  3: '3-5 years',
  5: '5+ years',
}

// Prefix € when the price is a bare number ("18" → "€18"); otherwise show
// the value as-is ("Free", "negotiable", "€12/hour").
export function formatPrice(price) {
  if (price == null) return ''
  const value = String(price).trim()
  return /^\d+(\.\d+)?$/.test(value) ? `€${value}` : value
}

// Normalize a stored number for a wa.me link: strip spaces/dashes,
// replace a leading 0 with 31 (Dutch), and drop the + on + numbers.
export function waNumber(phone) {
  const n = String(phone).replace(/[\s-]/g, '')
  if (n.startsWith('+')) return n.slice(1)
  if (n.startsWith('0')) return `31${n.slice(1)}`
  return n
}
