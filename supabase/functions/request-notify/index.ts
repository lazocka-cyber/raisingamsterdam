// RaisingAmsterdam — request-notify Edge Function
// Řekne chůvám, že rodina zadala novou poptávku ("Families looking for help").
// Spouští ji databáze (trigger on_family_request_insert) po INSERT do public.family_requests.
//
// Co udělá:
//   1. cinknutí na telefon všem s inzerátem (kromě komunitních), kdo mají upozornění zapnutá
//   2. e-mail přes Resend všem majitelům inzerátu kategorie "babysitter"
//      (kromě rodiče samotného a těch, kdo mají profiles.request_emails = false)
//
// Pojistka proti zahlcení: když už za posledních 24 hodin odešla oznámení ke 3 poptávkám,
// e-maily se k další neposílají (cinknutí ano).
//
// Ochrana bez sdíleného hesla, stejně jako u offer-notify: funkce dostane jen id poptávky
// a sama ověří, že je čerstvá (do 15 minut), otevřená a ještě neoznámená (notified_at).
//
// Tajné hodnoty: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, RESEND_API_KEY.
// "Verify JWT" musí být u této funkce VYPNUTÉ.

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
const MAX_EMAILED_REQUESTS_PER_DAY = 3

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').join(', ') : '')

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}))
    const requestId = typeof body.request_id === 'string' ? body.request_id : ''
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) return json({ skipped: 'bad id' })
    // Zkušební režim: nic neoznačí a nic neodešle, jen vrátí počty (žádné adresy).
    const preview = body.preview === true

    // Kolik poptávek už dnes dostalo e-maily (počítá se PŘED zabráním této).
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: emailedToday } = await supabase
      .from('family_requests')
      .select('id', { count: 'exact', head: true })
      .gte('notified_at', dayAgo)

    // "Zabrat" poptávku: projde jen jednou a jen pro čerstvou, otevřenou, neoznámenou.
    const since = new Date(Date.now() - FRESH_MS).toISOString()
    let request
    if (preview) {
      const { data } = await supabase
        .from('family_requests')
        .select('id, user_id, area, days, age_groups')
        .eq('id', requestId)
        .maybeSingle()
      request = data
    } else {
      const { data: claimed, error: claimErr } = await supabase
        .from('family_requests')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('status', 'open')
        .is('notified_at', null)
        .gte('created_at', since)
        .select('id, user_id, area, days, age_groups')
      if (claimErr) throw claimErr
      request = claimed?.[0]
    }
    if (!request) return json({ skipped: 'unknown, old, closed or already notified' })

    // Kdo má inzerát (kromě komunitních) a není to rodič sám.
    const { data: listings, error: listErr } = await supabase
      .from('listings')
      .select('user_id, category')
      .neq('category', 'community')
    if (listErr) throw listErr
    const withListing = new Set<string>()
    const babysitters = new Set<string>()
    for (const l of listings ?? []) {
      if (!l.user_id || l.user_id === request.user_id) continue
      withListing.add(l.user_id)
      if (l.category === 'babysitter') babysitters.add(l.user_id)
    }

    // 1) Cinknutí na telefon.
    let pushed = 0
    let wouldPush = 0
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && withListing.size > 0) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, subscription, user_id')
        .in('user_id', [...withListing])
      const payload = JSON.stringify({
        title: '👨‍👩‍👧 A family is looking for a babysitter',
        body: `${request.area}${list(request.days) ? ' · ' + list(request.days) : ''}. Tap to see and help.`,
        url: '/families',
      })
      wouldPush = subs?.length ?? 0
      for (const row of preview ? [] : (subs ?? [])) {
        try {
          await webpush.sendNotification(row.subscription, payload)
          pushed++
        } catch (err) {
          const code = err?.statusCode
          console.log('request-notify: push error', code)
          if (code === 404 || code === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint)
          }
        }
      }
    }

    // 2) E-maily chůvám.
    let emailed = 0
    const overLimit = (emailedToday ?? 0) >= MAX_EMAILED_REQUESTS_PER_DAY
    if (RESEND_API_KEY && !overLimit && babysitters.size > 0) {
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, email, request_emails')
        .in('id', [...babysitters])
      if (profErr) throw profErr
      const recipients = [
        ...new Set(
          (profiles ?? [])
            .filter((p) => p.request_emails !== false && typeof p.email === 'string' && p.email.includes('@'))
            .map((p) => p.email.trim().toLowerCase()),
        ),
      ]

      const days = list(request.days)
      const ages = list(request.age_groups)
      const text =
        `Hi,\n\n` +
        `A family on RaisingAmsterdam is looking for a babysitter.\n\n` +
        `Area: ${request.area}\n` +
        (days ? `Days: ${days}\n` : '') +
        (ages ? `Children: ${ages}\n` : '') +
        `\nIf you can help, open the request and tap "I can help". ` +
        `The family then sees your listing and can message you on WhatsApp.\n` +
        `${SITE}/families\n\n` +
        `You get this email because you have a babysitter listing on RaisingAmsterdam. ` +
        `If you would rather not get these, just reply "stop".\n\n` +
        `Zdenka\nRaisingAmsterdam`
      const subject = `A family in ${request.area} is looking for a babysitter`
      if (preview) {
        return json({ preview: true, wouldPush, wouldEmail: recipients.length, subject, overLimit })
      }

      // Každé zvlášť (nikdo nevidí cizí adresu), po dávkách nejvýš 100.
      for (let i = 0; i < recipients.length; i += 100) {
        const batch = recipients.slice(i, i + 100).map((to) => ({
          from: FROM,
          to: [to],
          reply_to: REPLY_TO,
          subject,
          text,
        }))
        const r = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        })
        if (r.ok) emailed += batch.length
        else console.log('request-notify: resend error', r.status)
      }
    }

    if (preview) return json({ preview: true, wouldPush, wouldEmail: 0, overLimit })
    console.log('request-notify: done. pushed =', pushed, 'emailed =', emailed, 'overLimit =', overLimit)
    return json({ pushed, emailed, overLimit })
  } catch (e) {
    console.log('request-notify: fatal', String(e))
    return json({ error: 'failed' }, 500)
  }
})
