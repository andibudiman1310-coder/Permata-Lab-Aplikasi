import { useState } from 'react';
import { motion } from 'motion/react';
import { fmtID } from '../../data/labData';

interface HeatmapMatrixProps {
  rowLabels: string[];
  colLabels: string[];
  matrix: number[][]; // [row][col]
  digits?: number;
  unit?: string;
}

export function HeatmapMatrix({
  rowLabels,
  colLabels,
  matrix,
  digits = 0,
  unit = '',
}: HeatmapMatrixProps) {
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null);

  const flat = matrix.flat();
  const maxVal = Math.max(...flat, 1);

  return (
    <div className="w-full space-y-2">
      {/* Live Readout Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 min-h-[26px] text-xs px-1">
        {hovered ? (
          <div className="flex items-center gap-2 text-[var(--ink-primary)]">
            <span className="font-semibold">{rowLabels[hovered.r]}</span>
            <span className="text-[var(--ink-muted)]">·</span>
            <span className="text-[var(--ink-secondary)]">{colLabels[hovered.c]}</span>
            <span className="text-[var(--ink-muted)]">=</span>
            <span className="font-mono-num font-bold text-[var(--accent)]">
              {fmtID(matrix[hovered.r]?.[hovered.c] ?? 0, digits)}
              {unit}
            </span>
          </div>
        ) : (
          <span className="text-[var(--ink-muted)]">
            Arahkan kursor ke sel matriks untuk melihat rincian per kelurahan & kategori
          </span>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
          <span>Rendah</span>
          <div className="flex items-center gap-0.5">
            {[0.12, 0.3, 0.52, 0.74, 0.95].map((op) => (
              <span
                key={op}
                className="w-3.5 h-2.5 rounded-xs"
                style={{ backgroundColor: `rgba(22, 104, 227, ${op})` }}
              />
            ))}
          </div>
          <span>Tinggi</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-hairline)]">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--surface-muted)]">
              <th className="text-left px-3 py-2 font-semibold text-[var(--ink-secondary)] border-b border-[var(--border-hairline)] min-w-[165px]">
                Kategori / Kelurahan
              </th>
              {colLabels.map((c, ci) => (
                <th
                  key={c}
                  className={`px-2 py-2 text-center font-semibold border-b border-[var(--border-hairline)] whitespace-nowrap transition-colors ${
                    hovered?.c === ci
                      ? 'text-[var(--accent)] bg-[var(--accent-soft)]/50'
                      : 'text-[var(--ink-secondary)]'
                  }`}
                >
                  {c.replace('Lainnya (luar wilayah / tidak diisi)', 'Lainnya')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((rLabel, ri) => (
              <tr key={rLabel} className="border-b border-[var(--border-hairline)] last:border-b-0">
                <td
                  className={`px-3 py-2 font-medium whitespace-nowrap transition-colors ${
                    hovered?.r === ri
                      ? 'text-[var(--accent)] bg-[var(--accent-soft)]/35 font-semibold'
                      : 'text-[var(--ink-primary)] bg-[var(--surface)]'
                  }`}
                >
                  {rLabel}
                </td>
                {colLabels.map((_, ci) => {
                  const val = matrix[ri]?.[ci] ?? 0;
                  const ratio = maxVal > 0 ? val / maxVal : 0;
                  const alpha = val === 0 ? 0.03 : Math.min(0.92, 0.1 + ratio * 0.82);
                  const isHigh = ratio > 0.56;
                  const isActive = hovered?.r === ri && hovered?.c === ci;
                  const isCross = hovered?.r === ri || hovered?.c === ci;

                  return (
                    <td
                      key={`${ri}-${ci}`}
                      onMouseEnter={() => setHovered({ r: ri, c: ci })}
                      onMouseLeave={() => setHovered(null)}
                      className="p-1 text-center"
                    >
                      <motion.div
                        initial={{ opacity: 0.4, scale: 0.94 }}
                        animate={{ opacity: 1, scale: isActive ? 1.05 : 1 }}
                        transition={{ duration: 0.16 }}
                        style={{
                          backgroundColor:
                            val === 0 ? 'var(--surface-muted)' : `rgba(22, 104, 227, ${alpha.toFixed(2)})`,
                        }}
                        className={`rounded-md py-1.5 px-1.5 font-mono-num font-semibold transition-all ${
                          isHigh
                            ? 'text-white'
                            : 'text-[var(--ink-primary)]'
                        } ${
                          isActive
                            ? 'ring-2 ring-[var(--accent)] shadow-xs'
                            : isCross
                            ? 'ring-1 ring-[var(--accent)]/35'
                            : ''
                        }`}
                      >
                        {val === 0 ? '0' : fmtID(val, digits)}
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
