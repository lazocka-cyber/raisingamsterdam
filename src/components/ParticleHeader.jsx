import { useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────
// ParticleHeader — lightweight three.js particle strip.
//   ~150 floating particles, slow drift + gentle mouse parallax,
//   transparent background (page bg shows through), tab-visibility
//   aware (pauses rAF when hidden), full cleanup on unmount.
//
// three.js is loaded from CDN at runtime — same pattern as Logo3D,
// so there's no npm dependency to install.
// ─────────────────────────────────────────────────────────────

const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'

let threePromise = null
function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE)
  if (!threePromise) {
    threePromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = THREE_CDN
      s.onload = () => resolve(window.THREE)
      s.onerror = reject
      document.head.appendChild(s)
    })
  }
  return threePromise
}

const COLORS = ['#a78bfa', '#34d399', '#60d0ff', '#f97316']
const COUNT = 150
const SX = 46 // half-width of the particle box
const SY = 20
const SZ = 22

export default function ParticleHeader({ children }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    let disposed = false
    let cleanup = () => {}

    loadThree()
      .then((THREE) => {
        if (disposed || !canvasRef.current || !wrapRef.current) return

        const wrap = wrapRef.current
        let w = wrap.clientWidth || 1
        let h = wrap.clientHeight || 1

        const renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: true,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(w, h, false)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200)
        camera.position.z = 32

        const positions = new Float32Array(COUNT * 3)
        const colors = new Float32Array(COUNT * 3)
        const vel = new Float32Array(COUNT * 3)
        const palette = COLORS.map((c) => new THREE.Color(c))

        for (let i = 0; i < COUNT; i++) {
          const o = i * 3
          positions[o] = (Math.random() * 2 - 1) * SX
          positions[o + 1] = (Math.random() * 2 - 1) * SY
          positions[o + 2] = (Math.random() * 2 - 1) * SZ
          vel[o] = (Math.random() * 2 - 1) * 0.018
          vel[o + 1] = (Math.random() * 2 - 1) * 0.018
          vel[o + 2] = (Math.random() * 2 - 1) * 0.018
          const col = palette[i % palette.length]
          colors[o] = col.r
          colors[o + 1] = col.g
          colors[o + 2] = col.b
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const material = new THREE.PointsMaterial({
          size: 1.4,
          vertexColors: true,
          transparent: true,
          opacity: 0.9,
          sizeAttenuation: true,
          depthWrite: false,
        })

        const points = new THREE.Points(geometry, material)
        scene.add(points)

        // gentle mouse parallax (lerped toward the pointer position)
        const target = { x: 0, y: 0 }
        const eye = { x: 0, y: 0 }
        function onMouse(e) {
          const r = wrap.getBoundingClientRect()
          target.x = ((e.clientX - r.left) / r.width) * 2 - 1
          target.y = ((e.clientY - r.top) / r.height) * 2 - 1
        }

        function onResize() {
          w = wrap.clientWidth || 1
          h = wrap.clientHeight || 1
          renderer.setSize(w, h, false)
          camera.aspect = w / h
          camera.updateProjectionMatrix()
        }

        let rafId = 0
        const pos = geometry.attributes.position.array
        function render() {
          for (let i = 0; i < COUNT; i++) {
            const o = i * 3
            pos[o] += vel[o]
            pos[o + 1] += vel[o + 1]
            pos[o + 2] += vel[o + 2]
            if (pos[o] > SX || pos[o] < -SX) vel[o] = -vel[o]
            if (pos[o + 1] > SY || pos[o + 1] < -SY) vel[o + 1] = -vel[o + 1]
            if (pos[o + 2] > SZ || pos[o + 2] < -SZ) vel[o + 2] = -vel[o + 2]
          }
          geometry.attributes.position.needsUpdate = true
          points.rotation.y += 0.0008

          eye.x += (target.x - eye.x) * 0.05
          eye.y += (target.y - eye.y) * 0.05
          camera.position.x = eye.x * 4
          camera.position.y = -eye.y * 2
          camera.lookAt(0, 0, 0)

          renderer.render(scene, camera)
          rafId = requestAnimationFrame(render)
        }

        function onVisibility() {
          if (document.hidden) {
            cancelAnimationFrame(rafId)
            rafId = 0
          } else if (!rafId) {
            rafId = requestAnimationFrame(render)
          }
        }

        window.addEventListener('mousemove', onMouse)
        window.addEventListener('resize', onResize)
        document.addEventListener('visibilitychange', onVisibility)
        rafId = requestAnimationFrame(render)

        cleanup = () => {
          cancelAnimationFrame(rafId)
          window.removeEventListener('mousemove', onMouse)
          window.removeEventListener('resize', onResize)
          document.removeEventListener('visibilitychange', onVisibility)
          geometry.dispose()
          material.dispose()
          renderer.dispose()
        }
      })
      .catch(() => {
        // CDN failed — the strip just stays empty (page bg shows through)
      })

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return (
    <div ref={wrapRef} className="pl-header">
      <canvas ref={canvasRef} />
      {children}
    </div>
  )
}
