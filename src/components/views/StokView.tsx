import { Fragment, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCopy,
  ExternalLink,
  Package,
  Search,
} from 'lucide-react';
import { ReagentItem, ReagentMonth } from '../../types/lab';
import {
  fmtID,
  getReagentCatIdx,
  getReagentStatus,
  REAGENT_CATS,
  STOK_SHEET_URL,
} from '../../data/labData';
import { AnimatedNumber } from '../charts/AnimatedNumber';
import { InteractiveDonutChart } from '../charts/InteractiveDonutChart';
import { HorizontalRankChart } from '../charts/HorizontalRankChart';
import { ComboTrendChart } from '../charts/ComboTrendChart';

interface StokViewProps {
  months: ReagentMonth[];
  live: boolean;
  onNotify: (msg: string) => void;
}

function parseExpiredDays(exStr: string): number | null {
  const m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec((exStr || '').trim());
  if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function StokView({ months, live, onNotify }: StokViewProps) {
  const [monthIdx, setMonthIdx] = useState(Math.max(0, months.length - 1));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Aman' | 'Order' | 'Habis'>('ALL');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedReagent, setSelectedReagent] = useState<string>(
    months[months.length - 1]?.items[0]?.n || ''
  );

  const safeIdx = Math.min(monthIdx, Math.max(0, months.length - 1));
  const activeMonth = months[safeIdx] || months[0];

  const stats = useMemo(() => {
    const items = activeMonth?.items || [];
    let aman = 0;
    let order = 0;
    let habis = 0;
    const catCount = Array(REAGENT_CATS.length).fill(0);
    const expList: { item: ReagentItem; days: number | null }[] = [];
    const orderList: ReagentItem[] = [];

    items.forEach((it) => {
      const st = getReagentStatus(it);
      if (st === 'Aman') aman++;
      else if (st === 'Order') {
        order++;
        orderList.push(it);
      } else if (st === 'Habis') {
        habis++;
        orderList.push(it);
      }
      catCount[getReagentCatIdx(it)]++;
      const days = parseExpiredDays(it.ex);
      if (/KEDALUWARSA/i.test(it.w) || (days !== null && days <= 90)) {
        expList.push({ item: it, days });
      }
    });

    return {
      total: items.length,
      aman,
      order,
      habis,
      catCount,
      expList: expList.sort((a, b) => (a.days ?? 999) - (b.days ?? 999)),
      orderList,
    };
  }, [activeMonth]);

  const filteredItems = useMemo(() => {
    const items = activeMonth?.items || [];
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const st = getReagentStatus(it);
      if (statusFilter !== 'ALL' && st !== statusFilter) return false;
      const catName = REAGENT_CATS[getReagentCatIdx(it)];
      if (catFilter !== 'ALL' && catName !== catFilter) return false;
      if (q && !`${it.n} ${it.kd} ${it.s} ${catName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeMonth, search, statusFilter, catFilter]);

  // Usage trend across months for selected reagent
  const reagentTrend = useMemo(() => {
    const name = selectedReagent || activeMonth?.items[0]?.n || '';
    const labels = months.map((m) => m.name);
    const outVals = months.map((m) => m.items.find((it) => it.n === name)?.o ?? 0);
    const endVals = months.map((m) => m.items.find((it) => it.n === name)?.e ?? 0);
    return { name, labels, outVals, endVals };
  }, [months, selectedReagent, activeMonth]);

  // Runway items (< 2 months supply)
  const runwayItems = useMemo(() => {
    const items = activeMonth?.items || [];
    return items
      .filter((it) => it.o > 0)
      .map((it) => ({
        item: it,
        monthsLeft: Math.round((it.e / it.o) * 10) / 10,
      }))
      .sort((a, b) => a.monthsLeft - b.monthsLeft)
      .slice(0, 6);
  }, [activeMonth]);

  const copyOrderList = async () => {
    if (!stats.orderList.length) {
      onNotify('Semua stok reagensia dalam status aman.');
      return;
    }
    const lines = stats.orderList.map((it, idx) => {
      const need = Math.max(1, (it.b || 2) * 2 - it.e);
      return `${idx + 1}. ${it.n} (${it.kd || '-'}) — Stok: ${it.e} ${it.sa}, Buffer: ${it.b ?? '-'}, Saran Order: ${need} ${it.sa}`;
    });
    const text = `DAFTAR ORDER REAGENSIA (${activeMonth?.name} ${activeMonth?.yr || ''}):\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`${stats.orderList.length} item daftar order disalin ke clipboard.`);
    } catch {
      onNotify('Tidak dapat mengakses clipboard browser.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-primary)]">
            Monitoring Stok Reagensia &amp; BMHP
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            {live ? 'Terhubung Google Sheets Live' : 'Data Cadangan Tervalidasi'} · Klik kartu KPI untuk memfilter tabel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] p-1">
            {months.map((m, i) => (
              <button
                key={`${m.name}-${i}`}
                type="button"
                onClick={() => setMonthIdx(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  safeIdx === i
                    ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={copyOrderList}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            <span>Salin Daftar Order ({stats.orderList.length})</span>
          </button>

          <a
            href={STOK_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-muted)]"
          >
            <span>Buka Sheet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 4 Interactive Status KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { key: 'ALL' as const, label: 'Total Reagen Aktif', val: stats.total, color: 'text-[var(--ink-primary)]', icon: Package },
          { key: 'Aman' as const, label: 'Status Aman', val: stats.aman, color: 'text-emerald-600', icon: CheckCircle2 },
          { key: 'Order' as const, label: 'Perlu Order (≤ Buffer)', val: stats.order, color: 'text-amber-600', icon: AlertTriangle },
          { key: 'Habis' as const, label: 'Stok Habis (0)', val: stats.habis, color: 'text-rose-600', icon: AlertTriangle },
        ].map((card) => {
          const Icon = card.icon;
          const active = statusFilter === card.key;
          return (
            <motion.button
              key={card.key}
              type="button"
              whileHover={{ y: -2 }}
              onClick={() => setStatusFilter(active && card.key !== 'ALL' ? 'ALL' : card.key)}
              className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]/45'
                  : 'border-[var(--border-hairline)] bg-[var(--surface)] hover:border-[var(--accent)]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] font-medium">
                <span>{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className={`text-2xl font-bold mt-1.5 ${card.color}`}>
                <AnimatedNumber value={card.val} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Expired Alert Banner */}
      {stats.expList.length > 0 && (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/8 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Peringatan Masa Kedaluwarsa ({stats.expList.length} item dalam ≤ 90 hari)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {stats.expList.map(({ item, days }) => (
              <div
                key={item.n}
                className="flex items-center justify-between gap-2 rounded-xl bg-[var(--surface)] border border-[var(--border-hairline)] px-3 py-2 text-xs"
              >
                <span className="font-medium text-[var(--ink-primary)] truncate">{item.n}</span>
                <span className="font-mono-num shrink-0 font-semibold text-amber-700 dark:text-amber-400">
                  {item.ex || '–'}
                  {days !== null && ` (${days < 0 ? 'Lewat' : `${days}h`})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-3">
            Komposisi Status Stok
          </h2>
          <InteractiveDonutChart
            slices={[
              { label: 'Aman', value: stats.aman, color: '#10b981' },
              { label: 'Order', value: stats.order, color: '#f59e0b' },
              { label: 'Habis', value: stats.habis, color: '#e11d48' },
            ]}
            centerLabel={activeMonth?.name}
            size={185}
            selectedLabel={statusFilter === 'ALL' ? null : statusFilter}
            onSelectSlice={(lbl) =>
              setStatusFilter(lbl === statusFilter ? 'ALL' : (lbl as 'Aman' | 'Order' | 'Habis'))
            }
          />
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-3">
            Sebaran Reagen per Kategori
          </h2>
          <HorizontalRankChart
            items={REAGENT_CATS.map((cat, idx) => ({
              id: cat,
              label: cat,
              value: stats.catCount[idx] || 0,
            }))}
            selectedId={catFilter === 'ALL' ? null : catFilter}
            onSelectItem={(cat) => setCatFilter(cat === catFilter ? 'ALL' : cat)}
          />
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="text-sm font-bold text-[var(--ink-primary)]">
              Pemakaian vs Sisa Stok
            </h2>
            <select
              aria-label="Pilih Reagen Tren"
              value={reagentTrend.name}
              onChange={(e) => setSelectedReagent(e.target.value)}
              className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-2 py-1 text-[11px] font-semibold text-[var(--ink-primary)] max-w-[140px]"
            >
              {(activeMonth?.items || []).map((it) => (
                <option key={it.n} value={it.n}>
                  {it.n}
                </option>
              ))}
            </select>
          </div>
          <ComboTrendChart
            labels={reagentTrend.labels}
            barValues={reagentTrend.outVals}
            lineValues={reagentTrend.endVals}
            barLabel="Keluar"
            lineLabel="Sisa Akhir"
            barColor="#d97706"
            lineColor="#1668e3"
            height={195}
          />
        </div>
      </div>

      {/* Supply Runway Gauge */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--ink-primary)]">
              Kecukupan Stok (Runway Pemakaian Bulanan)
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Estimasi ketahanan stok akhir terhadap laju pemakaian keluar per bulan (batas aman ≥ 1,0 bulan)
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {runwayItems.map(({ item, monthsLeft }) => {
            const pct = Math.min(100, (monthsLeft / 3) * 100);
            const barCol =
              monthsLeft < 0.7
                ? '#e11d48'
                : monthsLeft < 1.2
                ? '#f59e0b'
                : '#10b981';
            return (
              <div
                key={item.n}
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)]/60 p-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                  <span className="font-semibold text-[var(--ink-primary)] truncate">
                    {item.n}
                  </span>
                  <span className="font-mono-num font-bold shrink-0" style={{ color: barCol }}>
                    {fmtID(monthsLeft, 1)} bln
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-[var(--surface)] overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[var(--ink-muted)]/50 z-10"
                    style={{ left: '33.3%' }}
                    title="Batas 1 bulan"
                  />
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barCol, transformOrigin: 'left' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: pct / 100 }}
                    transition={{ duration: 0.45 }}
                  />
                </div>
                <p className="text-[11px] text-[var(--ink-muted)] mt-1.5 font-mono-num">
                  Stok {item.e} {item.sa} · Keluar {item.o}/{item.sa} bln
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Searchable Expandable Table */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama reagen, kode, sumber..."
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] pl-9 pr-3 py-2 text-xs text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(statusFilter !== 'ALL' || catFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setCatFilter('ALL');
                }}
                className="text-[var(--accent)] font-semibold hover:underline cursor-pointer"
              >
                Reset Filter ({filteredItems.length} tampil)
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] text-[var(--ink-muted)]">
                <th className="py-2.5 px-2 text-left font-semibold">Reagen</th>
                <th className="py-2.5 px-2 text-left font-semibold">Kategori</th>
                <th className="py-2.5 px-2 text-right font-semibold">Awal</th>
                <th className="py-2.5 px-2 text-right font-semibold">Masuk</th>
                <th className="py-2.5 px-2 text-right font-semibold">Keluar</th>
                <th className="py-2.5 px-2 text-right font-semibold">Akhir</th>
                <th className="py-2.5 px-2 text-right font-semibold">Buffer</th>
                <th className="py-2.5 px-2 text-left font-semibold">Status</th>
                <th className="py-2.5 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it) => {
                const st = getReagentStatus(it);
                const cat = REAGENT_CATS[getReagentCatIdx(it)];
                const isOpen = expandedRow === it.n;
                const stColor =
                  st === 'Habis'
                    ? 'text-rose-600'
                    : st === 'Order'
                    ? 'text-amber-600'
                    : 'text-emerald-600';

                return (
                  <Fragment key={it.n}>
                    <tr
                      onClick={() => setExpandedRow(isOpen ? null : it.n)}
                      className="border-b border-[var(--border-hairline)] hover:bg-[var(--surface-muted)]/60 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-2 font-medium text-[var(--ink-primary)]">
                        {it.n}
                        <span className="block text-[11px] text-[var(--ink-muted)]">
                          {it.kd || '–'} · {it.s || '–'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-[var(--ink-secondary)]">{cat}</td>
                      <td className="py-2.5 px-2 text-right font-mono-num">{fmtID(it.a)}</td>
                      <td className="py-2.5 px-2 text-right font-mono-num text-emerald-600">
                        +{fmtID(it.i)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono-num text-amber-600">
                        -{fmtID(it.o)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono-num font-bold text-[var(--ink-primary)]">
                        {fmtID(it.e)} {it.sa}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono-num text-[var(--ink-muted)]">
                        {it.b ?? '–'}
                      </td>
                      <td className={`py-2.5 px-2 font-bold ${stColor}`}>{st}</td>
                      <td className="py-2.5 px-2 text-right">
                        <ChevronDown
                          className={`w-4 h-4 text-[var(--ink-muted)] transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </td>
                    </tr>
                    <AnimatePresence>
                      {isOpen && (
                        <tr>
                          <td colSpan={9} className="bg-[var(--surface-muted)]/40 px-4 py-3">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-secondary)]"
                            >
                              <span>
                                Kedaluwarsa: <strong className="text-[var(--ink-primary)]">{it.ex || 'Tidak tercatat'}</strong>
                                {it.w ? ` · ${it.w}` : ''}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReagent(it.n);
                                }}
                                className="text-[var(--accent)] font-semibold hover:underline cursor-pointer"
                              >
                                Tampilkan pada Grafik Pemakaian
                              </button>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
