import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { fmtID } from '../../data/labData';
import { CHART_PALETTE } from './chartUtils';

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

interface InteractiveDonutChartProps {
  slices: DonutSlice[];
  centerLabel?: string;
  unit?: string;
  size?: number;
  selectedLabel?: string | null;
  onSelectSlice?: (label: string) => void;
}

export function InteractiveDonutChart({
  slices,
  centerLabel = 'Total',
  unit = '',
  size = 210,
  selectedLabel = null,
  onSelectSlice,
}: InteractiveDonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const cleanSlices = useMemo(
    () =>
      slices
        .filter((s) => s.value > 0)
        .map((s, idx) => ({
          ...s,
          color: s.color || CHART_PALETTE[idx % CHART_PALETTE.length],
        })),
    [slices]
  );

  const total = useMemo(() => cleanSlices.reduce((a, b) => a + b.value, 0), [cleanSlices]);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const strokeW = size * 0.145;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const arcs = cleanSlices.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const len = frac * circumference;
    const dashOffset = -cumulativeOffset;
    cumulativeOffset += len;
    return {
      ...s,
      frac,
      pct: Math.round(frac * 1000) / 10,
      len,
      dashOffset,
    };
  });

  const activeIdx =
    hoveredIdx !== null
      ? hoveredIdx
      : selectedLabel
      ? arcs.findIndex((a) => a.label === selectedLabel)
      : -1;
  const activeArc = activeIdx >= 0 ? arcs[activeIdx] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
      {/* SVG Ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90 overflow-visible">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--surface-muted)"
            strokeWidth={strokeW}
          />
          {arcs.map((arc, i) => {
            const isActive = activeIdx === i;
            const dimmed = activeIdx >= 0 && !isActive;
            const gap = arcs.length > 1 ? Math.min(3, arc.len * 0.25) : 0;
            return (
              <motion.circle
                key={arc.label}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={isActive ? strokeW + 5 : strokeW}
                strokeDasharray={`${Math.max(0.5, arc.len - gap)} ${circumference}`}
                strokeDashoffset={arc.dashOffset}
                strokeLinecap="butt"
                initial={{ opacity: 0 }}
                animate={{ opacity: dimmed ? 0.38 : 1 }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectSlice?.(arc.label)}
              />
            );
          })}
        </svg>

        {/* Dynamic Center Readout */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-5">
          <span className="text-[11px] font-medium text-[var(--ink-muted)] truncate max-w-[115px]">
            {activeArc ? activeArc.label : centerLabel}
          </span>
          <span className="text-xl font-bold text-[var(--ink-primary)] font-mono-num leading-tight mt-0.5">
            {fmtID(activeArc ? activeArc.value : total)}
            {unit}
          </span>
          {activeArc ? (
            <span className="text-[11px] font-semibold font-mono-num" style={{ color: activeArc.color }}>
              {activeArc.pct}%
            </span>
          ) : (
            <span className="text-[10.5px] text-[var(--ink-muted)]">{arcs.length} kategori</span>
          )}
        </div>
      </div>

      {/* Synchronized Legend List */}
      <div className="flex-1 w-full space-y-1.5 min-w-0">
        {arcs.map((arc, i) => {
          const isActive = activeIdx === i;
          return (
            <button
              key={arc.label}
              type="button"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSelectSlice?.(arc.label)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[var(--surface-muted)] text-[var(--ink-primary)]'
                  : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]/60'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: arc.color }} />
                <span className="truncate font-medium">{arc.label}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0 font-mono-num">
                <span className="font-semibold text-[var(--ink-primary)]">
                  {fmtID(arc.value)}
                  {unit}
                </span>
                <span className="text-[var(--ink-muted)] w-10 text-right">{arc.pct}%</span>
              </span>
            </button>
          );
        })}
        {!arcs.length && (
          <p className="text-xs text-[var(--ink-muted)] py-4 text-center">Belum ada data kategori.</p>
        )}
      </div>
    </div>
  );
}
