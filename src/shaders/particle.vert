// Three.js ShaderMaterial auto-injects: projectionMatrix, modelViewMatrix, position

uniform float u_progress;
uniform float u_time;
uniform float u_ignition;
uniform float u_pixelRatio;
uniform vec2 u_mouse;

attribute vec3 a_origin;
attribute vec3 a_target;
attribute float a_id;

varying vec3 v_color;
varying float v_alpha;

// ── Noise utilities ──────────────────────────────────────────────────────────

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Smooth value noise in 2D
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash2(i);
  float b = hash2(i + vec2(1.0, 0.0));
  float c = hash2(i + vec2(0.0, 1.0));
  float d = hash2(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian Motion — 4 octaves
float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = p * 2.1 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return v;
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
  // Each particle has a unique phase delay so they don't all move at once.
  // Particles with lower ids (roughly left-to-right) break formation first.
  float delay = hash(a_id) * 0.25;
  float localProgress = smoothstep(delay, 1.0, u_progress);

  // ── Base position: lerp from letterform origin to arc target ──
  vec3 pos = mix(a_origin, a_target, localProgress);

  // ── Ignition turbulence ───────────────────────────────────────
  // The chaos peaks around u_progress ≈ 0.2–0.4 (ignition window)
  // then resolves as particles lock onto the arc.
  float ignitionWindow = smoothstep(0.0, 0.25, u_progress)
                       * (1.0 - smoothstep(0.25, 0.65, u_progress));
  float turbStrength = ignitionWindow * u_ignition;

  vec2 noiseCoord = vec2(a_id * 0.07, u_time * 0.4);
  vec2 turbOffset = vec2(
    fbm(noiseCoord)             - 0.5,
    fbm(noiseCoord + vec2(5.2)) - 0.5
  ) * turbStrength * 1.2;

  pos.xy += turbOffset;

  // ── Mouse repulsion (subtle, local) ──────────────────────────
  vec2 toMouse = pos.xy - u_mouse;
  float mouseDist = length(toMouse);
  float mouseRepel = smoothstep(0.5, 0.0, mouseDist) * 0.12;
  pos.xy += normalize(toMouse + vec2(0.001)) * mouseRepel;

  // ── Point size ───────────────────────────────────────────────
  // Velocity proxy: particles stretch during the transition.
  float displacement = length(a_target.xy - a_origin.xy);
  float velocityFactor = displacement * localProgress * (1.0 - localProgress) * 4.0;
  float turbBoost = turbStrength * 2.0;

  float baseSize = mix(1.8, 1.2, localProgress);
  gl_PointSize = (baseSize + velocityFactor * 2.5 + turbBoost) * u_pixelRatio;

  // ── Color ramp ───────────────────────────────────────────────
  // Formation:  cool near-white (typographic)
  // Ignition:   hot orange-white (combustion)
  // Arc:        deep-space blue-violet (momentum resolved)

  vec3 colorFormation = vec3(0.82, 0.82, 0.84);
  vec3 colorIgnition  = vec3(1.0, 0.55, 0.12);
  vec3 colorArc       = vec3(0.38, 0.58, 1.0);

  // Two-stage blend: formation→ignition, then ignition→arc
  float colorStage1 = smoothstep(0.0, 0.4, u_progress);  // formation→ignition
  float colorStage2 = smoothstep(0.35, 0.85, u_progress); // ignition→arc

  vec3 color = mix(colorFormation, colorIgnition, colorStage1);
  color = mix(color, colorArc, colorStage2);

  // Hot white flash at peak ignition
  float flash = ignitionWindow * turbStrength * 0.6;
  color = mix(color, vec3(1.0), flash);

  v_color = color;

  // ── Alpha ────────────────────────────────────────────────────
  // Particles at the "tail" of the arc fade slightly (exhaust dissipation)
  float arcT = float(a_id) / 5000.0; // approx normalized id
  float tailFade = mix(1.0, 0.45, smoothstep(0.6, 1.0, u_progress) * (1.0 - arcT));
  v_alpha = tailFade;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
