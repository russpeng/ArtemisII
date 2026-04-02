import * as THREE from 'three';

/**
 * Builds a Float32Array of target positions distributed along
 * a Catmull-Rom spline approximating the Artemis II ascent profile.
 *
 * Control points are in world space to match the camera frustum
 * (roughly -2.7 → 2.7 wide, -1.5 → 1.5 tall at 16:9).
 *
 * Launch → gravity turn → MECO → TLI burn (exits right)
 */
export function buildTrajectoryArc(particleCount) {
  const controlPoints = [
    new THREE.Vector3(-2.6, -1.1,  0.0),  // KSC launch pad
    new THREE.Vector3(-1.6, -0.15, 0.0),  // initial ascent / pitch program
    new THREE.Vector3(-0.2,  0.65, 0.0),  // max-Q / gravity turn
    new THREE.Vector3( 1.4,  0.75, 0.0),  // MECO / staging
    new THREE.Vector3( 3.2,  1.05, 0.0),  // TLI burn (exits right edge)
  ];

  const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5);

  const targets = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    // Power curve on t: more particles cluster at the tail (launch end),
    // thinning toward TLI — like an exhaust plume that dissipates.
    const t = Math.pow(i / particleCount, 0.75);

    const point   = curve.getPoint(t);
    const tangent = curve.getTangent(t);

    // Perpendicular vector for lateral spread (trail width)
    const perp = new THREE.Vector3(-tangent.y, tangent.x, 0.0);

    // Spread narrows toward the head of the arc
    const spreadRadius = (1.0 - t) * 0.06 + t * 0.02;
    const spread = (Math.random() - 0.5) * spreadRadius;

    targets[i * 3 + 0] = point.x + perp.x * spread;
    targets[i * 3 + 1] = point.y + perp.y * spread;
    targets[i * 3 + 2] = 0.0;
  }

  return targets;
}

/**
 * Returns the spline itself, useful for debug visualization.
 */
export function getArcCurve() {
  const controlPoints = [
    new THREE.Vector3(-2.6, -1.1,  0.0),
    new THREE.Vector3(-1.6, -0.15, 0.0),
    new THREE.Vector3(-0.2,  0.65, 0.0),
    new THREE.Vector3( 1.4,  0.75, 0.0),
    new THREE.Vector3( 3.2,  1.05, 0.0),
  ];
  return new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5);
}
