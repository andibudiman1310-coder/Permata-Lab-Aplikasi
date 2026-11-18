import { motion } from 'motion/react';
import { fmtID } from '../../data/labData';

export interface RankBarItem {
  id: string;
  label: string;
  value: number;
  sublabel?: string;
  color?: string;
}

interface HorizontalRankChartProps {
  items: RankBarItem[];
  unit?: string;
  selectedId?: string | null;
  onSelectItem?: (id: string) => void;
  showPercentage?: boolean;
  emptyText?: string;
}

export function HorizontalRankChart({
  items,
  unit = '',
  selectedId = null,
  onSelectItem,
  showPercentage = true,
  emptyText = 'Tidak ada data untuk ditampilkan.',
}: HorizontalRankChartProps) {
  const maxVal = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((a, b) => a + b.value, 0);

  if (!items.length) {
    return <p className="text-xs text-[var(--ink-muted)] py-6 text-center">{emptyText}</p>;
  }

  return (
    <div className="space-y-2.5 w-full">
      {items.map((item, idx) => {
        const pctOfMax = Math.max(2, (item.value / maxVal) * 100);
        const pctTotal = total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0;
        const isSelected = selectedId === item.id;
        const barCol = item.color || 'var(--accent)';
        const InteractiveTag = onSelectItem ? 'button' : 'div';

        return (
          <InteractiveTag
            key={item.id}
            {...(onSelectItem
              ? {
                  type: 'button' as const,
                  onClick: () => onSelectItem(item.id),
                }
              : {})}
            className={`w-full text-left rounded-lg px-2.5 py-1.5 transition-colors ${
              onSelectItem ? 'cursor-pointer hover:bg-[var(--surface-muted)]' : ''
            } ${isSelected ? 'bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]/40' : ''}`}
          >
            <div className="flex items-center justify-between gap-2 text-xs mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono-num text-[11px] font-semibold text-[var(--ink-muted)] w-5 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span
                  className={`truncate font-medium ${
                    isSelected ? 'text-[var(--accent)] font-semibold' : 'text-[var(--ink-primary)]'
                  }`}
                >
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[11px] text-[var(--ink-muted)] shrink-0 hidden sm:inline">
                    · {item.sublabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono-num">
                <span className="font-bold text-[var(--ink-primary)]">
                  {fmtID(item.value)}
                  {unit}
                </span>
                {showPercentage && (
                  <span className="text-[11px] text-[var(--ink-muted)] w-11 text-right">
                    {pctTotal}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: barCol, transformOrigin: 'left center' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pctOfMax / 100 }}
                transition={{
                  duration: 0.48,
                  delay: Math.min(idx * 0.03, 0.3),
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
          </InteractiveTag>
        );
      })}
    </div>
  );
}
