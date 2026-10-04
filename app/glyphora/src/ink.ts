import type { Point, Strokes } from './scoring';
function segmentDistance(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length
    ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length))
    : 0;
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}
// Erase entire strokes, including sparsely sampled lines between their points.
export function eraseAt(strokes: Strokes, point: Point, radius = 0.035): Strokes {
  return strokes.filter(
    (stroke) =>
      !stroke.some((p, i) => segmentDistance(point, stroke[Math.max(0, i - 1)], p) <= radius),
  );
}
export const copyStrokes = (strokes: Strokes): Strokes =>
  strokes.map((stroke) => stroke.map((p) => ({ ...p })));
