import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'

// Secondary link under the main CTA on /for-parents: "See babysitters →".
// A small hand taps next to it every few seconds (ring ripple + arrow nudge)
// so the eye finds it. Static when the visitor prefers reduced motion.

const CYAN = '#60d0ff'
const CYCLE = 3.2 // seconds between taps
const tapLoop = (times) => ({
  duration: CYCLE,
  times,
  repeat: Infinity,
  ease: 'easeOut',
  delay: 1.2,
})

// Lucide "pointer" (ISC licence) — an icon instead of the 👆 emoji.
function PointerIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 14a8 8 0 0 1-8 8" />
      <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
      <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />
      <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
      <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  )
}

export default function SeeBabysittersLink() {
  const reduce = useReducedMotion()

  return (
    <Link
      to="/listings?cat=babysitter"
      style={{ color: CYAN, fontWeight: 600, fontSize: 16, padding: '4px 2px', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
    >
      <span>See babysitters</span>
      <motion.span
        aria-hidden="true"
        style={{ display: 'inline-block' }}
        animate={reduce ? undefined : { x: [0, 0, 5, 0, 5, 0] }}
        transition={tapLoop([0, 0.12, 0.17, 0.22, 0.27, 0.34])}
      >
        →
      </motion.span>
      <span style={{ position: 'relative', display: 'inline-flex', width: 26, height: 26, alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}>
        {!reduce && (
          <motion.span
            aria-hidden="true"
            style={{ position: 'absolute', left: 3, top: 0, width: 12, height: 12, borderRadius: 999, border: `2px solid ${CYAN}` }}
            animate={{ scale: [0.4, 0.4, 2.2], opacity: [0, 0.9, 0] }}
            transition={tapLoop([0, 0.1, 0.4])}
          />
        )}
        <motion.span
          style={{ display: 'inline-flex', transformOrigin: '30% 10%' }}
          animate={reduce ? undefined : { scale: [1, 0.82, 1], y: [0, 2, 0], rotate: [0, -6, 0] }}
          transition={tapLoop([0, 0.1, 0.22])}
        >
          <PointerIcon />
        </motion.span>
      </span>
    </Link>
  )
}
