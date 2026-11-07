/**
 * Geometry for the dashboard's SVG charts (US-395).
 *
 * The agent Analytics page drew one area chart with recharts, and that one
 * chart pulled charts-vendor (402 KB minified, 107 KB gzip) onto the route: 57%
 * of everything /dashboard/analytics downloaded beyond the entry. These helpers
 * are what the chart actually needs — a y scale with round ticks, x positions,
 * and SVG paths — in a few hundred bytes, with no DOM, so they are unit-tested
 * directly.
 */

export interface ChartBox {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The plotting area inside the margins. Never negative. */
export function innerSize(box: ChartBox): { width: number; height: number } {
  return {
    width: Math.max(0, box.width - box.left - box.right),
    height: Math.max(0, box.height - box.top - box.bottom),
  };
}

/**
 * Round y-axis ticks from 0 to at least `max`, about `count` of them.
 *
 * The step is 1, 2, 2.5 or 5 times a power of ten, and never fractional for
 * counts: a views chart whose busiest day had 3 views reads 0,1,2,3 — not
 * 0, 0.75, 1.5. An all-zero series still gets an axis of 0 and 1, so the
 * chart does not collapse into a line at the top.
 */
export function niceTicks(max: number, count = 4): number[] {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
  if (safeMax === 0) return [0, 1];
  const rough = safeMax / Math.max(1, count);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const step =
    [1, 2, 2.5, 5, 10]
      .map((m) => m * magnitude)
      .find((s) => s >= rough && (s >= 1 || Number.isInteger(s))) ?? 10 * magnitude;
  const intStep = Math.max(1, step);
  const top = Math.ceil(safeMax / intStep) * intStep;
  const ticks: number[] = [];
  for (let v = 0; v <= top + intStep / 2; v += intStep) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Maps a value to a y coordinate inside the box, 0 at the bottom. */
export function yScale(box: ChartBox, max: number): (value: number) => number {
  const { height } = innerSize(box);
  const bottom = box.top + height;
  return (value) => (max > 0 ? bottom - (Math.max(0, value) / max) * height : bottom);
}

/**
 * The x coordinate of point `index` of `count`, for line and area charts:
 * the first point sits on the left edge and the last on the right. A single
 * point is centred.
 */
export function pointX(box: ChartBox, index: number, count: number): number {
  const { width } = innerSize(box);
  if (count <= 1) return box.left + width / 2;
  return box.left + (index / (count - 1)) * width;
}

/** The centre of band `index` of `count`, for bar charts. */
export function bandX(box: ChartBox, index: number, count: number): number {
  const { width } = innerSize(box);
  const band = width / Math.max(1, count);
  return box.left + band * index + band / 2;
}

/** Width of one band, for bar charts. */
export function bandWidth(box: ChartBox, count: number): number {
  return innerSize(box).width / Math.max(1, count);
}

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/** `M x y L x y ...` through the points. Empty for no points. */
export function linePath(points: Array<[number, number]>): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${fmt(x)} ${fmt(y)}`).join(' ');
}

/** The line closed down to `baseline`, for a filled area. */
export function areaPath(points: Array<[number, number]>, baseline: number): string {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath(points)} L${fmt(last[0])} ${fmt(baseline)} L${fmt(first[0])} ${fmt(baseline)} Z`;
}

/**
 * Which x labels to print so they do not overlap: every `step`-th, always
 * including the first and the last. `room` is the pixel width available per
 * label.
 */
export function labelIndices(count: number, innerWidth: number, room = 64): number[] {
  if (count <= 0) return [];
  const fit = Math.max(2, Math.floor(innerWidth / room));
  if (count <= fit) return Array.from({ length: count }, (_, i) => i);
  const step = Math.ceil((count - 1) / (fit - 1));
  const out: number[] = [];
  for (let i = 0; i < count - 1; i += step) out.push(i);
  // Drop the last regular label if it would crowd the final one.
  if (out.length > 1 && count - 1 - out[out.length - 1] < step / 2) out.pop();
  out.push(count - 1);
  return out;
}

/** The data index nearest to pixel `x`, for hover. */
export function nearestIndex(
  box: ChartBox,
  x: number,
  count: number,
  mode: 'point' | 'band'
): number {
  if (count <= 1) return 0;
  const { width } = innerSize(box);
  const rel = Math.min(Math.max(0, x - box.left), width);
  const i =
    mode === 'band'
      ? Math.floor(rel / (width / count))
      : Math.round((rel / Math.max(1, width)) * (count - 1));
  return Math.min(count - 1, Math.max(0, i));
}
