import { fontFor, type Glyph } from './curriculum';
import { maskFromAlpha, type Strokes } from './scoring';
const cache = new Map<string, HTMLCanvasElement>();
export async function loadFonts() {
  const result = await Promise.all([
    document.fonts.load('100px Bad Script', 'д'),
    document.fonts.load('100px Playpen Sans', 'α'),
  ]);
  if (result.some((r) => !r.length)) throw new Error('范字加载失败，请重新打开。');
}
export function template(g: Glyph): HTMLCanvasElement {
  if (cache.has(g.id)) return cache.get(g.id)!;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#304e3e';
  ctx.strokeStyle = '#304e3e';
  if (g.paths) {
    ctx.scale(256 / 109, 256 / 109);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    g.paths.forEach((p) => ctx.stroke(new Path2D(p)));
  } else {
    let size = 170;
    ctx.font = `${size}px ${fontFor(g)}`;
    let m = ctx.measureText(g.text);
    const extent = Math.max(
      m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
    );
    if (extent > 224) {
      size *= 224 / extent;
      ctx.font = `${size}px ${fontFor(g)}`;
      m = ctx.measureText(g.text);
    }
    const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    ctx.fillText(
      g.text,
      (256 - width) / 2 + m.actualBoundingBoxLeft,
      (256 - height) / 2 + m.actualBoundingBoxAscent,
    );
  }
  cache.set(g.id, canvas);
  return canvas;
}
export function raster(strokes: Strokes): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.strokeStyle = '#304e3e';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x * 256, stroke[0].y * 256);
    for (const p of stroke.slice(1)) ctx.lineTo(p.x * 256, p.y * 256);
    if (stroke.length === 1) ctx.lineTo(stroke[0].x * 256 + 0.1, stroke[0].y * 256);
    ctx.stroke();
  }
  return canvas;
}
export function mask(canvas: HTMLCanvasElement) {
  const image = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
  const alpha = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = image.data[i * 4 + 3];
  return maskFromAlpha(alpha, canvas.width, canvas.height);
}
