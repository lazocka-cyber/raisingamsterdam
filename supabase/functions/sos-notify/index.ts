// RaisingAmsterdam — sos-notify Edge Function
// Triggered by a Database Webhook on INSERT into public.sos_requests.
// Fans out a Web Push notification to every saved push_subscription.
//
// Required function secrets (Supabase → Edge Functions → sos-notify → Secrets):
//   VAPID_PUBLIC_KEY     — public VAPID key (same as in src/lib/push.js)
//   VAPID_PRIVATE_KEY    — private VAPID key (keep secret!)
//   VAPID_SUBJECT        — e.g. mailto:raisingsmall.info@gmail.com
//   SOS_WEBHOOK_SECRET   — shared secret; the webhook must send it as header
//                          "x-sos-secret" so the endpoint can't be abused.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// Turn OFF "Verify JWT" for this function (it is called by the DB webhook,
// not by a logged-in user — it's protected by SOS_WEBHOOK_SECRET instead).

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:raisingsmall.info@gmail.com'
const SOS_WEBHOOK_SECRET = Deno.env.get('SOS_WEBHOOK_SECRET') ?? ''

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

Deno.serve(async (req) => {
  // Reject anyone who doesn't know the shared secret.
  if (req.headers.get('x-sos-secret') !== SOS_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const sos = body.record ?? {}

    const where = [sos.area, sos.postcode].filter(Boolean).join(' · ')
    const when = sos.needed_time || 'as soon as possible'
    const payload = JSON.stringify({
      title: '🚨 SOS — a family needs a sitter',
      body: `${where || 'Amsterdam'} · ${when}. Tap to help out.`,
      url: '/sos',
    })

    const { data: subs, error } = await supabase.from('push_subscriptions').select('*')
    if (error) throw error

    let sent = 0
    let removed = 0
    await Promise.all(
      (subs ?? []).map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription, payload)
          sent++
        } catch (err) {
          const code = err?.statusCode
          // 404/410 = subscription gone → clean it up.
          if (code === 404 || code === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint)
            removed++
          }
        }
      }),
    )

    return new Response(JSON.stringify({ sent, removed }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
