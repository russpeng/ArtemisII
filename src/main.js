import * as THREE from 'three';
import { createParticleSystem } from './particles.js';
import { createScrollDriver }   from './scroll.js';

// ── Renderer ────────────────────────────────────────────────────────────────
const canvas = document.querySelector('#canvas');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x080808, 1);

// ── Scene + Camera ───────────────────────────────────────────────────────────
// Orthographic camera — preserves the typographic scale of the letterforms.
// The frustum is recalculated on resize to maintain a consistent world height.
const scene  = new THREE.Scene();
const FRUSTUM_HEIGHT = 3.0;

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.z = 10;

// ── Particles ────────────────────────────────────────────────────────────────
const { points, material } = createParticleSystem();
scene.add(points);

// ── Scroll driver ────────────────────────────────────────────────────────────
const { update: updateScroll } = createScrollDriver(material);

// ── Mouse tracking → u_mouse ─────────────────────────────────────────────────
// Convert mouse from screen-px to world-space coordinates so the shader
// can compute a distance from each particle to the cursor.
const mouse = new THREE.Vector2(9999, 9999);

window.addEventListener('mousemove', (e) => {
  // NDC: -1 → 1
  const ndcX =  (e.clientX / window.innerWidth)  * 2 - 1;
  const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

  // World space (ortho): multiply NDC by half-frustum extents
  const halfW = (FRUSTUM_HEIGHT * (window.innerWidth / window.innerHeight)) / 2;
  const halfH = FRUSTUM_HEIGHT / 2;

  mouse.set(ndcX * halfW, ndcY * halfH);
  material.uniforms.u_mouse.value.copy(mouse);
}, { passive: true });

// Reset on leave so repulsion doesn't stick to an edge
window.addEventListener('mouseleave', () => {
  material.uniforms.u_mouse.value.set(9999, 9999);
}, { passive: true });

// ── Resize ───────────────────────────────────────────────────────────────────
const onResize = () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;

  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const halfH = FRUSTUM_HEIGHT / 2;
  const halfW = (FRUSTUM_HEIGHT * aspect) / 2;

  camera.left   = -halfW;
  camera.right  =  halfW;
  camera.top    =  halfH;
  camera.bottom = -halfH;
  camera.updateProjectionMatrix();

  material.uniforms.u_pixelRatio.value = Math.min(window.devicePixelRatio, 2);
};

window.addEventListener('resize', onResize);
onResize(); // call immediately to size camera correctly

// ── Render loop ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

const tick = () => {
  material.uniforms.u_time.value = clock.getElapsedTime();
  updateScroll();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
};

requestAnimationFrame(tick);
