import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { captureAttribution } from './lib/tracking.js'

// Zachytit utm_* / fbclid / referrer hned při příchodu — ještě před renderem,
// aby se zdroj neztratil při přesměrování v appce.
captureAttribution()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the service worker so the app is installable and can receive
// SOS push notifications. Fails silently in unsupported browsers.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}
