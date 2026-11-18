// RaisingAmsterdam — offer-notify Edge Function
// Řekne rodiči, že se mu na poptávku ozvala chůva ("I can help").
// Spouští ji databáze (trigger on_offer_insert) po INSERT do public.request_offers.
//
// Co udělá:
//   1. cinknutí na telefon rodiče (Web Push), pokud má upozornění zapnutá
//   2. e-mail rodiči přes Resend — jen u PRVNÍ odpovědi na danou poptávku,
//      aby mu nechodil e-mail za každou chůvu
//
// Ochrana bez sdíleného hesla: funkce dostane jen id nabídky a sama si v databázi
// ověří, že nabídka existuje, je čerstvá (do 15 minut) a ještě nebyla oznámená
// (sloupec notified_at). Kdo by adresu funkce zavolal zvenku, nedosáhne ničeho:
// s vymyšleným id se nestane nic, se skutečným nanejvýš to jedno oznámení, které
// by odešlo tak jako tak, a podruhé už ne.
//
// Tajné hodnoty (Supabase → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT — už existují kvůli SOS
//   RESEND_API_KEY — NOVÉ, jen pro e-mail; bez něj funkce pošle jen cinknutí
// SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY dodá Supabase sám.
//
// "Verify JWT" musí být u této funkce VYPNUTÉ (volá ji databáze, ne přihlášený člověk).

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:raisingsmall.info@gmail.com'
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

const SITE = 'https://raisingamsterdam.com'
const FROM = 'RaisingAmsterdam <raisingamsterdam@raisingsmall.com>'
const REPLY_TO = 'raisingsmall.info@gmail.com'
const FRESH_MS = 15 * 60 * 1000

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}))
    const offerId = typeof body.offer_id === 'string' ? body.offer_id : ''
    if (!/^[0-9a-f-]{36}$/i.test(offerId)) return json({ skipped: 'bad id' })

    // "Zabrat" nabídku: projde jen jednou a jen pro čerstvou, neoznámenou nabídku.
    const since = new Date(Date.now() - FRESH_MS).toISOString()
    const { data: claimed, error: claimErr } = await supabase
      .from('request_offers')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', offerId)
      .is('notified_at', null)
      .gte('created_at', since)
      .select('id, request_id, listing_id')
    if (claimErr) throw claimErr
    const offer = claimed?.[0]
    if (!offer) return json({ skipped: 'unknown, old or already notified' })

    const { data: request } = await supabase
      .from('family_requests')
      .select('id, user_id, area, status')
      .eq('id', offer.request_id)
      .maybeSingle()
    if (!request) return json({ skipped: 'no request' })

    const { count } = await supabase
      .from('request_offers')
      .select('id', { count: 'exact', head: true })
      .eq('request_id', request.id)
    const offersSoFar = count ?? 1

    // 1) Cinknutí na telefon — jen tomuto rodiči.
    let pushed = 0
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, subscription')
        .eq('user_id', request.user_id)
      const payload = JSON.stringify({
        title: '🙋 A babysitter wants to help',
        body:
          offersSoFar > 1
            ? `${offersSoFar} babysitters replied to your request in ${request.area}. Tap to see them.`
            : `A babysitter replied to your request in ${request.area}. Tap to see who.`,
        url: '/my-requests',
      })
      for (const row of subs ?? []) {
        try {
          await webpush.sendNotification(row.subscription, payload)
          pushed++
        } catch (err) {
          const code = err?.statusCode
          console.log('offer-notify: push error', code)
          if (code === 404 || code === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint)
          }
        }
      }
    }

    // 2) E-mail — jen u první odpovědi na poptávku.
    let emailed = false
    if (RESEND_API_KEY && offersSoFar === 1) {
      const { data: userData } = await supabase.auth.admin.getUserById(request.user_id)
      const to = userData?.user?.email
      if (to) {
        const link = `${SITE}/my-requests`
        const text =
          `Hi,\n\n` +
          `Good news: a babysitter replied to your request in ${request.area} on RaisingAmsterdam.\n\n` +
          `See who it is, read their listing and references:\n${link}\n\n` +
          `More babysitters may reply in the coming days. We email you only for the first reply, ` +
          `so check back in the app for the others.\n\n` +
          `Zdenka\nRaisingAmsterdam`
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM,
            to: [to],
            reply_to: REPLY_TO,
            subject: 'A babysitter replied to your request',
            text,
          }),
        })
        emailed = r.ok
        if (!r.ok) console.log('offer-notify: resend error', r.status)
      }
    }

    console.log('offer-notify: done. pushed =', pushed, 'emailed =', emailed)
    return json({ pushed, emailed })
  } catch (e) {
    console.log('offer-notify: fatal', String(e))
    return json({ error: 'failed' }, 500)
  }
})
