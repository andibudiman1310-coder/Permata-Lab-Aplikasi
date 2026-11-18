import { useMemo, useState } from 'react';
import { ExternalLink, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { QcBlock } from '../../types/lab';
import { fmtID, QC_SHEET_URL } from '../../data/labData';
import { getWestgardStatus, LeveyJenningsChart } from '../charts/LeveyJenningsChart';

interface SdQcViewProps {
  blocks: QcBlock[];
  live: boolean;
  onRefresh?: () => void;
}

export function SdQcView({ blocks, live, onRefresh }: SdQcViewProps) {
  const [group, setGroup] = useState<'hematologi' | 'kimia'>('hematologi');
  const groupBlocks = useMemo(
    () => blocks.filter((b) => b.group === group),
    [blocks, group]
  );

  const params = useMemo(
    () => Array.from(new Set(groupBlocks.map((b) => b.param))),
    [groupBlocks]
  );

  const [selectedParam, setSelectedParam] = useState<string>(params[0] || '');
  const activeParam = params.includes(selectedParam) ? selectedParam : params[0] || '';

  const paramBlocks = useMemo(
    () => groupBlocks.filter((b) => b.param === activeParam),
    [groupBlocks, activeParam]
  );

  const [selectedBlockLabel, setSelectedBlockLabel] = useState<string>(
    paramBlocks[0]?.label || ''
  );
  const activeBlock =
    paramBlocks.find((b) => b.label === selectedBlockLabel) || paramBlocks[0];

  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);

  const metrics = useMemo(() => {
    if (!activeBlock) return null;
    const { mean, sd, pts } = activeBlock;
    const cv = mean > 0 ? (sd / mean) * 100 : 0;
    const digits = Math.abs(mean) < 20 ? 2 : Math.abs(mean) < 100 ? 1 : 0;
    let warnCount = 0;
    let rejectCount = 0;
    const rows = pts.map((p, i) => {
      const z = sd > 0 ? (p.v - mean) / sd : 0;
      const wg = getWestgardStatus(z);
      if (wg.level === 'warn') warnCount++;
      if (wg.level === 'reject') rejectCount++;
      return { ...p, i, z, wg };
    });
    return {
      mean,
      sd,
      cv,
      digits,
      warnCount,
      rejectCount,
      rows,
    };
  }, [activeBlock]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-primary)]">
            Standar Deviasi QC (Levey-Jennings)
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            {live ? 'Terhubung Google Sheets QC Live' : 'Data Kontrol Cadangan'} · Klik titik grafik untuk menyorot baris hasil
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <a
            href={QC_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-muted)]"
          >
            <span>Buka Sheet QC</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setGroup('hematologi');
              setSelectedPointIdx(null);
            }}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              group === 'hematologi'
                ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                : 'text-[var(--ink-muted)]'
            }`}
          >
            Hematologi
          </button>
          <button
            type="button"
            onClick={() => {
              setGroup('kimia');
              setSelectedPointIdx(null);
            }}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              group === 'kimia'
                ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                : 'text-[var(--ink-muted)]'
            }`}
          >
            Kimia Klinik
          </button>
        </div>

        <select
          aria-label="Pilih Parameter QC"
          value={activeParam}
          onChange={(e) => {
            setSelectedParam(e.target.value);
            setSelectedPointIdx(null);
          }}
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)]"
        >
          {params.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          aria-label="Pilih Periode atau Lot QC"
          value={activeBlock?.label || ''}
          onChange={(e) => {
            setSelectedBlockLabel(e.target.value);
            setSelectedPointIdx(null);
          }}
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)]"
        >
          {paramBlocks.map((b) => (
            <option key={b.label} value={b.label}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {activeBlock && metrics && (
        <>
          {/* Telemetry Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--ink-muted)]">Mean (Rata-rata)</p>
              <p className="text-xl font-bold font-mono-num text-[var(--ink-primary)] mt-1">
                {fmtID(metrics.mean, metrics.digits)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--ink-muted)]">Standar Deviasi (SD)</p>
              <p className="text-xl font-bold font-mono-num text-[var(--ink-primary)] mt-1">
                {fmtID(metrics.sd, 2)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--ink-muted)]">Koefisien Variasi (CV%)</p>
              <p className="text-xl font-bold font-mono-num text-[var(--accent)] mt-1">
                {fmtID(metrics.cv, 2)}%
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--ink-muted)]">Jumlah Titik Kontrol</p>
              <p className="text-xl font-bold font-mono-num text-[var(--ink-primary)] mt-1">
                {activeBlock.pts.length}
              </p>
            </div>
            <div className="col-span-2 md:col-span-1 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--ink-muted)]">Status Westgard</p>
              <div className="flex items-center gap-1.5 mt-1">
                {metrics.rejectCount > 0 ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span className="text-sm font-bold text-rose-600">
                      {metrics.rejectCount} Tolak (1-3s)
                    </span>
                  </>
                ) : metrics.warnCount > 0 ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-600">
                      {metrics.warnCount} Peringatan (1-2s)
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-600">Terkendali</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Levey-Jennings Chart */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                  Grafik Kontrol {activeBlock.param} · {activeBlock.label}
                </h2>
                <p className="text-xs text-[var(--ink-muted)]">{activeBlock.source}</p>
              </div>
            </div>
            <LeveyJenningsChart
              block={activeBlock}
              selectedIndex={selectedPointIdx}
              onSelectPoint={(idx) =>
                setSelectedPointIdx((cur) => (cur === idx ? null : idx))
              }
            />
          </div>

          {/* Detail Table Synced with Chart */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-bold text-[var(--ink-primary)] mb-3">
              Rincian Nilai Kontrol Harian
            </h2>
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 bg-[var(--surface)]">
                  <tr className="border-b border-[var(--border-hairline)] text-[var(--ink-muted)]">
                    <th className="py-2 px-2 text-left font-semibold">#</th>
                    <th className="py-2 px-2 text-left font-semibold">Tanggal / Hari</th>
                    <th className="py-2 px-2 text-right font-semibold">Nilai QC</th>
                    <th className="py-2 px-2 text-right font-semibold">Z-Score</th>
                    <th className="py-2 px-2 text-left font-semibold">Aturan Westgard</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.rows.map((r) => {
                    const isSel = selectedPointIdx === r.i;
                    return (
                      <tr
                        key={`${r.d}-${r.i}`}
                        onClick={() => setSelectedPointIdx(isSel ? null : r.i)}
                        className={`border-b border-[var(--border-hairline)] last:border-b-0 cursor-pointer transition-colors ${
                          isSel
                            ? 'bg-[var(--accent-soft)]'
                            : 'hover:bg-[var(--surface-muted)]/60'
                        }`}
                      >
                        <td className="py-2 px-2 font-mono-num text-[var(--ink-muted)]">
                          {r.i + 1}
                        </td>
                        <td className="py-2 px-2 font-medium text-[var(--ink-primary)]">
                          {r.d}
                        </td>
                        <td className="py-2 px-2 text-right font-mono-num font-bold text-[var(--ink-primary)]">
                          {fmtID(r.v, metrics.digits)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono-num">
                          {r.z >= 0 ? '+' : ''}
                          {fmtID(r.z, 2)} SD
                        </td>
                        <td
                          className={`py-2 px-2 font-semibold ${
                            r.wg.level === 'reject'
                              ? 'text-rose-600'
                              : r.wg.level === 'warn'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {r.wg.tag} · {r.wg.desc}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
