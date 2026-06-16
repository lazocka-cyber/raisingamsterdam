import { useState } from 'react'

const GOLD = '#fbbf24'
const EMPTY = 'rgba(255,255,255,0.22)'

// A single star path.
function Star({ fill, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={fill}
        d="M12 3.2l2.6 5.6 6 .8-4.4 4.1 1.1 6L12 16.9 6.7 19.7l1.1-6L3.4 9.6l6-.8z"
      />
    </svg>
  )
}

// Read-only star display. `value` may be fractional (e.g. 4.3); we round to
// the nearest whole star for the visual.
export function Stars({ value = 0, size = 16 }) {
  const rounded = Math.round(value)
  return (
    <span style={{ display: 'inline-flex', gap: 2, lineHeight: 0 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= rounded ? GOLD : EMPTY} />
      ))}
    </span>
  )
}

// Interactive star picker for the review form.
export function StarInput({ value, onChange, size = 30 }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <span style={{ display: 'inline-flex', gap: 4, lineHeight: 0 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}
        >
          <Star size={size} fill={n <= shown ? GOLD : EMPTY} />
        </button>
      ))}
    </span>
  )
}
