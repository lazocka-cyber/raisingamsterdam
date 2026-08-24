// Attention helpers: phone vibration and a short celebration sound.
// Both are best-effort — they silently do nothing where unsupported
// (desktop browsers, iOS Safari for vibrate) or when the user prefers
// reduced motion.

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

// Same pattern the push notifications already use (public/sw.js).
export function buzz(pattern = [120, 60, 120]) {
  if (prefersReducedMotion()) return
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

// Short "ta-da" via Web Audio. Must be called from inside a user gesture
// (click handler) — browsers block audio started outside one.
export function playTada() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    if (ctx.state === 'suspended') ctx.resume()
    const notes = [
      { freq: 523.25, at: 0, dur: 0.16 }, // C5
      { freq: 659.25, at: 0.14, dur: 0.16 }, // E5
      { freq: 783.99, at: 0.28, dur: 0.4 }, // G5
    ]
    const master = ctx.createGain()
    master.gain.value = 0.18
    master.connect(ctx.destination)
    for (const n of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = n.freq
      const t0 = ctx.currentTime + n.at
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(1, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur)
      osc.connect(gain)
      gain.connect(master)
      osc.start(t0)
      osc.stop(t0 + n.dur + 0.05)
    }
    // Close the context once the jingle is done to free the audio hardware.
    setTimeout(() => ctx.close().catch(() => {}), 1200)
  } catch {
    /* ignore */
  }
}
