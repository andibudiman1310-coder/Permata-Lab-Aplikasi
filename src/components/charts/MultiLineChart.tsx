import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fmtID } from '../../data/labData';
import { buildSmoothSplinePaths, CHART_PALETTE, niceTicks, Point2D } from './chartUtils';

export interface MultiLineSeries {
  id: string;
  label: string;
  values: (number | null)[];
  color?: string;
  dashed?: boolean;
}

interface MultiLineChartProps {
  labels: string[];
  series: MultiLineSeries[];
  unit?: string;
  height?: number;
  yMin?: number;
  yMax?: number;
  digits?: number;
  referenceLines?: { value: number; label: string; color: string }[];
  onPointClick?: (seriesId: string, index: number) => void;
}

export function MultiLineChart({
  labels,
  series,
  unit = '',
  height = 280,
  yMin,
  yMax,
  digits = 0,
  referenceLines = [],
  onPointClick,
}: MultiLineChartProps) {
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({});
  const [isolatedId, setIsolatedId] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const visibleSeries = useMemo(
    () =>
      series.filter((s) => {
        if (isolatedId) return s.id === isolatedId;
        return !hiddenIds[s.id];
      }),
    [series, hiddenIds, isolatedId]
  );

  const W = 760;
  const H = height;
  const padL = 48;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const { ticks, minVal, maxVal, seriesGeometry } = useMemo(() => {
    const allVals: number[] = [];
    visibleSeries.forEach((s) =>
      s.values.forEach((v) => {
        if (v !== null && Number.isFinite(v)) allVals.push(v);
      })
    );
    referenceLines.forEach((r) => allVals.push(r.value));
    const rawMin = yMin !== undefined ? yMin : 0;
    const rawMax = yMax !== undefined ? yMax : Math.max(...allVals, rawMin + 5);
    const t = niceTicks(rawMax, 5, rawMin);
    const mn = yMin !== undefined ? yMin : t[0];
    const mx = yMax !== undefined ? yMax : t[t.length - 1] || mn + 10;

    const colW = plotW / Math.max(1, labels.length);
    const geom = visibleSeries.map((s, si) => {
      const color = s.color || CHART_PALETTE[si % CHART_PALETTE.length];
      const pts: (Point2D | null)[] = s.values.map((v, i) => {
        if (v === null || !Number.isFinite(v)) return null;
        const x = padL + colW * i + colW / 2;
        const y = padT + plotH - ((v - mn) / Math.max(0.0001, mx - mn)) * plotH;
        return { x, y };
      });
      const paths = buildSmoothSplinePaths(pts, 0.32);
      return { ...s, color, pts, paths };
    });

    return { ticks: t, minVal: mn, maxVal: mx, seriesGeometry: geom };
  }, [visibleSeries, labels.length, plotW, plotH, yMin, yMax, referenceLines]);

  const colW = plotW / Math.max(1, labels.length);

  const toggleSeries = (id: string) => {
    if (isolatedId === id) {
      setIsolatedId(null);
      return;
    }
    setHiddenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full select-none">
      {/* Interactive Legend Chips (click toggles, double-click isolates) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {series.map((s, idx) => {
            const color = s.color || CHART_PALETTE[idx % CHART_PALETTE.length];
            const isOff = isolatedId ? isolatedId !== s.id : Boolean(hiddenIds[s.id]);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSeries(s.id)}
                onDoubleClick={() => setIsolatedId((cur) => (cur === s.id ? null : s.id))}
                title="Klik untuk tampil/sembunyikan, klik ganda untuk fokus"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                  isOff
                    ? 'border-transparent text-[var(--ink-muted)] opacity-45 hover:opacity-80'
                    : 'border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-primary)]'
                }`}
              >
                <span
                  className="w-3 h-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: color,
                    borderBottom: s.dashed ? `2px dashed ${color}` : undefined,
                  }}
                />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
        {isolatedId && (
          <button
            type="button"
            onClick={() => setIsolatedId(null)}
            className="text-[11px] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
          >
            Tampilkan semua seri
          </button>
        )}
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto overflow-visible block"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Y-Axis Gridlines */}
          {ticks.map((t) => {
            const y = padT + plotH - ((t - minVal) / Math.max(0.0001, maxVal - minVal)) * plotH;
            if (y < padT - 4 || y > padT + plotH + 4) return null;
            return (
              <g key={`yt-${t}`}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-[var(--border-hairline)]"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <text
                  x={padL - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-[var(--ink-muted)] text-[10.5px] font-mono-num"
                >
                  {fmtID(t, digits)}
                  {unit}
                </text>
              </g>
            );
          })}

          {/* Reference Lines */}
          {referenceLines.map((rl) => {
            const y = padT + plotH - ((rl.value - minVal) / Math.max(0.0001, maxVal - minVal)) * plotH;
            if (y < padT - 4 || y > padT + plotH + 4) return null;
            return (
              <g key={rl.label}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke={rl.color}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                />
                <text
                  x={W - padR - 4}
                  y={y - 5}
                  textAnchor="end"
                  fill={rl.color}
                  className="text-[10px] font-semibold"
                >
                  {rl.label}
                </text>
              </g>
            );
          })}

          {/* Crosshair */}
          {hoverIdx !== null && labels[hoverIdx] !== undefined && (
            <line
              x1={padL + colW * hoverIdx + colW / 2}
              x2={padL + colW * hoverIdx + colW / 2}
              y1={padT}
              y2={padT + plotH}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.75}
            />
          )}

          {/* Lines & Points */}
          {seriesGeometry.map((sg) => (
            <g key={sg.id}>
              {sg.paths.map((d, pi) => (
                <motion.path
                  key={`${sg.id}-p-${pi}`}
                  d={d}
                  fill="none"
                  stroke={sg.color}
                  strokeWidth={2.4}
                  strokeDasharray={sg.dashed ? '6 4' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0.35 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
              {sg.pts.map((pt, i) => {
                if (!pt) return null;
                const isHov = hoverIdx === i;
                return (
                  <circle
                    key={`${sg.id}-pt-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isHov ? 5.2 : 3}
                    fill="var(--surface)"
                    stroke={sg.color}
                    strokeWidth={isHov ? 2.5 : 1.8}
                    className="transition-all duration-150"
                  />
                );
              })}
            </g>
          ))}

          {/* X-Axis Labels */}
          {labels.map((lbl, i) => {
            const cx = padL + colW * i + colW / 2;
            const step = labels.length > 16 ? 2 : 1;
            if (i % step !== 0 && i !== labels.length - 1 && hoverIdx !== i) return null;
            return (
              <text
                key={`mxl-${i}`}
                x={cx}
                y={H - 10}
                textAnchor="middle"
                className={`text-[10.5px] font-mono-num ${
                  hoverIdx === i ? 'fill-[var(--accent)] font-bold' : 'fill-[var(--ink-muted)]'
                }`}
              >
                {lbl}
              </text>
            );
          })}

          {/* Hover Columns */}
          {labels.map((_, i) => (
            <rect
              key={`mhit-${i}`}
              x={padL + colW * i}
              y={padT}
              width={colW}
              height={plotH + padB}
              fill="transparent"
              className={onPointClick ? 'cursor-pointer' : 'cursor-crosshair'}
              onMouseEnter={() => setHoverIdx(i)}
              onClick={() => {
                if (onPointClick && seriesGeometry[0]) onPointClick(seriesGeometry[0].id, i);
              }}
            />
          ))}
        </svg>

        {/* Multi-series Probe Tooltip */}
        <AnimatePresence>
          {hoverIdx !== null && labels[hoverIdx] !== undefined && (
            <motion.div
              key={`mtip-${hoverIdx}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              style={{
                left: `${Math.min(78, Math.max(22, ((padL + colW * hoverIdx + colW / 2) / W) * 100))}%`,
              }}
              className="pointer-events-none absolute top-1 -translate-x-1/2 z-20 min-w-[175px] rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)]/95 backdrop-blur-md px-3 py-2 shadow-lg text-xs"
            >
              <div className="font-semibold text-[var(--ink-primary)] mb-1 border-b border-[var(--border-hairline)] pb-1">
                {labels[hoverIdx]}
              </div>
              <div className="space-y-0.5">
                {seriesGeometry.map((sg) => {
                  const val = sg.values[hoverIdx];
                  return (
                    <div key={sg.id} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-[var(--ink-secondary)] truncate max-w-[125px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sg.color }} />
                        <span className="truncate">{sg.label}</span>
                      </span>
                      <span className="font-mono-num font-bold text-[var(--ink-primary)]">
                        {val == null ? '–' : `${fmtID(val, digits)}${unit}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
