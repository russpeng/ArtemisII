/**
 * Samples a string as a point cloud in world space.
 * Renders text to an offscreen canvas, reads pixel data,
 * and returns a Float32Array of (x, y, z) positions for every
 * sampled pixel that falls within a glyph.
 */
export function sampleLetterforms(text, options = {}) {
  const {
    fontSize    = 130,
    fontFamily  = '"Arial Black", "Helvetica Neue", Arial, sans-serif',
    canvasWidth = 1200,
    canvasHeight = 280,
    sampleStep  = 4,   // pixels between samples (lower = denser)
    worldWidth  = 4.8, // world-space width the canvas maps to
    worldHeight = 0.75,// world-space height
  } = options;

  // Offscreen canvas — not added to DOM
  const canvas = document.createElement('canvas');
  canvas.width  = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // Black background, white letterforms
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${fontSize}px ${fontFamily}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

  // Read pixel buffer
  const { data } = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

  const positions = [];

  for (let y = 0; y < canvasHeight; y += sampleStep) {
    for (let x = 0; x < canvasWidth; x += sampleStep) {
      const idx = (y * canvasWidth + x) * 4;
      // Red channel — white pixel = inside glyph
      if (data[idx] > 128) {
        // Map [0, canvasWidth]  → [-worldWidth/2,  worldWidth/2]
        // Map [0, canvasHeight] → [ worldHeight/2, -worldHeight/2]  (flip Y)
        const wx = (x / canvasWidth  - 0.5) * worldWidth;
        const wy = (y / canvasHeight - 0.5) * -worldHeight;
        positions.push(wx, wy, 0.0);
      }
    }
  }

  return new Float32Array(positions);
}
