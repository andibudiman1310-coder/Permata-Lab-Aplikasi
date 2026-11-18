import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { MutuYearMap } from '../../types/lab';
import { fmtID, MONTHS_SHORT } from '../../data/labData';
import { AnimatedNumber } from '../charts/AnimatedNumber';
import { ComboTrendChart } from '../charts/ComboTrendChart';
import { MultiLineChart } from '../charts/MultiLineChart';

interface MutuViewProps {
  data: MutuYearMap;
  live: boolean;
  defaultTarget?: number;
}

export function MutuView({ data, live, defaultTarget = 80 }: MutuViewProps) {
  const years = useMemo(() => Object.keys(data).map(Number).sort((a, b) => a - b), [data]);
  const [selectedYear, setSelectedYear] = useState<number>(years[years.length - 1] ?? 2026);
  const [target, setTarget] = useState<number>(defaultTarget);

  useEffect(() => {
    setTarget(defaultTarget);
  }, [defaultTarget]);

  const activeYear = years.includes(selectedYear) ? selectedYear : years[years.length - 1];
  const activeArr = data[activeYear] || [];

  const summary = useMemo(() => {
    const filled = activeArr.map((v, i) => ({ v, i })).filter((x) => x.v != null) as {
      v: number;
      i: number;
    }[];
    const avg = filled.length ? filled.reduce((s, x) => s + x.v, 0) / filled.length : 0;
    const hitTarget = filled.filter((x) => x.v >= target).length;
    const maxItem = filled.reduce((best, x) => (x.v > best.v ? x : best), filled[0] || { v: 0, i: 0 });
    const minItem = filled.reduce((best, x) => (x.v < best.v ? x : best), filled[0] || { v: 0, i: 0 });
    return {
      avg: Math.round(avg * 10) / 10,
      filledCount: filled.length,
      hitTarget,
      maxItem,
      minItem,
    };
  }, [activeArr, target]);

  const barColors = useMemo(
    () =>
      activeArr.map((v) => {
        if (v == null) return 'rgba(148,163,184,0.25)';
        if (v >= 95) return '#10b981';
        if (v >= target) return '#1668e3';
        return '#e11d48';
      }),
    [activeArr, target]
  );

  const prevYear = years.find((y) => y === activeYear - 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-primary)]">
            Indikator Mutu Pelayanan Laboratorium
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Kepatuhan Waktu Tunggu Hasil Lab · {live ? 'Google Sheets Live' : 'Data Cadangan Tervalidasi'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] p-1 text-xs font-semibold">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1 rounded-lg cursor-pointer ${
                  activeYear === y
                    ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                    : 'text-[var(--ink-muted)]'
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] px-3 py-1.5 text-xs">
            <Target className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[var(--ink-muted)]">Target:</span>
            <select
              aria-label="Pilih Target Mutu"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="font-mono-num font-bold text-[var(--ink-primary)] bg-transparent focus:outline-none"
            >
              <option value={80}>80%</option>
              <option value={85}>85%</option>
              <option value={90}>90%</option>
              <option value={95}>95%</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--ink-muted)]">Rata-rata Capaian {activeYear}</p>
          <p className="text-2xl font-bold text-[var(--ink-primary)] mt-1">
            <AnimatedNumber value={summary.avg} digits={1} suffix="%" />
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--ink-muted)]">Bulan Memenuhi Target (≥ {target}%)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            <AnimatedNumber value={summary.hitTarget} />
            <span className="text-sm font-normal text-[var(--ink-muted)] ml-1">
              / {summary.filledCount} bln
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--ink-muted)]">Capaian Tertinggi</p>
          <p className="text-2xl font-bold text-[var(--ink-primary)] mt-1">
            <AnimatedNumber value={summary.maxItem.v} suffix="%" />
          </p>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
            Bulan {MONTHS_SHORT[summary.maxItem.i]}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--ink-muted)]">Capaian Terendah</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            <AnimatedNumber value={summary.minItem.v} suffix="%" />
          </p>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
            Bulan {MONTHS_SHORT[summary.minItem.i]}
          </p>
        </div>
      </div>

      {/* Insight Callout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-muted)]/65 p-4 flex items-start gap-3"
      >
        <ShieldCheck className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
          Pada tahun <strong className="text-[var(--ink-primary)]">{activeYear}</strong>, sebanyak{' '}
          <strong className="text-[var(--ink-primary)]">
            {summary.hitTarget} dari {summary.filledCount} bulan
          </strong>{' '}
          berhasil melampaui standar mutu minimal <strong className="font-mono-num">{target}%</strong>. Batang berwarna hijau menandakan capaian paripurna (≥ 95%), biru memenuhi target (≥ {target}%), dan merah muda di bawah target.
        </p>
      </motion.div>

      {/* Monthly Threshold Bar Chart + YoY Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-1">
            Capaian Bulanan Waktu Tunggu ({activeYear})
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mb-3">
            Warna batang otomatis menyesuaikan target {target}% dan batas prima 95%
          </p>
          <ComboTrendChart
            labels={MONTHS_SHORT}
            barValues={activeArr.map((v) => v ?? 0)}
            barColors={barColors}
            barLabel="Capaian"
            unit="%"
            yAxisMax={105}
            showModeToggle={false}
            referenceLines={[
              { value: target, label: `Target ${target}%`, color: '#d97706' },
              { value: 95, label: 'Prima 95%', color: '#10b981' },
            ]}
            height={265}
          />
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-[var(--ink-primary)]">
              Perbandingan Antar-Tahun (YoY)
            </h2>
            <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <p className="text-xs text-[var(--ink-muted)] mb-3">
            Klik legenda untuk menyembunyikan/menyorot salah satu tahun
          </p>
          <MultiLineChart
            labels={MONTHS_SHORT}
            series={years.map((y, idx) => ({
              id: String(y),
              label: `Tahun ${y}`,
              values: data[y],
              color: idx === years.length - 1 ? '#1668e3' : '#0d9488',
              dashed: idx !== years.length - 1,
            }))}
            unit="%"
            yMin={0}
            yMax={105}
            referenceLines={[{ value: target, label: `Target ${target}%`, color: '#d97706' }]}
            height={265}
          />
        </div>
      </div>

      {/* YoY Delta Table */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-3">
          Tabel Perbandingan Bulanan &amp; Selisih Tahun Sebelumnya
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-[var(--ink-muted)]">
                <th className="py-2 px-2 text-left font-semibold">Bulan</th>
                {years.map((y) => (
                  <th key={y} className="py-2 px-2 text-right font-semibold">
                    {y}
                  </th>
                ))}
                {prevYear && (
                  <th className="py-2 px-2 text-right font-semibold">
                    Selisih ({activeYear} vs {prevYear})
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {MONTHS_SHORT.map((m, idx) => {
                const cur = data[activeYear]?.[idx] ?? null;
                const prv = prevYear ? data[prevYear]?.[idx] ?? null : null;
                const diff = cur != null && prv != null ? cur - prv : null;
                return (
                  <tr
                    key={m}
                    className="border-b border-[var(--border-hairline)] last:border-b-0 hover:bg-[var(--surface-muted)]/50"
                  >
                    <td className="py-2 px-2 font-medium text-[var(--ink-primary)]">{m}</td>
                    {years.map((y) => {
                      const val = data[y]?.[idx];
                      return (
                        <td key={y} className="py-2 px-2 text-right font-mono-num">
                          {val == null ? '–' : `${fmtID(val, 0)}%`}
                        </td>
                      );
                    })}
                    {prevYear && (
                      <td
                        className={`py-2 px-2 text-right font-mono-num font-semibold ${
                          diff == null
                            ? 'text-[var(--ink-muted)]'
                            : diff >= 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {diff == null ? '–' : `${diff >= 0 ? '+' : ''}${fmtID(diff, 0)}%`}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
