// Shared listing helpers — used by Listings.jsx and ListingDetail.jsx.

import { supabase } from './supabase'

// Explicit list of listing columns the app reads — deliberately EXCLUDES `phone`.
// The phone number is private and is fetched on demand via the get_listing_contact
// RPC (members / the owner only), never sent in the public listing rows.
export const LISTING_COLUMNS =
  'id, user_id, title, description, category, price, location, contact_email, created_at, postcode, languages, experience_years, availability, age_groups, photo_url'

// Fetch a listing's WhatsApp number securely and open the chat.
// The database function returns the number only to a paying member (or the
// listing's owner); everyone else gets an error and a friendly nudge.
export async function openListingContact(listingId) {
  const { data, error } = await supabase.rpc('get_listing_contact', {
    p_listing_id: listingId,
  })
  if (error) {
    alert('Unlocking contact is for members. Please activate your membership first.')
    return
  }
  if (!data) {
    alert('This listing has no contact number yet.')
    return
  }
  window.open(`https://wa.me/${waNumber(data)}`, '_blank', 'noopener,noreferrer')
}

// Category badge colours (match the form's section accent colours).
export const BADGE = {
  babysitter: { label: 'Babysitter', color: '#a78bfa' },
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
