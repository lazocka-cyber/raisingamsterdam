// RaisingAmsterdam — delete-account Edge Function
// Lets a signed-in user permanently delete their own account and all their data.
// Called from the app (and the public /delete-account page) via
// supabase.functions.invoke('delete-account').
//
// Because every user table references auth.users(id) ON DELETE CASCADE
// (listings, reviews, meetups, sos_requests, push_subscriptions, profiles),
// deleting the auth user automatically removes ALL of their rows too.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// Keep "Verify JWT" ON (default) — only a signed-in user can reach this.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // CORS preflight (browser calls this from the app).
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // The caller's session token tells us *who* is asking — we only ever
    // delete the account that owns this token, never anyone else's.
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '').trim()
    if (!jwt) return json({ error: 'Not authenticated' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !userData?.user) {
      return json({ error: 'Invalid or expired session' }, 401)
    }
    const userId = userData.user.id

    // Storage is NOT covered by ON DELETE CASCADE (that only handles DB rows).
    // First delete the user's uploaded photos from the 'listing-photos' bucket —
    // they live under a folder named after the user id ("<userId>/<file>").
    try {
      const { data: files, error: listErr } = await admin.storage
        .from('listing-photos')
        .list(userId, { limit: 1000 })
      if (listErr) {
        console.log('delete-account: storage list error', userId, listErr.message)
      } else if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`)
        const { error: rmErr } = await admin.storage
          .from('listing-photos')
          .remove(paths)
        if (rmErr) console.log('delete-account: storage remove error', userId, rmErr.message)
        else console.log('delete-account: removed', paths.length, 'photo(s) for', userId)
      }
    } catch (se) {
      console.log('delete-account: storage cleanup failed', String(se))
    }

    // Delete the auth user → cascades to all their data (DB tables).
    const { error: delErr } = await admin.auth.admin.deleteUser(userId)
    if (delErr) {
      console.log('delete-account: error deleting', userId, delErr.message)
      return json({ error: delErr.message }, 500)
    }

    console.log('delete-account: deleted user', userId)
    return json({ success: true })
  } catch (e) {
    console.log('delete-account: fatal', String(e))
    return json({ error: String(e) }, 500)
  }
})
