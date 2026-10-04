import NotifyButton from './NotifyButton'
import SirenIcon from './SirenIcon'

// For babysitters and services: an SOS only reaches them if their phone can
// ping, so turning on alerts is the first thing they see (dashboard, and right
// after publishing a listing).
export default function SosAlertsCard({ title = 'Turn on SOS alerts' }) {
  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.12)',
        border: '2px solid rgba(239,68,68,0.55)',
        borderRadius: 16,
        padding: '18px 20px',
        textAlign: 'left',
      }}
    >
      <p className="text-white font-bold flex items-center" style={{ fontSize: 17, gap: 8 }}>
        <span style={{ color: '#f87171', display: 'inline-flex' }}>
          <SirenIcon size={20} />
        </span>
        {title}
      </p>
      <p className="text-white/75 text-sm" style={{ marginTop: 6, lineHeight: 1.55 }}>
        Families who need a sitter fast send an SOS. With alerts on, your phone pings
        right away and you can be the one who helps.
      </p>
      <NotifyButton />
    </div>
  )
}
