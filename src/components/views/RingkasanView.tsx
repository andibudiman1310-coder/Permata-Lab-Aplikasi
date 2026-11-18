import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, CalendarDays, RefreshCw, TrendingUp } from 'lucide-react';
import { AnnualReportData, DailyMonth, Monthly2026Data } from '../../types/lab';
import { classifyExamGroup, fmtID, MONTHS_SHORT } from '../../data/labData';
import { AnimatedNumber } from '../charts/AnimatedNumber';
import { ComboTrendChart } from '../charts/ComboTrendChart';
import { InteractiveDonutChart } from '../charts/InteractiveDonutChart';
import { HorizontalRankChart } from '../charts/HorizontalRankChart';
import { MultiLineChart } from '../charts/MultiLineChart';

interface RingkasanViewProps {
  annual: AnnualReportData;
  daily2026: DailyMonth[];
  monthly2026: Monthly2026Data;
  onRefresh?: () => void;
}

const DOW_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function RingkasanView({
  annual,
  daily2026,
  monthly2026,
  onRefresh,
}: RingkasanViewProps) {
  const [selectedYearIdx, setSelectedYearIdx] = useState(
    Math.max(0, annual.years.length - 1)
  );
  const [selectedExamName, setSelectedExamName] = useState<string>(
    annual.exams[2]?.[0] || annual.exams[0]?.[0] || ''
  );
  const [selectedDailyMonthIdx, setSelectedDailyMonthIdx] = useState(
    Math.max(0, daily2026.length - 1)
  );
  const [selectedMonth2026Idx, setSelectedMonth2026Idx] = useState<number>(() => {
    const active = monthly2026.tot.reduce((last, v, i) => (v > 0 ? i : last), 0);
    return active;
  });
  const [tab, setTab] = useState<'tahunan' | 'harian' | 'bulanan'>('tahunan');

  useEffect(() => {
    setSelectedYearIdx(Math.max(0, annual.years.length - 1));
  }, [annual.years.length]);

  useEffect(() => {
    setSelectedDailyMonthIdx(Math.max(0, daily2026.length - 1));
  }, [daily2026.length]);

  const safeYearIdx = Math.min(selectedYearIdx, Math.max(0, annual.years.length - 1));
  const activeYear = annual.years[safeYearIdx] ?? 2025;

  const yearlyTotals = useMemo(
    () => annual.years.map((_, yi) => annual.exams.reduce((s, [, v]) => s + (v[yi] || 0), 0)),
    [annual]
  );

  const ratioPerVisit = useMemo(
    () =>
      annual.years.map((_, yi) => {
        const vis = annual.visits[yi] || 0;
        return vis > 0 ? Math.round((yearlyTotals[yi] / vis) * 100) / 100 : 0;
      }),
    [annual.years, annual.visits, yearlyTotals]
  );

  const activeExamsSum = yearlyTotals[safeYearIdx] || 0;
  const activeVisitsSum = annual.visits[safeYearIdx] || 0;
  const activeRatio = ratioPerVisit[safeYearIdx] || 0;
  const allTimeTotal = yearlyTotals.reduce((a, b) => a + b, 0);

  // Top 10 exams for selected year
  const top10Exams = useMemo(() => {
    return [...annual.exams]
      .map(([name, vals]) => ({
        id: name,
        label: name,
        value: vals[safeYearIdx] || 0,
        sublabel: classifyExamGroup(name),
      }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [annual.exams, safeYearIdx]);

  // Group breakdown for Donut
  const groupSlices = useMemo(() => {
    const map: Record<string, number> = {};
    annual.exams.forEach(([name, vals]) => {
      const grp = classifyExamGroup(name);
      map[grp] = (map[grp] || 0) + (vals[safeYearIdx] || 0);
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [annual.exams, safeYearIdx]);

  // Selected exam trend across years
  const activeExamEntry = useMemo(
    () => annual.exams.find(([name]) => name === selectedExamName) || annual.exams[0],
    [annual.exams, selectedExamName]
  );

  // Daily 2026 metrics
  const activeDaily = daily2026[Math.min(selectedDailyMonthIdx, Math.max(0, daily2026.length - 1))];
  const dailyStats = useMemo(() => {
    if (!activeDaily) return { openDays: 0, totPas: 0, totPem: 0, avgPas: 0, dowAvg: [] as number[], top5: [] as typeof activeDaily['days'] };
    const open = activeDaily.days.filter((d) => d.buka);
    const totPas = open.reduce((s, d) => s + d.pas, 0);
    const totPem = open.reduce((s, d) => s + d.pem, 0);
    const dowSum = Array(7).fill(0);
    const dowCnt = Array(7).fill(0);
    open.forEach((d) => {
      dowSum[d.dow] += d.pem;
      dowCnt[d.dow]++;
    });
    const dowAvg = dowSum.map((s, i) => (dowCnt[i] ? Math.round((s / dowCnt[i]) * 10) / 10 : 0));
    const top5 = [...open].sort((a, b) => b.pem - a.pem).slice(0, 5);
    return {
      openDays: open.length,
      totPas,
      totPem,
      avgPas: open.length ? Math.round((totPas / open.length) * 10) / 10 : 0,
      dowAvg,
      top5,
    };
  }, [activeDaily]);

  // Monthly 2026 metrics
  const monthlyTop10 = useMemo(() => {
    return [...monthly2026.items]
      .map((it) => ({
        id: it.n,
        label: it.n,
        value: it.v[selectedMonth2026Idx] || 0,
        sublabel: it.kat,
      }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [monthly2026, selectedMonth2026Idx]);

  const monthlyCatSlices = useMemo(() => {
    const map: Record<string, number> = {};
    monthly2026.items.forEach((it) => {
      const val = it.v[selectedMonth2026Idx] || 0;
      map[it.kat] = (map[it.kat] || 0) + val;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthly2026, selectedMonth2026Idx]);

  return (
    <div className="space-y-5">
      {/* Header & Section Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-primary)]">
            Ringkasan Laporan &amp; Analitik Layanan
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            {annual.years[0]}–{annual.years[annual.years.length - 1]} Tahunan · Operasional Harian &amp; Rekap Bulanan 2026
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] p-1 text-xs font-semibold">
            {[
              { id: 'tahunan', label: 'Tahunan' },
              { id: 'harian', label: 'Harian 2026' },
              { id: 'bulanan', label: 'Bulanan 2026' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as typeof tab)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  tab === t.id
                    ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: TAHUNAN */}
      {tab === 'tahunan' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Year pills selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {annual.years.map((y, idx) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setSelectedYearIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono-num transition-colors cursor-pointer ${
                    safeYearIdx === idx
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface-muted)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
            <span className="text-xs text-[var(--ink-muted)]">
              Sumber: {annual.live ? 'Google Sheets Live' : 'Data Cadangan Tervalidasi'}
            </span>
          </div>

          {/* 5 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--ink-muted)]">Pemeriksaan {activeYear}</p>
              <p className="text-2xl font-bold text-[var(--ink-primary)] mt-1">
                <AnimatedNumber value={activeExamsSum} />
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--ink-muted)]">Kunjungan {activeYear}</p>
              <p className="text-2xl font-bold text-[var(--ink-primary)] mt-1">
                <AnimatedNumber value={activeVisitsSum} />
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--ink-muted)]">Rasio Tes / Pasien</p>
              <p className="text-2xl font-bold text-[var(--accent)] mt-1">
                <AnimatedNumber value={activeRatio} digits={2} />
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--ink-muted)]">Jenis Aktif</p>
              <p className="text-2xl font-bold text-[var(--ink-primary)] mt-1">
                <AnimatedNumber
                  value={annual.exams.filter(([, v]) => (v[safeYearIdx] || 0) > 0).length}
                />
              </p>
            </div>
            <div className="col-span-2 md:col-span-1 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--ink-muted)]">Akumulasi Multi-Tahun</p>
              <p className="text-2xl font-bold text-[var(--ink-primary)] mt-1">
                <AnimatedNumber value={allTimeTotal} />
              </p>
            </div>
          </div>

          {/* Primary Combo + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
              <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-1">
                Tren Total Pemeriksaan &amp; Kunjungan Pasien
              </h2>
              <p className="text-xs text-[var(--ink-muted)] mb-3">
                Klik kolom tahun mana saja untuk memfilter peringkat Top 10 &amp; proporsi kategori
              </p>
              <ComboTrendChart
                labels={annual.years.map(String)}
                barValues={yearlyTotals}
                lineValues={annual.visits}
                barLabel="Pemeriksaan"
                lineLabel="Kunjungan"
                selectedIndex={safeYearIdx}
                onSelectIndex={(idx) => setSelectedYearIdx(idx)}
                height={270}
              />
            </div>

            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-1">
                  Proporsi Kelompok ({activeYear})
                </h2>
                <p className="text-xs text-[var(--ink-muted)] mb-4">
                  Arahkan kursor atau klik segmen untuk rincian volume
                </p>
              </div>
              <InteractiveDonutChart
                slices={groupSlices}
                centerLabel={`Tahun ${activeYear}`}
                size={195}
              />
            </div>
          </div>

          {/* Clickable Top 10 + Exam Trend Curve + Ratio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                    Top 10 Pemeriksaan ({activeYear})
                  </h2>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Klik salah satu baris untuk melihat kurva trennya di sebelah kanan
                  </p>
                </div>
                <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <HorizontalRankChart
                items={top10Exams}
                selectedId={activeExamEntry?.[0] || null}
                onSelectItem={(id) => setSelectedExamName(id)}
              />
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                      Tren Per Jenis Pemeriksaan
                    </h2>
                    <p className="text-xs text-[var(--ink-muted)]">
                      Kurva historis parameter terpilih
                    </p>
                  </div>
                  <select
                    aria-label="Pilih Jenis Pemeriksaan"
                    value={activeExamEntry?.[0] || ''}
                    onChange={(e) => setSelectedExamName(e.target.value)}
                    className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-primary)] max-w-[200px]"
                  >
                    {annual.exams.map(([name]) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                {activeExamEntry && (
                  <ComboTrendChart
                    labels={annual.years.map(String)}
                    barValues={activeExamEntry[1]}
                    lineValues={activeExamEntry[1]}
                    barLabel={activeExamEntry[0]}
                    lineLabel="Garis Tren"
                    barColor="#0d9488"
                    lineColor="#1668e3"
                    defaultMode="line"
                    height={210}
                    selectedIndex={safeYearIdx}
                    onSelectIndex={(idx) => setSelectedYearIdx(idx)}
                  />
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                      Rasio Pemeriksaan per Kunjungan
                    </h2>
                    <p className="text-xs text-[var(--ink-muted)]">
                      Rata-rata jumlah tes per pasien datang
                    </p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                </div>
                <MultiLineChart
                  labels={annual.years.map(String)}
                  series={[
                    {
                      id: 'ratio',
                      label: 'Tes / Kunjungan',
                      values: ratioPerVisit,
                      color: '#7c3aed',
                    },
                  ]}
                  digits={2}
                  height={175}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: HARIAN 2026 */}
      {tab === 'harian' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--ink-primary)]">
                Pilih Bulan Operasional 2026:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {daily2026.map((m, i) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => setSelectedDailyMonthIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedDailyMonthIdx === i
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface-muted)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {activeDaily && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
                  <p className="text-xs text-[var(--ink-muted)]">Hari Layanan Buka</p>
                  <p className="text-2xl font-bold text-[var(--ink-primary)] mt-1">
                    <AnimatedNumber value={dailyStats.openDays} suffix=" hari" />
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
                  <p className="text-xs text-[var(--ink-muted)]">Total Pasien</p>
                  <p className="text-2xl font-bold text-[var(--ink-primary)] mt-1">
                    <AnimatedNumber value={dailyStats.totPas} />
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
                  <p className="text-xs text-[var(--ink-muted)]">Total Pemeriksaan</p>
                  <p className="text-2xl font-bold text-[var(--accent)] mt-1">
                    <AnimatedNumber value={dailyStats.totPem} />
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
                  <p className="text-xs text-[var(--ink-muted)]">Rata-rata Pasien / Hari</p>
                  <p className="text-2xl font-bold text-[var(--ink-primary)] mt-1">
                    <AnimatedNumber value={dailyStats.avgPas} digits={1} />
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
                <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-1">
                  Volume Pemeriksaan &amp; Pasien Harian — {activeDaily.name}
                </h2>
                <p className="text-xs text-[var(--ink-muted)] mb-3">
                  Sumbu kiri menampilkan jumlah pemeriksaan (batang), sumbu kanan jumlah pasien (kurva)
                </p>
                <ComboTrendChart
                  labels={activeDaily.days.map((d) => String(d.d))}
                  barValues={activeDaily.days.map((d) => d.pem)}
                  lineValues={activeDaily.days.map((d) => d.pas)}
                  barLabel="Pemeriksaan"
                  lineLabel="Pasien"
                  secondaryAxis
                  height={280}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
                  <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-3">
                    Rata-rata Pemeriksaan per Hari Kerja
                  </h2>
                  <HorizontalRankChart
                    items={DOW_LABELS.map((lbl, idx) => ({
                      id: lbl,
                      label: lbl,
                      value: dailyStats.dowAvg[idx] || 0,
                    }))}
                    showPercentage={false}
                  />
                </div>

                <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
                  <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-3">
                    Top 5 Tanggal Tersibuk — {activeDaily.name}
                  </h2>
                  <HorizontalRankChart
                    items={dailyStats.top5.map((d) => ({
                      id: String(d.d),
                      label: `Tanggal ${d.d} (${DOW_LABELS[d.dow]})`,
                      value: d.pem,
                      sublabel: `${d.pas} pasien`,
                      color: '#0d9488',
                    }))}
                    showPercentage={false}
                  />
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* TAB 3: BULANAN 2026 */}
      {tab === 'bulanan' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                  Rekap Bulanan 2026 (Klik Batang Bulan untuk Memfilter)
                </h2>
                <p className="text-xs text-[var(--ink-muted)]">
                  Bulan aktif: <span className="font-semibold text-[var(--accent)]">{MONTHS_SHORT[selectedMonth2026Idx]} 2026</span> · Total {fmtID(monthly2026.tot[selectedMonth2026Idx] || 0)} pemeriksaan
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {MONTHS_SHORT.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonth2026Idx(idx)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                      selectedMonth2026Idx === idx
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--surface-muted)] text-[var(--ink-secondary)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <ComboTrendChart
              labels={MONTHS_SHORT}
              barValues={monthly2026.tot}
              lineValues={monthly2026.tot}
              barLabel="Total Pemeriksaan"
              lineLabel="Tren Bulanan"
              selectedIndex={selectedMonth2026Idx}
              onSelectIndex={(idx) => setSelectedMonth2026Idx(idx)}
              height={265}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
              <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-3">
                Top 10 Pemeriksaan — {MONTHS_SHORT[selectedMonth2026Idx]} 2026
              </h2>
              <HorizontalRankChart items={monthlyTop10} />
            </div>

            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
              <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-4">
                Komposisi Kategori — {MONTHS_SHORT[selectedMonth2026Idx]} 2026
              </h2>
              <InteractiveDonutChart
                slices={monthlyCatSlices}
                centerLabel={MONTHS_SHORT[selectedMonth2026Idx]}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
