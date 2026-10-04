// Local template matching for practice, not an OCR confidence or calligraphy grade.
export interface Point {
  x: number;
  y: number;
}
export type Strokes = Point[][];
export interface Mask {
  points: Point[];
  ratio: number;
  density: number;
}
export interface Assessment {
  score: number;
  correct: boolean;
  status: 'match' | 'different' | 'uncertain';
  feedback: string;
}
const SIZE = 40;
export function maskFromAlpha(alpha: ArrayLike<number>, width: number, height: number): Mask {
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (alpha[y * width + x] > 70) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  if (right < left) return { points: [], ratio: 1, density: 0 };
  const w = right - left + 1,
    h = bottom - top + 1,
    scale = (SIZE - 4) / Math.max(w, h);
  const occupied = new Set<number>();
  for (let y = top; y <= bottom; y++)
    for (let x = left; x <= right; x++)
      if (alpha[y * width + x] > 70) {
        const px = Math.round((x - left) * scale + (SIZE - w * scale) / 2),
          py = Math.round((y - top) * scale + (SIZE - h * scale) / 2);
        occupied.add(py * SIZE + px);
      }
  return {
    points: [...occupied].map((v) => ({ x: v % SIZE, y: Math.floor(v / SIZE) })),
    ratio: w / h,
    density: occupied.size / (w * h * scale * scale),
  };
}
const fields = new WeakMap<Mask, Float32Array>();
function distanceField(mask: Mask): Float32Array {
  const cached = fields.get(mask);
  if (cached) return cached;
  const field = new Float32Array(SIZE * SIZE).fill(9);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      let d = 9;
      for (const p of mask.points) d = Math.min(d, Math.hypot(x - p.x, y - p.y));
      field[y * SIZE + x] = d;
    }
  fields.set(mask, field);
  return field;
}
const distance = (a: Mask, b: Mask) => {
  const field = distanceField(b);
  return a.points.reduce((sum, p) => sum + field[p.y * SIZE + p.x], 0) / a.points.length;
};
export function similarity(a: Mask, b: Mask): number {
  if (!a.points.length || !b.points.length) return 0;
  const shape = (distance(a, b) + distance(b, a)) / 2;
  const ratio = Math.min(1, Math.abs(Math.log(a.ratio / b.ratio)));
  const excess = Math.max(0, a.density - b.density - 0.12);
  return Math.max(0, Math.round(100 - shape * 14 - ratio * 14 - excess * 80));
}
export function assess(
  input: Mask,
  target: Mask,
  alternatives: { id: string; mask: Mask }[],
  targetID: string,
): Assessment {
  const score = similarity(input, target);
  const other = Math.max(
    0,
    ...alternatives.filter((a) => a.id !== targetID).map((a) => similarity(input, a.mask)),
  );
  if (!input.points.length)
    return {
      score: 0,
      correct: false,
      status: 'uncertain',
      feedback: '还没有写下字形，请先书写。',
    };
  if (score >= 78 && score - other >= 4)
    return {
      score,
      correct: true,
      status: 'match',
      feedback: '字形与范字较接近。可叠加对照，继续留意比例与转折。',
    };
  if (score < 50 || other > score + 10)
    return {
      score,
      correct: false,
      status: 'different',
      feedback: '与目标范字差异较大。请检查是否写成其他字母，或遗漏了笔画。',
    };
  return {
    score,
    correct: false,
    status: 'uncertain',
    feedback: '暂时无法可靠判断。请对照范字重写；合理的手写变体也可能出现这种情况。',
  };
}
