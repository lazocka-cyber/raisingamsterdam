import { supabase } from './supabase'

// Public VAPID key — safe to ship to the browser (it's the "application
// server key"). The matching PRIVATE key lives only in the Edge Function.
export const VAPID_PUBLIC_KEY =
  'BP0nfGVo8r6-6FCDDekjFr-wBs4FYC8A4sdsh52I7Nea9GdDroYe4vQlIzqM5zwMy1zGFz7W1KPhTnZBzPqd9o0'

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isiOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// iOS only delivers web push when the app was opened from the home screen.
export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

// 'unsupported' | 'denied' | 'default' | 'subscribed'
export async function getPushState() {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub ? 'subscribed' : 'default'
}

export async function subscribeToPush(user) {
  if (!pushSupported()) throw new Error('Push is not supported on this device or browser.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notifications were not allowed.')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = sub.toJSON()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: user?.id ?? null, endpoint: json.endpoint, subscription: json },
      { onConflict: 'endpoint' },
    )
  if (error) throw error
  return sub
}

export async function unsubscribeFromPush() {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
}
