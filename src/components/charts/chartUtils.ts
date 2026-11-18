export interface Point2D {
  x: number;
  y: number;
}

/**
 * Generates a smooth Catmull-Rom-to-Cubic-Bezier SVG path across non-null points.
 * Splits into disjoint segments if null gaps exist.
 */
export function buildSmoothSplinePaths(points: (Point2D | null)[], tension = 0.32): string[] {
  const segments: Point2D[][] = [];
  let current: Point2D[] = [];
  for (const pt of points) {
    if (pt) {
      current.push(pt);
    } else if (current.length) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length) segments.push(current);

  return segments.map((pts) => {
    if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    if (pts.length === 2) {
      return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)} ${pts[1].y.toFixed(2)}`;
    }
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) * (tension / 2);
      const cp1y = p1.y + (p2.y - p0.y) * (tension / 2);
      const cp2x = p2.x - (p3.x - p1.x) * (tension / 2);
      const cp2y = p2.y - (p3.y - p1.y) * (tension / 2);

      // Clamp control Y inside sensible bounds near segment extremes to prevent overshoot loops
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      const safeCp1y = Math.max(minY - Math.abs(p2.y - p1.y) * 0.2, Math.min(maxY + Math.abs(p2.y - p1.y) * 0.2, cp1y));
      const safeCp2y = Math.max(minY - Math.abs(p2.y - p1.y) * 0.2, Math.min(maxY + Math.abs(p2.y - p1.y) * 0.2, cp2y));

      d += ` C ${cp1x.toFixed(2)} ${safeCp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${safeCp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  });
}

export function buildSmoothAreaPath(pts: Point2D[], baselineY: number, tension = 0.32): string {
  if (!pts.length) return '';
  if (pts.length === 1) {
    return `M ${pts[0].x.toFixed(2)} ${baselineY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
  }
  const linePaths = buildSmoothSplinePaths(pts, tension);
  if (!linePaths.length) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${linePaths[0]} L ${last.x.toFixed(2)} ${baselineY.toFixed(2)} L ${first.x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
}

export function niceTicks(maxVal: number, count = 5, minVal = 0): number[] {
  if (maxVal <= minVal) return [minVal, minVal + 1];
  const range = maxVal - minVal;
  const roughStep = range / Math.max(1, count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const norm = roughStep / mag;
  let step: number;
  if (norm <= 1) step = 1 * mag;
  else if (norm <= 2) step = 2 * mag;
  else if (norm <= 2.5) step = 2.5 * mag;
  else if (norm <= 5) step = 5 * mag;
  else step = 10 * mag;

  const start = Math.floor(minVal / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= maxVal + step * 0.999; v += step) {
    ticks.push(Number(v.toFixed(4)));
    if (ticks.length > 12) break;
  }
  return ticks;
}

export const CHART_PALETTE = [
  '#1668e3', // clinical blue
  '#0d9488', // teal
  '#d97706', // amber
  '#7c3aed', // violet
  '#e11d48', // rose
  '#0284c7', // sky
  '#16a34a', // emerald
  '#ea580c', // orange
];
