import { useEffect, useRef } from 'react'

// Full-screen confetti burst on canvas (same canvas+rAF pattern as
// ParticleHeader). Plays for ~1.4s, then calls onDone. With reduced motion
// it skips straight to onDone.

const COLORS = ['#34d399', '#60d0ff', '#a78bfa', '#f97316', '#fbbf24', '#ffffff']

export default function ConfettiBurst({ onDone, duration = 1400 }) {
  const canvasRef = useRef(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    let reduced = false
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      /* ignore */
    }
    if (reduced) {
      const t = setTimeout(() => onDoneRef.current?.(), 150)
      return () => clearTimeout(t)
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const pieces = Array.from({ length: 140 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.3,
      y: h * 0.35,
      vx: (Math.random() - 0.5) * 14,
      vy: -6 - Math.random() * 9,
      size: 5 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
    }))

    let raf
    const start = performance.now()
    function tick(now) {
      const t = now - start
      ctx.clearRect(0, 0, w, h)
      for (const p of pieces) {
        p.vy += 0.35 // gravity
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, 1 - t / duration)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }
      if (t < duration) {
        raf = requestAnimationFrame(tick)
      } else {
        onDoneRef.current?.()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        pointerEvents: 'none',
        width: '100vw',
        height: '100vh',
      }}
    />
  )
}
