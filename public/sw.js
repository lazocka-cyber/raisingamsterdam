/* RaisingAmsterdam service worker
   - Makes the app installable (Add to Home Screen).
   - Push-ready: handles SOS push notifications and clicks.
   No offline caching yet — kept minimal on purpose. */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Incoming push from the server (Web Push). Payload is JSON:
// { title, body, url }
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data && event.data.text() }
  }

  const title = data.title || '🚨 SOS — a family needs a sitter'
  const options = {
    body: data.body || 'Tap to see the request and help out.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [120, 60, 120],
    tag: 'raising-sos',
    renotify: true,
    data: { url: data.url || '/sos' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Focus an existing tab or open a new one at the SOS page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/sos'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
      return undefined
    }),
  )
})
