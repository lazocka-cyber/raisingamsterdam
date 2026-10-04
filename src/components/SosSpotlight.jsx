import { Link } from 'react-router-dom'
import { MEMBERSHIP_PRICE } from '../lib/listingUtils'
import SirenIcon from './SirenIcon'

// SOS — the app's most important feature — front and centre on Home and
// /for-parents. The copy stays true to how SOS works: members post an SOS,
// babysitters and services who turned on alerts get a push, and only signed-in
// babysitters and services with a listing see the family's WhatsApp number.

const RED = '#ef4444'
const ORANGE = '#f97316'
const SOS_GRADIENT = `linear-gradient(90deg, ${RED}, ${ORANGE})`

const STEPS = ['Post an SOS', 'Their phones ping', 'They WhatsApp you']

export default function SosSpotlight({ forSitters = true }) {
  return (
    <div
      style={{
        background: 'linear-gradient(160deg, rgba(239,68,68,0.22), rgba(249,115,22,0.10) 55%, #1a1a2e)',
        border: `1px solid ${RED}99`,
        borderRadius: 22,
        padding: '24px 22px 22px',
        textAlign: 'left',
        boxShadow: '0 20px 50px rgba(239,68,68,0.15)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: SOS_GRADIENT,
          color: 'white',
          borderRadius: 999,
          padding: '6px 14px',
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: 0.4,
        }}
      >
        <SirenIcon size={17} />
        SOS
      </span>

      <h2 className="text-white font-bold" style={{ fontSize: 'clamp(28px, 5vw, 38px)', lineHeight: 1.08, letterSpacing: -0.6, marginTop: 14 }}>
        Need a babysitter today?
      </h2>
      <p className="text-white/80" style={{ fontSize: 17, lineHeight: 1.55, marginTop: 10, maxWidth: 560 }}>
        Send an SOS. Babysitters and services who turned on alerts get a ping on their
        phone right away, and message you on WhatsApp.
      </p>

      <ol className="flex flex-wrap" style={{ gap: 8, marginTop: 16 }}>
        {STEPS.map((s, i) => (
          <li
            key={s}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 999,
              padding: '6px 14px 6px 6px',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: SOS_GRADIENT,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center" style={{ gap: 12, marginTop: 20 }}>
        <Link
          to="/sos/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 9,
            background: SOS_GRADIENT,
            color: 'white',
            borderRadius: 14,
            padding: '14px 24px',
            fontWeight: 800,
            fontSize: 17,
            boxShadow: '0 12px 30px rgba(239,68,68,0.35)',
          }}
        >
          <SirenIcon size={20} />
          Send an SOS
        </Link>
        <Link
          to="/sos"
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 14,
            padding: '13px 20px',
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {forSitters ? 'Babysitter? Turn on SOS alerts' : 'Open the SOS board'}
        </Link>
      </div>

      <p className="text-white/55" style={{ fontSize: 13.5, marginTop: 14 }}>
        Sending an SOS is for members: {MEMBERSHIP_PRICE} once, no subscription. Helping out is free.
      </p>
    </div>
  )
}
