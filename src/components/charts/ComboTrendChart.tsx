import { useId, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fmtID } from '../../data/labData';
import { buildSmoothAreaPath, buildSmoothSplinePaths, niceTicks, Point2D } from './chartUtils';

export interface ComboTrendChartProps {
  labels: string[];
  barValues: number[];
  lineValues?: number[];
  barLabel?: string;
  lineLabel?: string;
  barColor?: string;
  lineColor?: string;
  barColors?: string[];
  unit?: string;
  height?: number;
  selectedIndex?: number | null;
  onSelectIndex?: (idx: number) => void;
  showModeToggle?: boolean;
  defaultMode?: 'combo' | 'bar' | 'line';
  yAxisMax?: number;
  referenceLines?: { value: number; label: string; color: string }[];
  secondaryAxis?: boolean;
}

export function ComboTrendChart({
  labels,
  barValues,
  lineValues,
  barLabel = 'Pemeriksaan',
  lineLabel = 'Kunjungan',
  barColor = '#1668e3',
  lineColor = '#0d9488',
  barColors,
  unit = '',
  height = 290,
  selectedIndex = null,
  onSelectIndex,
  showModeToggle = true,
  defaultMode = 'combo',
  yAxisMax,
  referenceLines = [],
  secondaryAxis = false,
}: ComboTrendChartProps) {
  const uid = useId().replace(/:/g, '');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<'combo' | 'bar' | 'line'>(defaultMode);
  const [showBar, setShowBar] = useState(true);
  const [showLine, setShowLine] = useState(Boolean(lineValues?.length));

  const effectiveBar = mode !== 'line' && showBar;
  const effectiveLine = Boolean(lineValues?.length) && mode !== 'bar' && showLine;

  const W = 760;
  const H = height;
  const padL = 52;
  const padR = secondaryAxis && effectiveLine ? 52 : 20;
  const padT = 22;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const { leftTicks, leftMax, rightTicks, rightMax, barPts, linePts } = useMemo(() => {
    const n = Math.max(1, labels.length);
    const maxB = effectiveBar ? Math.max(...barValues, 0) : 0;
    const maxL = !secondaryAxis && effectiveLine && lineValues ? Math.max(...lineValues, 0) : 0;
    const refMax = referenceLines.length ? Math.max(...referenceLines.map((r) => r.value)) : 0;
    const rawLMax = yAxisMax ?? Math.max(maxB, maxL, refMax, 10);
    const lt = niceTicks(rawLMax, 5, 0);
    const lMax = lt[lt.length - 1] || 10;

    let rt: number[] = [0, 10];
    let rMax = 10;
    if (secondaryAxis && lineValues?.length) {
      const rawR = Math.max(...lineValues, 5);
      rt = niceTicks(rawR, 5, 0);
      rMax = rt[rt.length - 1] || 10;
    }

    const colW = plotW / n;
    const bPts: Point2D[] = labels.map((_, i) => {
      const cx = padL + colW * i + colW / 2;
      const val = barValues[i] || 0;
      const y = padT + plotH - (val / lMax) * plotH;
      return { x: cx, y };
    });

    const lPts: Point2D[] = (lineValues || []).map((v, i) => {
      const cx = padL + colW * i + colW / 2;
      const denom = secondaryAxis ? rMax : lMax;
      const y = padT + plotH - ((v || 0) / denom) * plotH;
      return { x: cx, y };
    });

    return { leftTicks: lt, leftMax: lMax, rightTicks: rt, rightMax: rMax, barPts: bPts, linePts: lPts };
  }, [labels, barValues, lineValues, effectiveBar, effectiveLine, secondaryAxis, yAxisMax, referenceLines, plotW, plotH]);

  const colW = plotW / Math.max(1, labels.length);
  const barW = Math.min(34, Math.max(8, colW * 0.54));

  const splinePath = useMemo(() => {
    if (!effectiveLine || !linePts.length) return '';
    return buildSmoothSplinePaths(linePts, 0.34)[0] || '';
  }, [effectiveLine, linePts]);

  const areaPath = useMemo(() => {
    if (!effectiveLine || !linePts.length) return '';
    return buildSmoothAreaPath(linePts, padT + plotH, 0.34);
  }, [effectiveLine, linePts, plotH]);

  const activeIdx = hoverIdx ?? selectedIndex;

  return (
    <div className="w-full select-none">
      {/* Top interactive bar: series legend toggles & mode switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBar((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              showBar && mode !== 'line'
                ? 'border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-primary)]'
                : 'border-transparent text-[var(--ink-muted)] opacity-55 hover:opacity-85'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: barColor }} />
            <span>{barLabel}</span>
          </button>
          {lineValues && lineValues.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLine((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                showLine && mode !== 'bar'
                  ? 'border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-primary)]'
                  : 'border-transparent text-[var(--ink-muted)] opacity-55 hover:opacity-85'
              }`}
            >
              <span className="w-3 h-0.5 rounded-full shrink-0" style={{ backgroundColor: lineColor }} />
              <span>{lineLabel}</span>
            </button>
          )}
        </div>

        {showModeToggle && lineValues && lineValues.length > 0 && (
          <div className="inline-flex rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] p-0.5 text-[11px] font-semibold">
            {(['combo', 'bar', 'line'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {m === 'combo' ? 'Kombo' : m === 'bar' ? 'Batang' : 'Tren'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Responsive SVG Canvas + Hover Tooltip */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto overflow-visible block"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id={`bar-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barColor} stopOpacity="0.96" />
              <stop offset="100%" stopColor={barColor} stopOpacity="0.72" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Left Y-Axis */}
          {leftTicks.map((t) => {
            const y = padT + plotH - (t / leftMax) * plotH;
            return (
              <g key={`lt-${t}`}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-[var(--border-hairline)]"
                  strokeDasharray={t === 0 ? undefined : '3 3'}
                  strokeWidth={t === 0 ? 1.2 : 1}
                />
                <text
                  x={padL - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-[var(--ink-muted)] text-[10.5px] font-mono-num"
                >
                  {fmtID(t)}
                  {unit}
                </text>
              </g>
            );
          })}

          {/* Secondary Right Y-Axis */}
          {secondaryAxis &&
            effectiveLine &&
            rightTicks.map((t) => {
              const y = padT + plotH - (t / rightMax) * plotH;
              return (
                <text
                  key={`rt-${t}`}
                  x={W - padR + 8}
                  y={y + 3.5}
                  textAnchor="start"
                  className="text-[10.5px] font-mono-num"
                  fill={lineColor}
                >
                  {fmtID(t)}
                </text>
              );
            })}

          {/* Threshold / Target Reference Lines */}
          {referenceLines.map((rl) => {
            const y = padT + plotH - (rl.value / leftMax) * plotH;
            if (y < padT - 5 || y > padT + plotH + 5) return null;
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

          {/* Vertical Hover Crosshair Band */}
          {hoverIdx !== null && labels[hoverIdx] !== undefined && (
            <line
              x1={padL + colW * hoverIdx + colW / 2}
              x2={padL + colW * hoverIdx + colW / 2}
              y1={padT}
              y2={padT + plotH}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.7}
            />
          )}

          {/* Bars */}
          {effectiveBar &&
            barPts.map((pt, i) => {
              const bH = Math.max(0, padT + plotH - pt.y);
              const isSelected = selectedIndex === i;
              const isHover = hoverIdx === i;
              const customColor = barColors?.[i];
              return (
                <g key={`b-${labels[i]}-${i}`}>
                  <motion.rect
                    x={pt.x - barW / 2}
                    y={pt.y}
                    width={barW}
                    height={bH}
                    rx={Math.min(6, barW / 3)}
                    fill={customColor || `url(#bar-${uid})`}
                    initial={{ scaleY: 0, opacity: 0.35 }}
                    animate={{
                      scaleY: 1,
                      opacity: activeIdx !== null && !isHover && !isSelected ? 0.45 : 1,
                    }}
                    transition={{
                      scaleY: { duration: 0.48, delay: Math.min(i * 0.025, 0.35), ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 0.16 },
                    }}
                    style={{ transformOrigin: `${pt.x}px ${padT + plotH}px` }}
                    stroke={isSelected ? 'var(--ink-primary)' : 'none'}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                </g>
              );
            })}

          {/* Area & Smooth Spline Line */}
          {effectiveLine && areaPath && (
            <motion.path
              d={areaPath}
              fill={`url(#area-${uid})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45 }}
            />
          )}
          {effectiveLine && splinePath && (
            <motion.path
              d={splinePath}
              fill="none"
              stroke={lineColor}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            />
          )}

          {/* Active Dots on Line */}
          {effectiveLine &&
            linePts.map((pt, i) => {
              const isFocused = hoverIdx === i || selectedIndex === i;
              return (
                <circle
                  key={`ld-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={isFocused ? 5.5 : 3.2}
                  fill="var(--surface)"
                  stroke={lineColor}
                  strokeWidth={isFocused ? 2.5 : 2}
                  className="transition-all duration-150"
                />
              );
            })}

          {/* X-Axis Labels */}
          {labels.map((lbl, i) => {
            const cx = padL + colW * i + colW / 2;
            const showEvery = labels.length > 20 ? 3 : labels.length > 14 ? 2 : 1;
            const shouldShow = i % showEvery === 0 || i === labels.length - 1 || hoverIdx === i || selectedIndex === i;
            if (!shouldShow) return null;
            const isSel = selectedIndex === i || hoverIdx === i;
            return (
              <text
                key={`xl-${i}`}
                x={cx}
                y={H - 10}
                textAnchor="middle"
                className={`text-[10.5px] font-mono-num ${
                  isSel ? 'fill-[var(--accent)] font-bold' : 'fill-[var(--ink-muted)]'
                }`}
              >
                {lbl}
              </text>
            );
          })}

          {/* Invisible Full-Column Interactive Hit Targets */}
          {labels.map((_, i) => (
            <rect
              key={`hit-${i}`}
              x={padL + colW * i}
              y={padT}
              width={colW}
              height={plotH + padB}
              fill="transparent"
              className={onSelectIndex ? 'cursor-pointer' : 'cursor-crosshair'}
              onMouseEnter={() => setHoverIdx(i)}
              onClick={() => onSelectIndex?.(i)}
            />
          ))}
        </svg>

        {/* Floating Probe Tooltip */}
        <AnimatePresence>
          {hoverIdx !== null && labels[hoverIdx] !== undefined && (
            <motion.div
              key={`tip-${hoverIdx}`}
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.14 }}
              style={{
                left: `${Math.min(82, Math.max(18, ((padL + colW * hoverIdx + colW / 2) / W) * 100))}%`,
              }}
              className="pointer-events-none absolute top-1 -translate-x-1/2 z-20 min-w-[155px] rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)]/95 backdrop-blur-md px-3 py-2 shadow-lg text-xs"
            >
              <div className="font-semibold text-[var(--ink-primary)] mb-1 flex items-center justify-between gap-3">
                <span>{labels[hoverIdx]}</span>
                {onSelectIndex && (
                  <span className="text-[10px] text-[var(--accent)] font-medium">Klik pilih</span>
                )}
              </div>
              {effectiveBar && (
                <div className="flex items-center justify-between gap-3 text-[var(--ink-secondary)]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: barColors?.[hoverIdx] || barColor }} />
                    {barLabel}
                  </span>
                  <span className="font-mono-num font-bold text-[var(--ink-primary)]">
                    {fmtID(barValues[hoverIdx] ?? 0)}
                    {unit}
                  </span>
                </div>
              )}
              {effectiveLine && lineValues && (
                <div className="flex items-center justify-between gap-3 text-[var(--ink-secondary)] mt-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: lineColor }} />
                    {lineLabel}
                  </span>
                  <span className="font-mono-num font-bold text-[var(--ink-primary)]">
                    {fmtID(lineValues[hoverIdx] ?? 0)}
                    {secondaryAxis ? '' : unit}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
