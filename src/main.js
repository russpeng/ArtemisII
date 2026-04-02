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
// Orthographic camera driven by a fixed WORLD WIDTH so the text always fits
// horizontally regardless of portrait/landscape or screen size.
// worldWidth=4.8 (letterSampler) fits comfortably inside FRUSTUM_WIDTH=6.
const scene = new THREE.Scene();
const FRUSTUM_WIDTH = 6.0;

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.z = 10;

// ── Particles ────────────────────────────────────────────────────────────────
const { points, material } = createParticleSystem();
scene.add(points);

// ── Scroll driver ────────────────────────────────────────────────────────────
const { update: updateScroll } = createScrollDriver(material);

// ── Pointer tracking → u_mouse (mouse + touch) ──────────────────────────────
const mouse = new THREE.Vector2(9999, 9999);

const toWorld = (clientX, clientY) => {
  const ndcX =  (clientX / window.innerWidth)  * 2 - 1;
  const ndcY = -(clientY / window.innerHeight) * 2 + 1;
  const halfW = FRUSTUM_WIDTH / 2;
  const halfH = FRUSTUM_WIDTH / (2 * (window.innerWidth / window.innerHeight));
  return new THREE.Vector2(ndcX * halfW, ndcY * halfH);
};

window.addEventListener('mousemove', (e) => {
  material.uniforms.u_mouse.value.copy(toWorld(e.clientX, e.clientY));
}, { passive: true });

window.addEventListener('mouseleave', () => {
  material.uniforms.u_mouse.value.set(9999, 9999);
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  material.uniforms.u_mouse.value.copy(toWorld(t.clientX, t.clientY));
}, { passive: true });

window.addEventListener('touchend', () => {
  material.uniforms.u_mouse.value.set(9999, 9999);
}, { passive: true });

// ── Resize ───────────────────────────────────────────────────────────────────
const onResize = () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;

  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const halfW = FRUSTUM_WIDTH / 2;
  const halfH = FRUSTUM_WIDTH / (2 * aspect);

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
