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

export default function NotifyButton() {
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
        <span className="text-white/70 text-sm">
          📲 To get SOS alerts on iPhone: tap <b>Share</b> → <b>Add to Home Screen</b>, then open
          the app from there and allow notifications.
        </span>
      </div>
    )
  }

  if (!pushSupported() || state === 'unsupported') return null

  if (!user) {
    return (
      <div style={box}>
        <span className="text-white/70 text-sm">🔔 Sign in to get alerted about new SOS requests.</span>
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div style={box}>
        <span className="text-white/70 text-sm">
          🔕 Notifications are blocked. Enable them for this site in your browser settings to get SOS
          alerts.
        </span>
      </div>
    )
  }

  if (state === 'subscribed') {
    return (
      <div style={box}>
        <span className="text-white/80 text-sm font-semibold">✅ SOS alerts are on</span>
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
      <span className="text-white/70 text-sm">Get pinged the moment a family posts an SOS.</span>
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        style={{
          marginLeft: 'auto',
          background: 'linear-gradient(90deg, #ef4444, #f97316)',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          padding: '9px 16px',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        {busy ? 'Enabling…' : '🔔 Get SOS alerts'}
      </button>
      {error && <span style={{ color: '#fca5a5', fontSize: 13, width: '100%' }}>{error}</span>}
    </div>
  )
}
