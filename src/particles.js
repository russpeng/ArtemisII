import * as THREE from 'three';
import vertexShader   from './shaders/particle.vert?raw';
import fragmentShader from './shaders/particle.frag?raw';
import { sampleLetterforms } from './letterSampler.js';
import { buildTrajectoryArc } from './arc.js';

export function createParticleSystem() {
  // ── 1. Sample letterforms → origin positions ────────────────────────────
  const origins = sampleLetterforms('ARTEMIS II', {
    fontSize:     130,
    canvasWidth:  1200,
    canvasHeight: 280,
    sampleStep:   4,
    worldWidth:   4.8,
    worldHeight:  0.75,
  });

  const particleCount = origins.length / 3;
  console.log(`Particle count: ${particleCount}`);

  // ── 2. Build arc target positions ───────────────────────────────────────
  // Sort particles left-to-right so particles at the left side of the text
  // (near the "launch" end of the arc) map to the tail of the arc.
  // This creates a coherent directional flow rather than random scatter.
  const sortedIndices = Array.from({ length: particleCount }, (_, i) => i);
  sortedIndices.sort((a, b) => origins[a * 3] - origins[b * 3]);

  const sortedOrigins = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const src = sortedIndices[i];
    sortedOrigins[i * 3 + 0] = origins[src * 3 + 0];
    sortedOrigins[i * 3 + 1] = origins[src * 3 + 1];
    sortedOrigins[i * 3 + 2] = origins[src * 3 + 2];
  }

  const targets = buildTrajectoryArc(particleCount);

  // ── 3. Per-particle ids (used for staggered delay noise in shader) ──────
  const ids = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) ids[i] = i;

  // ── 4. Build BufferGeometry ─────────────────────────────────────────────
  const geometry = new THREE.BufferGeometry();

  // `position` is required by Three.js internally; set to origins so the
  // bounding sphere is computed correctly. The shader overrides it via
  // a_origin / a_target — `position` isn't used in vertex logic.
  geometry.setAttribute('position', new THREE.BufferAttribute(sortedOrigins.slice(), 3));
  geometry.setAttribute('a_origin', new THREE.BufferAttribute(sortedOrigins, 3));
  geometry.setAttribute('a_target', new THREE.BufferAttribute(targets, 3));
  geometry.setAttribute('a_id',     new THREE.BufferAttribute(ids, 1));

  // ── 5. ShaderMaterial ───────────────────────────────────────────────────
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      u_progress:   { value: 0.0 },
      u_time:       { value: 0.0 },
      u_ignition:   { value: 1.0 },               // scale of chaos burst; tweak freely
      u_pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      u_mouse:      { value: new THREE.Vector2(9999, 9999) }, // offscreen default
    },
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending, // glow stacking
  });

  const points = new THREE.Points(geometry, material);
  return { points, material, particleCount };
}
