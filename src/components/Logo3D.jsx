import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// Logo3D — animované logo RaisingAmsterdam:
//   1. Zeměkoule se roztočí a plynule brzdí, až se zastaví
//      s Nizozemskem čelem k divákovi
//   2. Kamera najede zoom na Amsterdam
//   3. Na Amsterdamu pulzuje zelená tečka — a tam to zůstane
// Kliknutím na glóbus se animace přehraje znovu.
//
// Three.js se načítá z CDN za běhu — není potřeba npm install.
// Textura: /earth-texture.jpg (je v public/).
//
// Použití:  import Logo3D from './components/Logo3D';
//           <Logo3D size={260} />
// Zatím NENÍ nikde importovaná — appku nijak neovlivňuje.
// ─────────────────────────────────────────────────────────────

const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

// Amsterdam
const LAT = 52.37 * Math.PI / 180;
const LON = 4.90 * Math.PI / 180;
// Cílová rotace Y, při které je Amsterdam čelem ke kameře (+Z)
const TARGET_Y = -Math.PI / 2 - LON;

const SPINS = 4;            // počet otáček před zabrzděním
const SPIN_MS = 4500;       // délka roztočení + brzdění
const ZOOM_DELAY = 300;     // pauza před zoomem
const ZOOM_MS = 2000;       // délka zoomu
const CAM_FAR = 6;
const CAM_NEAR = 5.45; // zoom končí tak, aby zůstala vidět celá zeměkoule

const easeOutQuart = (p) => 1 - Math.pow(1 - p, 4);
const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

let threePromise = null;
function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (!threePromise) {
    threePromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = THREE_CDN;
      s.onload = () => resolve(window.THREE);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return threePromise;
}

export default function Logo3D({ size = 260, textureUrl = '/earth-texture.jpg' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let rafId = 0;
    const disposables = [];

    loadThree().then((THREE) => {
      if (disposed || !canvasRef.current) return;

      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      disposables.push(renderer);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.z = CAM_FAR;

      const R = 1.85;
      const geo = new THREE.SphereGeometry(R, 64, 64);
      const tex = new THREE.TextureLoader().load(textureUrl);
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 });
      const earth = new THREE.Mesh(geo, mat);
      earth.rotation.order = 'XYZ'; // nejdřív otáčení (Y), pak náklon (X)
      scene.add(earth);
      disposables.push(geo, tex, mat);

      // Atmosféra — jemná modrá záře kolem
      const glowGeo = new THREE.SphereGeometry(R * 1.05, 64, 64);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x47bfff, transparent: true, opacity: 0.16, side: THREE.BackSide });
      scene.add(new THREE.Mesh(glowGeo, glowMat));
      disposables.push(glowGeo, glowMat);

      // Zelená tečka na Amsterdamu (dítě zeměkoule — otáčí se s ní)
      const phi = LON + Math.PI; // posun textury: u=0 je na -180°
      const markerPos = new THREE.Vector3(
        -Math.cos(LAT) * Math.cos(phi) * R,
        Math.sin(LAT) * R,
        Math.cos(LAT) * Math.sin(phi) * R,
      );
      const dotGeo = new THREE.SphereGeometry(0.04, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(markerPos.clone().multiplyScalar(1.01));
      earth.add(dot);
      const pulseGeo = new THREE.SphereGeometry(0.04, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0 });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      pulse.position.copy(dot.position);
      earth.add(pulse);
      disposables.push(dotGeo, dotMat, pulseGeo, pulseMat);

      // Světla
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(-3, 2, 5);
      scene.add(sun);
      scene.add(new THREE.AmbientLight(0xaab6cc, 0.85));

      // Myš — jemná paralaxa až po dokončení animace
      let mx = 0, my = 0, cx = 0, cy = 0;
      const onMove = (e) => {
        mx = (e.clientX / window.innerWidth - 0.5);
        my = (e.clientY / window.innerHeight - 0.5);
      };
      window.addEventListener('pointermove', onMove);

      // Klik = přehrát znovu
      let start = performance.now();
      const onClick = () => { start = performance.now(); };
      canvasRef.current.addEventListener('click', onClick);

      const animate = (now) => {
        rafId = requestAnimationFrame(animate);
        const t = now - start;

        // FÁZE 1 — roztočení a brzdění na Nizozemsku
        const p = clamp01(t / SPIN_MS);
        earth.rotation.y = TARGET_Y - SPINS * 2 * Math.PI * (1 - easeOutQuart(p));
        // náklon na zeměpisnou šířku Amsterdamu (druhá půlka brzdění)
        const q = easeInOutCubic(clamp01((p - 0.55) / 0.45));
        earth.rotation.x = LAT * q;

        // tečka se objeví ke konci brzdění
        const dotIn = clamp01((p - 0.8) / 0.2);
        dotMat.opacity = dotIn;

        // FÁZE 2 — zoom na Amsterdam
        const z = easeInOutCubic(clamp01((t - SPIN_MS - ZOOM_DELAY) / ZOOM_MS));
        camera.position.z = CAM_FAR - (CAM_FAR - CAM_NEAR) * z;

        // FÁZE 3 — pulz tečky + jemná paralaxa myši
        if (z >= 1) {
          const s = 1 + 0.6 * (0.5 + 0.5 * Math.sin(now * 0.004));
          pulse.scale.setScalar(s * 1.8);
          pulseMat.opacity = 0.35 * (1 - (s - 1) / 0.6) * dotIn;
          cx += (mx - cx) * 0.05;
          cy += (my - cy) * 0.05;
          earth.rotation.y = TARGET_Y + cx * 0.12;
          earth.rotation.x = LAT + cy * 0.08;
        }

        renderer.render(scene, camera);
      };
      animate(start);

      canvasRef.current._cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        if (canvasRef.current) canvasRef.current.removeEventListener('click', onClick);
        cancelAnimationFrame(rafId);
        disposables.forEach((d) => d.dispose && d.dispose());
      };
    }).catch(() => { /* CDN nedostupné — logo se nezobrazí, appka běží dál */ });

    return () => {
      disposed = true;
      if (canvasRef.current && canvasRef.current._cleanup) canvasRef.current._cleanup();
    };
  }, [size, textureUrl]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: 'block', cursor: 'pointer' }}
      title="Klikni pro přehrání znovu"
    />
  );
}
