varying vec3 v_color;
varying float v_alpha;

void main() {
  // gl_PointCoord is (0,0)→(1,1) across the point sprite.
  // Map to (-0.5, 0.5) centered, compute radial distance.
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);

  // Hard circular clip with a soft antialiased edge
  float alpha = 1.0 - smoothstep(0.35, 0.5, d);

  // Soft glow: brightest at center, falls off toward edge
  float glow = pow(1.0 - smoothstep(0.0, 0.5, d), 2.0);

  vec3 color = v_color + glow * v_color * 0.35;

  gl_FragColor = vec4(color, alpha * v_alpha);
}
