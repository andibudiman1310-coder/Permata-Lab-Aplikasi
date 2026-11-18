import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Pause,
  Play,
  ShieldCheck,
  TestTube2,
} from 'lucide-react';
import {
  AnnualReportData,
  AppSettings,
  MutuYearMap,
  ReagentMonth,
  ViewId,
} from '../../types/lab';
import {
  DEFAULT_ANNOUNCEMENTS,
  fmtID,
  getReagentStatus,
  MONTHS_SHORT,
} from '../../data/labData';
import { AnimatedNumber } from '../charts/AnimatedNumber';
import { ComboTrendChart } from '../charts/ComboTrendChart';

interface HomeViewProps {
  annual: AnnualReportData;
  stokMonths: ReagentMonth[];
  mutuData: MutuYearMap;
  staffMode: boolean;
  settings: AppSettings;
  onNavigate: (view: ViewId) => void;
}

export function HomeView({
  annual,
  stokMonths,
  mutuData,
  staffMode,
  settings,
  onNavigate,
}: HomeViewProps) {
  const announcements =
    settings.announcements.length > 0 ? settings.announcements : DEFAULT_ANNOUNCEMENTS;

  const [selectedYearIdx, setSelectedYearIdx] = useState<number>(
    Math.max(0, annual.years.length - 1)
  );
  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setSelectedYearIdx(Math.max(0, annual.years.length - 1));
  }, [annual.years.length]);

  useEffect(() => {
    setSlideIdx((s) => (s >= announcements.length ? 0 : s));
  }, [announcements.length]);

  useEffect(() => {
    if (paused || announcements.length <= 1) return;
    const id = window.setInterval(() => {
      setSlideIdx((s) => (s + 1) % announcements.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused, announcements.length]);

  const yearTotals = useMemo(
    () =>
      annual.years.map((_, yi) =>
        annual.exams.reduce((sum, [, vals]) => sum + (vals[yi] || 0), 0)
      ),
    [annual]
  );

  const safeIdx = Math.min(selectedYearIdx, Math.max(0, annual.years.length - 1));
  const activeYear = annual.years[safeIdx] ?? 2025;
  const activeExams = yearTotals[safeIdx] ?? 0;
  const activeVisits = annual.visits[safeIdx] ?? 0;
  const prevExams = safeIdx > 0 ? yearTotals[safeIdx - 1] : null;
  const growthPct =
    prevExams && prevExams > 0
      ? Math.round(((activeExams - prevExams) / prevExams) * 1000) / 10
      : null;

  // Latest reagent summary
  const latestStok = stokMonths[stokMonths.length - 1];
  const stokSummary = useMemo(() => {
    if (!latestStok) return { total: 0, perluOrder: 0, aman: 0, expired: 0 };
    let perluOrder = 0;
    let aman = 0;
    let expired = 0;
    latestStok.items.forEach((it) => {
      const st = getReagentStatus(it);
      if (st === 'Habis' || st === 'Order') perluOrder++;
      else if (st === 'Aman') aman++;
      if (/KEDALUWARSA/i.test(it.w)) expired++;
    });
    return {
      total: latestStok.items.length,
      perluOrder,
      aman,
      expired,
    };
  }, [latestStok]);

  // Latest Mutu summary
  const mutuLatest = useMemo(() => {
    const yrs = Object.keys(mutuData).map(Number).sort((a, b) => b - a);
    const yr = yrs[0] ?? 2026;
    const arr = mutuData[yr] || [];
    const filled = arr.map((v, idx) => ({ v, idx })).filter((x) => x.v != null);
    const avg = filled.length
      ? filled.reduce((s, x) => s + (x.v || 0), 0) / filled.length
      : 0;
    const last = filled[filled.length - 1];
    return {
      yr,
      avg: Math.round(avg * 10) / 10,
      lastVal: last?.v ?? 0,
      lastMonth: last ? MONTHS_SHORT[last.idx] : '–',
    };
  }, [mutuData]);

  // Activity feed
  const feedItems = useMemo(() => {
    const topExam = [...annual.exams].sort(
      (a, b) => (b[1][safeIdx] || 0) - (a[1][safeIdx] || 0)
    )[0];
    return [
      {
        title: `Capaian ${activeYear}: ${fmtID(activeExams)} pemeriksaan`,
        sub: `${fmtID(activeVisits)} kunjungan · rasio ${
          activeVisits > 0 ? fmtID(activeExams / activeVisits, 2) : '–'
        } tes/kunjungan`,
        target: 'ringkasan' as ViewId,
        icon: Activity,
      },
      {
        title: topExam
          ? `Terbanyak: ${topExam[0]} (${fmtID(topExam[1][safeIdx] || 0)})`
          : 'Rekap Pemeriksaan',
        sub: 'Klik untuk menelusuri peringkat dan tren jenis pemeriksaan',
        target: 'ringkasan' as ViewId,
        icon: FlaskConical,
      },
      {
        title: `Stok Reagensia ${latestStok?.name || ''}: ${stokSummary.perluOrder} item perlu tindak lanjut`,
        sub: `${stokSummary.aman} aman · ${stokSummary.expired} peringatan kedaluwarsa`,
        target: 'stok' as ViewId,
        icon: AlertTriangle,
      },
      {
        title: `Mutu Waktu Tunggu ${mutuLatest.yr}: rata-rata ${fmtID(mutuLatest.avg, 1)}%`,
        sub: `Bulan terakhir (${mutuLatest.lastMonth}): ${fmtID(mutuLatest.lastVal, 0)}%`,
        target: 'mutu' as ViewId,
        icon: ShieldCheck,
      },
    ];
  }, [annual.exams, safeIdx, activeYear, activeExams, activeVisits, latestStok?.name, stokSummary, mutuLatest]);

  const safeSlideIdx = Math.min(slideIdx, Math.max(0, announcements.length - 1));
  const currentSlide = announcements[safeSlideIdx];

  return (
    <div className="space-y-5">
      {/* Compact Hero */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              {settings.heroKicker}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)]">
              {settings.heroTitle}
            </h1>
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
              {settings.heroDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('ringkasan')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span>Eksplorasi Data Tahunan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('sdqc')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-primary)] text-xs font-semibold hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
            >
              <TestTube2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Grafik QC Levey-Jennings</span>
            </button>
            {staffMode && (
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--ink-primary)] text-xs font-semibold hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
              >
                <CalendarClock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tugas Lab</span>
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* 4 Clickable KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate('ringkasan')}
          className="text-left rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4 sm:p-5 transition-colors hover:border-[var(--accent)]/50 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] font-medium">
            <span>Total Pemeriksaan ({activeYear})</span>
            <Activity className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[var(--ink-primary)] tracking-tight">
            <AnimatedNumber value={activeExams} />
          </div>
          <div className="mt-1.5 text-xs text-[var(--ink-secondary)]">
            {growthPct !== null ? (
              <span className={growthPct >= 0 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                {growthPct >= 0 ? '+' : ''}
                {fmtID(growthPct, 1)}% vs {annual.years[safeIdx - 1]}
              </span>
            ) : (
              <span>Tahun dasar pencatatan</span>
            )}
          </div>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate('ringkasan')}
          className="text-left rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4 sm:p-5 transition-colors hover:border-[var(--accent)]/50 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] font-medium">
            <span>Kunjungan Pasien ({activeYear})</span>
            <FlaskConical className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[var(--ink-primary)] tracking-tight">
            <AnimatedNumber value={activeVisits} />
          </div>
          <div className="mt-1.5 text-xs text-[var(--ink-secondary)]">
            Rasio{' '}
            <span className="font-mono-num font-semibold text-[var(--ink-primary)]">
              {activeVisits > 0 ? fmtID(activeExams / activeVisits, 2) : '–'}
            </span>{' '}
            pemeriksaan/pasien
          </div>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate('stok')}
          className="text-left rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4 sm:p-5 transition-colors hover:border-[var(--accent)]/50 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] font-medium">
            <span>Stok Perlu Order / Habis</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[var(--ink-primary)] tracking-tight">
            <AnimatedNumber value={stokSummary.perluOrder} />
            <span className="text-sm font-normal text-[var(--ink-muted)] ml-1.5">
              / {stokSummary.total} item
            </span>
          </div>
          <div className="mt-1.5 text-xs text-[var(--ink-secondary)]">
            Periode {latestStok?.name || '–'} · {stokSummary.aman} item aman
          </div>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate('mutu')}
          className="text-left rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4 sm:p-5 transition-colors hover:border-[var(--accent)]/50 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] font-medium">
            <span>Mutu Waktu Tunggu ({mutuLatest.yr})</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[var(--ink-primary)] tracking-tight">
            <AnimatedNumber value={mutuLatest.avg} digits={1} suffix="%" />
          </div>
          <div className="mt-1.5 text-xs text-[var(--ink-secondary)]">
            Bulan {mutuLatest.lastMonth}:{' '}
            <span className="font-mono-num font-semibold text-[var(--ink-primary)]">
              {fmtID(mutuLatest.lastVal, 0)}%
            </span>{' '}
            (Target {settings.mutuTarget}%)
          </div>
        </motion.button>
      </section>

      {/* Main Chart + Side Feed */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--ink-primary)]">
                Grafik Pemeriksaan &amp; Kunjungan Lab
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Klik batang tahun pada grafik atau pilih tahun untuk memperbarui ringkasan KPI
              </p>
            </div>
            <select
              aria-label="Pilih Tahun Ringkasan"
              value={safeIdx}
              onChange={(e) => setSelectedYearIdx(Number(e.target.value))}
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {annual.years.map((y, idx) => (
                <option key={y} value={idx}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          <ComboTrendChart
            labels={annual.years.map(String)}
            barValues={yearTotals}
            lineValues={annual.visits}
            barLabel="Total Pemeriksaan"
            lineLabel="Kunjungan Pasien"
            barColor="#1668e3"
            lineColor="#0d9488"
            selectedIndex={safeIdx}
            onSelectIndex={(idx) => setSelectedYearIdx(idx)}
            height={290}
          />
        </div>

        {/* Right column: Activity Feed & Interactive Announcement Carousel */}
        <div className="space-y-5">
          {/* Announcement Carousel */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                {currentSlide.kicker}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setSlideIdx((s) => (s - 1 + announcements.length) % announcements.length)
                  }
                  aria-label="Pengumuman sebelumnya"
                  className="p-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)] cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? 'Putar carousel' : 'Jeda carousel'}
                  className="p-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)] cursor-pointer"
                >
                  {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSlideIdx((s) => (s + 1) % announcements.length)}
                  aria-label="Pengumuman berikutnya"
                  className="p-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)] cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="min-h-[104px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={safeSlideIdx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.22 }}
                >
                  <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                    {currentSlide.title}
                  </h3>
                  <p className="text-xs text-[var(--ink-secondary)] mt-1.5 leading-relaxed">
                    {currentSlide.desc}
                  </p>
                  <p className="text-[11px] font-medium text-[var(--ink-muted)] mt-2.5">
                    {currentSlide.meta}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-1.5 mt-3">
              {announcements.map((a, i) => (
                <button
                  key={`${a.title}-${i}`}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setSlideIdx(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === safeSlideIdx ? 'w-6 bg-[var(--accent)]' : 'w-2 bg-[var(--border-hairline)]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Interactive Activity Feed */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
            <h3 className="text-sm font-bold text-[var(--ink-primary)] mb-3">
              Ringkasan Cepat Laboratorium
            </h3>
            <div className="space-y-2">
              {feedItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => onNavigate(item.target)}
                    className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-[var(--border-hairline)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--ink-primary)] truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 line-clamp-2">
                        {item.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
