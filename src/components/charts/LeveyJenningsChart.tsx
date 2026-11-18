import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QcBlock } from '../../types/lab';
import { fmtID } from '../../data/labData';

interface LeveyJenningsChartProps {
  block: QcBlock;
  selectedIndex: number | null;
  onSelectPoint: (index: number) => void;
}

export function getWestgardStatus(z: number): {
  tag: string;
  level: 'ok' | 'warn' | 'reject';
  desc: string;
} {
  const az = Math.abs(z);
  if (az > 3) return { tag: '1-3s', level: 'reject', desc: 'Tolak (> ±3 SD)' };
  if (az > 2) return { tag: '1-2s', level: 'warn', desc: 'Peringatan (±2–3 SD)' };
  return { tag: 'OK', level: 'ok', desc: 'Dalam kendali (±2 SD)' };
}

export function LeveyJenningsChart({
  block,
  selectedIndex,
  onSelectPoint,
}: LeveyJenningsChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showZones, setShowZones] = useState(true);

  const { pts, mean, sd } = block;
  const W = 780;
  const H = 310;
  const padL = 56;
  const padR = 62;
  const padT = 26;
  const padB = 38;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const safeSd = sd > 0 ? sd : Math.max(0.01, Math.abs(mean) * 0.02);
  const minY = mean - 3.6 * safeSd;
  const maxY = mean + 3.6 * safeSd;
  const span = maxY - minY;

  const yOf = (val: number) => padT + plotH - ((val - minY) / span) * plotH;

  const coords = useMemo(() => {
    const n = Math.max(1, pts.length);
    return pts.map((p, i) => {
      const x = n === 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW;
      const clampedVal = Math.max(minY + span * 0.02, Math.min(maxY - span * 0.02, p.v));
      const y = yOf(clampedVal);
      const z = sd > 0 ? (p.v - mean) / sd : 0;
      const wg = getWestgardStatus(z);
      return { x, y, v: p.v, d: p.d, z, wg };
    });
  }, [pts, mean, sd, minY, maxY, span, plotW, plotH]);

  const polyPath = useMemo(() => {
    if (!coords.length) return '';
    return coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(' ');
  }, [coords]);

  const zones = [
    { from: mean + 2 * safeSd, to: mean + 3 * safeSd, fill: 'rgba(239, 68, 68, 0.09)' },
    { from: mean - 3 * safeSd, to: mean - 2 * safeSd, fill: 'rgba(239, 68, 68, 0.09)' },
    { from: mean + 1 * safeSd, to: mean + 2 * safeSd, fill: 'rgba(245, 158, 11, 0.09)' },
    { from: mean - 2 * safeSd, to: mean - 1 * safeSd, fill: 'rgba(245, 158, 11, 0.09)' },
    { from: mean - 1 * safeSd, to: mean + 1 * safeSd, fill: 'rgba(16, 185, 129, 0.09)' },
  ];

  const refLines = [
    { label: '+3 SD', val: mean + 3 * safeSd, color: '#e11d48', dash: '4 4' },
    { label: '+2 SD', val: mean + 2 * safeSd, color: '#d97706', dash: '5 4' },
    { label: '+1 SD', val: mean + 1 * safeSd, color: '#10b981', dash: '3 4' },
    { label: 'Mean', val: mean, color: '#1668e3', dash: undefined },
    { label: '-1 SD', val: mean - 1 * safeSd, color: '#10b981', dash: '3 4' },
    { label: '-2 SD', val: mean - 2 * safeSd, color: '#d97706', dash: '5 4' },
    { label: '-3 SD', val: mean - 3 * safeSd, color: '#e11d48', dash: '4 4' },
  ];

  const digits = Math.abs(mean) < 20 ? 2 : Math.abs(mean) < 100 ? 1 : 0;

  return (
    <div className="w-full select-none">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>±1 SD / OK</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>1-2s (±2–3 SD)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>1-3s (&gt; ±3 SD)</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowZones((z) => !z)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
            showZones
              ? 'border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-primary)]'
              : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
          }`}
        >
          {showZones ? 'Sembunyikan Zona SD' : 'Tampilkan Zona SD'}
        </button>
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto overflow-visible block"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Shaded SD Zone Bands */}
          {showZones &&
            zones.map((z, idx) => {
              const y1 = yOf(z.to);
              const y2 = yOf(z.from);
              return (
                <rect
                  key={`z-${idx}`}
                  x={padL}
                  y={Math.min(y1, y2)}
                  width={plotW}
                  height={Math.abs(y2 - y1)}
                  fill={z.fill}
                />
              );
            })}

          {/* Reference Lines & Left Value + Right SD Labels */}
          {refLines.map((rl) => {
            const y = yOf(rl.val);
            return (
              <g key={rl.label}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke={rl.color}
                  strokeWidth={rl.label === 'Mean' ? 1.8 : 1.1}
                  strokeDasharray={rl.dash}
                  opacity={rl.label === 'Mean' ? 0.9 : 0.72}
                />
                <text
                  x={padL - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-[var(--ink-muted)] text-[10px] font-mono-num"
                >
                  {fmtID(rl.val, digits)}
                </text>
                <text
                  x={W - padR + 8}
                  y={y + 3.5}
                  textAnchor="start"
                  fill={rl.color}
                  className="text-[10px] font-semibold font-mono-num"
                >
                  {rl.label}
                </text>
              </g>
            );
          })}

          {/* Hover Vertical Line */}
          {hoverIdx !== null && coords[hoverIdx] && (
            <line
              x1={coords[hoverIdx].x}
              x2={coords[hoverIdx].x}
              y1={padT}
              y2={padT + plotH}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.7}
            />
          )}

          {/* QC Series Line */}
          {polyPath && (
            <motion.path
              d={polyPath}
              fill="none"
              stroke="var(--ink-primary)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            />
          )}

          {/* Data Points & Westgard Flags */}
          {coords.map((c, i) => {
            const isSel = selectedIndex === i;
            const isHov = hoverIdx === i;
            const fill =
              c.wg.level === 'reject'
                ? '#e11d48'
                : c.wg.level === 'warn'
                ? '#d97706'
                : '#10b981';

            return (
              <g key={`qc-${i}`} className="cursor-pointer" onClick={() => onSelectPoint(i)}>
                {(isSel || isHov) && (
                  <circle cx={c.x} cy={c.y} r={9} fill={fill} opacity={0.2} />
                )}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isSel || isHov ? 5.8 : c.wg.level !== 'ok' ? 5 : 4}
                  fill={fill}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
                {c.wg.level !== 'ok' && (
                  <text
                    x={c.x}
                    y={c.y - 9}
                    textAnchor="middle"
                    fill={fill}
                    className="text-[9.5px] font-bold font-mono-num"
                  >
                    {c.wg.tag}
                  </text>
                )}
              </g>
            );
          })}

          {/* X-Axis Labels */}
          {coords.map((c, i) => {
            const step = coords.length > 22 ? 3 : coords.length > 13 ? 2 : 1;
            if (i % step !== 0 && i !== coords.length - 1 && hoverIdx !== i && selectedIndex !== i)
              return null;
            return (
              <text
                key={`qxl-${i}`}
                x={c.x}
                y={H - 10}
                textAnchor="middle"
                className={`text-[10px] font-mono-num ${
                  selectedIndex === i || hoverIdx === i
                    ? 'fill-[var(--accent)] font-bold'
                    : 'fill-[var(--ink-muted)]'
                }`}
              >
                {c.d}
              </text>
            );
          })}

          {/* Hit zones for easy hovering */}
          {coords.map((c, i) => {
            const w = plotW / Math.max(1, coords.length);
            return (
              <rect
                key={`qhit-${i}`}
                x={c.x - w / 2}
                y={padT}
                width={w}
                height={plotH + padB}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIdx(i)}
                onClick={() => onSelectPoint(i)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoverIdx !== null && coords[hoverIdx] && (
            <motion.div
              key={`qctip-${hoverIdx}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              style={{
                left: `${Math.min(80, Math.max(20, (coords[hoverIdx].x / W) * 100))}%`,
              }}
              className="pointer-events-none absolute top-1 -translate-x-1/2 z-20 min-w-[168px] rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)]/95 backdrop-blur-md px-3 py-2 shadow-lg text-xs"
            >
              <div className="font-semibold text-[var(--ink-primary)] mb-1 flex items-center justify-between gap-2">
                <span>{coords[hoverIdx].d}</span>
                <span
                  className={`font-mono-num text-[10.5px] font-bold ${
                    coords[hoverIdx].wg.level === 'reject'
                      ? 'text-rose-500'
                      : coords[hoverIdx].wg.level === 'warn'
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {coords[hoverIdx].wg.tag}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-[var(--ink-secondary)]">
                <span>Hasil QC</span>
                <span className="font-mono-num font-bold text-[var(--ink-primary)]">
                  {fmtID(coords[hoverIdx].v, digits)}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-[var(--ink-secondary)] mt-0.5">
                <span>Z-Score</span>
                <span className="font-mono-num font-semibold text-[var(--ink-primary)]">
                  {coords[hoverIdx].z >= 0 ? '+' : ''}
                  {fmtID(coords[hoverIdx].z, 2)} SD
                </span>
              </div>
              <div className="text-[10.5px] text-[var(--ink-muted)] mt-1 pt-1 border-t border-[var(--border-hairline)]">
                {coords[hoverIdx].wg.desc} · Klik sorot tabel
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
