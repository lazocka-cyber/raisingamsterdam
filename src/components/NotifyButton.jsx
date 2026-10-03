import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getPushState,
  subscribeToPush,
  unsubscribeFromPush,
  pushSupported,
  isiOS,
  isStandalone,
} from '../lib/push'

const box = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: '12px 16px',
  marginTop: 16,
}

// Copy per use: SOS alerts for sitters, or "a babysitter replied" for parents.
const TEXTS = {
  sos: {
    ios: (
      <>
        📲 To get SOS alerts on iPhone: tap <b>Share</b> → <b>Add to Home Screen</b>, then open
        the app from there and allow notifications.
      </>
    ),
    signedOut: '🔔 Sign in to get alerted about new SOS requests.',
    blocked: '🔕 Notifications are blocked. Enable them for this site in your browser settings to get SOS alerts.',
    on: '✅ SOS alerts are on',
    offer: 'Get pinged the moment a family posts an SOS.',
    button: '🔔 Get SOS alerts',
    gradient: 'linear-gradient(90deg, #ef4444, #f97316)',
  },
  family: {
    ios: (
      <>
        <b className="text-white">🔔 Get an alert when a babysitter replies.</b> On iPhone this works
        once RaisingAmsterdam is on your home screen:
        <br />1. In Safari tap <b>Share</b> (on newer iPhones under <b>···</b>)
        <br />2. Choose <b>Add to Home Screen</b>
        <br />3. Open the app from the new icon and tap <b>Turn on alerts</b>
      </>
    ),
    signedOut: '🔔 Sign in to get alerts when a babysitter replies.',
    blocked: '🔕 Notifications are blocked. Enable them for this site in your browser settings to hear when a babysitter replies.',
    on: '✅ Alerts are on — we ping you when a babysitter replies',
    offer: 'Get an alert when a babysitter replies.',
    button: '🔔 Turn on alerts',
    gradient: 'linear-gradient(90deg, #34d399, #60d0ff)',
  },
}

export default function NotifyButton({ variant = 'sos' }) {
  const t = TEXTS[variant] ?? TEXTS.sos
  const { user } = useAuth()
  const [state, setState] = useState('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPushState()
      .then((s) => active && setState(s))
      .catch(() => active && setState('unsupported'))
    return () => {
      active = false
    }
  }, [])

  async function enable() {
    setError('')
    setBusy(true)
    try {
      await subscribeToPush(user)
      setState('subscribed')
    } catch (e) {
      setError(e.message || 'Could not enable notifications.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    try {
      await unsubscribeFromPush()
      setState('default')
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') return null

  // iOS must be installed to the home screen for push to work.
  if (isiOS() && !isStandalone()) {
    return (
      <div style={box}>
        <span className="text-white/70 text-sm" style={{ lineHeight: 1.6 }}>
          {t.ios}
        </span>
      </div>
    )
  }

  if (!pushSupported() || state === 'unsupported') return null

  if (!user) {
    return (
      <div style={box}>
        <span className="text-white/70 text-sm">{t.signedOut}</span>
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div style={box}>
        <span className="text-white/70 text-sm">{t.blocked}</span>
      </div>
    )
  }

  if (state === 'subscribed') {
    return (
      <div style={box}>
        <span className="text-white/80 text-sm font-semibold">{t.on}</span>
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {busy ? '…' : 'Turn off'}
        </button>
      </div>
    )
  }

  // default — offer to enable
  return (
    <div style={box}>
      <span className="text-white/70 text-sm">{t.offer}</span>
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        style={{
          marginLeft: 'auto',
          background: t.gradient,
          color: variant === 'family' ? '#042C53' : 'white',
          border: 'none',
          borderRadius: 10,
          padding: '9px 16px',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        {busy ? 'Enabling…' : t.button}
      </button>
      {error && <span style={{ color: '#fca5a5', fontSize: 13, width: '100%' }}>{error}</span>}
    </div>
  )
}
