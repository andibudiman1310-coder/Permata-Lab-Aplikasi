import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import { KelurahanData } from '../../types/lab';
import { fmtID, KEL_CATS } from '../../data/labData';
import { CHART_PALETTE } from '../charts/chartUtils';
import { MultiLineChart } from '../charts/MultiLineChart';
import { HeatmapMatrix } from '../charts/HeatmapMatrix';
import { HorizontalRankChart } from '../charts/HorizontalRankChart';

interface KelurahanViewProps {
  data: KelurahanData;
}

export function KelurahanView({ data }: KelurahanViewProps) {
  const [selectedYear, setSelectedYear] = useState<number>(
    data.years[data.years.length - 1] ?? 2026
  );
  const [catIdx, setCatIdx] = useState<number>(-1); // -1 = Semua kategori
  const [metric, setMetric] = useState<'total' | 'avg'>('total');
  const [includeLainnya, setIncludeLainnya] = useState<boolean>(false);

  const activeYear = data.years.includes(selectedYear)
    ? selectedYear
    : data.years[data.years.length - 1];

  const activeKelList = useMemo(
    () =>
      data.kel.filter(
        (k) => includeLainnya || !/lainnya/i.test(k)
      ),
    [data.kel, includeLainnya]
  );

  const valueOf = (yr: number, kel: string, categoryIdx: number) => {
    const arr = data.val[yr]?.[kel];
    if (!arr) return 0;
    const raw =
      categoryIdx < 0
        ? arr.reduce((a, b) => a + b, 0)
        : arr[categoryIdx] || 0;
    if (metric === 'avg') {
      const mCount = data.months[yr] || 12;
      return Math.round((raw / mCount) * 10) / 10;
    }
    return raw;
  };

  const digits = metric === 'avg' ? 1 : 0;

  // Ranked kelurahan for active year
  const rankedKel = useMemo(() => {
    return activeKelList
      .map((k, idx) => ({
        id: k,
        label: k.replace('Lainnya (luar wilayah / tidak diisi)', 'Lainnya'),
        value: valueOf(activeYear, k, catIdx),
        color: CHART_PALETTE[idx % CHART_PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [activeKelList, activeYear, catIdx, metric, data]);

  // Multi-line series across years
  const yearLabels = useMemo(
    () =>
      data.years.map((y) => {
        const m = data.months[y];
        return m && m < 12 ? `${y}*` : String(y);
      }),
    [data.years, data.months]
  );

  const lineSeries = useMemo(() => {
    return activeKelList.map((k, idx) => ({
      id: k,
      label: k.replace('Lainnya (luar wilayah / tidak diisi)', 'Lainnya'),
      values: data.years.map((y) => valueOf(y, k, catIdx)),
      color: CHART_PALETTE[idx % CHART_PALETTE.length],
    }));
  }, [activeKelList, data.years, catIdx, metric, data]);

  // Stacked horizontal category composition per kelurahan
  const catSumsPerKel = useMemo(() => {
    return rankedKel.map((rk) => {
      const arr = data.val[activeYear]?.[rk.id] || [0, 0, 0, 0, 0, 0, 0];
      const div = metric === 'avg' ? data.months[activeYear] || 12 : 1;
      const scaled = arr.map((v) => v / div);
      const tot = scaled.reduce((a, b) => a + b, 0);
      return { kel: rk.label, id: rk.id, vals: scaled, tot };
    });
  }, [rankedKel, data, activeYear, metric]);

  const maxStackedTot = Math.max(...catSumsPerKel.map((x) => x.tot), 1);

  // Matrix for Heatmap (rows = KEL_CATS, cols = activeKelList)
  const heatmapMatrix = useMemo(() => {
    return KEL_CATS.map((_, ci) =>
      activeKelList.map((kel) => valueOf(activeYear, kel, ci))
    );
  }, [activeKelList, activeYear, metric, data]);

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-primary)]">
            Tren Pemeriksaan per Kelurahan
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            {data.live ? 'Terhubung REKAP KELURAHAN Live' : 'Data Cadangan Tervalidasi'} · Tahun bertanda * belum genap 12 bulan
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {data.years.map((y) => {
            const partial = data.months[y] && data.months[y] < 12;
            return (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono-num cursor-pointer ${
                  activeYear === y
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {y}
                {partial ? '*' : ''}
              </button>
            );
          })}
        </div>

        <select
          aria-label="Pilih Kategori Pemeriksaan Kelurahan"
          value={catIdx}
          onChange={(e) => setCatIdx(Number(e.target.value))}
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)]"
        >
          <option value={-1}>Semua Kategori</option>
          {KEL_CATS.map((c, idx) => (
            <option key={c} value={idx}>
              {c}
            </option>
          ))}
        </select>

        <div className="inline-flex rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMetric('total')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              metric === 'total'
                ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                : 'text-[var(--ink-muted)]'
            }`}
          >
            Total
          </button>
          <button
            type="button"
            onClick={() => setMetric('avg')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              metric === 'avg'
                ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                : 'text-[var(--ink-muted)]'
            }`}
          >
            Rata-rata / bln
          </button>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-[var(--ink-secondary)] cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={includeLainnya}
            onChange={(e) => setIncludeLainnya(e.target.checked)}
            className="rounded border-[var(--border-hairline)] accent-[var(--accent)]"
          />
          <span>Sertakan Lainnya (luar wilayah)</span>
        </label>
      </div>

      {/* Top 5 Ranked Kelurahan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {rankedKel.slice(0, 5).map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
              <span className="font-mono-num font-bold">#{idx + 1}</span>
              <MapPin className="w-3.5 h-3.5" style={{ color: item.color }} />
            </div>
            <p className="text-xs font-bold text-[var(--ink-primary)] mt-1.5 truncate">
              {item.label}
            </p>
            <p className="text-xl font-bold font-mono-num text-[var(--ink-primary)] mt-1">
              {fmtID(item.value, digits)}
            </p>
            <p className="text-[11px] text-[var(--ink-muted)]">
              {metric === 'avg' ? 'tes / bulan' : `pemeriksaan (${activeYear})`}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Trend Line Chart + Stacked Horizontal Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-1">
            Tren Multi-Tahun per Kelurahan
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mb-3">
            Klik legenda kelurahan untuk mengisolasi atau membandingkan wilayah tertentu
          </p>
          <MultiLineChart
            labels={yearLabels}
            series={lineSeries}
            digits={digits}
            height={285}
          />
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-1">
            Komposisi Kategori per Kelurahan ({activeYear})
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mb-3">
            Proporsi bidang pemeriksaan di setiap kelurahan
          </p>

          {/* Compact category legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-[11px] text-[var(--ink-secondary)]">
            {KEL_CATS.slice(0, 6).map((c, ci) => (
              <span key={c} className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-xs"
                  style={{ backgroundColor: CHART_PALETTE[ci % CHART_PALETTE.length] }}
                />
                <span>{c}</span>
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {catSumsPerKel.map((row) => (
              <div key={row.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--ink-primary)] truncate">{row.kel}</span>
                  <span className="font-mono-num font-bold text-[var(--ink-primary)]">
                    {fmtID(row.tot, digits)}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden flex">
                  {row.vals.map((v, ci) => {
                    const pct = (v / maxStackedTot) * 100;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={ci}
                        title={`${KEL_CATS[ci]}: ${fmtID(v, digits)}`}
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CHART_PALETTE[ci % CHART_PALETTE.length],
                        }}
                        className="h-full transition-all duration-300"
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Matrix */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-1">
          Matriks Panas (Heatmap) Kategori × Kelurahan ({activeYear})
        </h2>
        <p className="text-xs text-[var(--ink-muted)] mb-3">
          Intensitas warna menunjukkan konsentrasi pemeriksaan pada setiap kombinasi wilayah dan jenis layanan
        </p>
        <HeatmapMatrix
          rowLabels={KEL_CATS}
          colLabels={activeKelList}
          matrix={heatmapMatrix}
          digits={digits}
        />
      </div>

      {/* Rank overview */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-3">
          Peringkat Lengkap Wilayah ({activeYear})
        </h2>
        <HorizontalRankChart items={rankedKel} />
      </div>
    </div>
  );
}
