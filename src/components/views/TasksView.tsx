import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Check,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { LabTask } from '../../types/lab';
import { MONTHS_FULL } from '../../data/labData';

interface TasksViewProps {
  onNotify: (msg: string) => void;
}

const STORAGE_KEY = 'permata_lab_tasks_v1';

const DEFAULT_TASKS: LabTask[] = [
  {
    text: 'Kalibrasi & Kontrol Harian Hematologi Analyzer',
    done: false,
    due: new Date().toISOString().slice(0, 10),
    prio: 'Tinggi',
    rep: '1',
  },
  {
    text: 'Cek Suhu Kulkas Penyimpanan Reagensia (2–8 °C)',
    done: true,
    due: new Date().toISOString().slice(0, 10),
    prio: 'Sedang',
    rep: '1',
  },
  {
    text: 'Rekap Stok Reagen Order Menjelang Akhir Bulan',
    done: false,
    prio: 'Sedang',
    rep: '30',
  },
];

export function TasksView({ onNotify }: TasksViewProps) {
  const [tasks, setTasks] = useState<LabTask[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_TASKS;
  });

  const [text, setText] = useState('');
  const [due, setDue] = useState('');
  const [prio, setPrio] = useState<'Rendah' | 'Sedang' | 'Tinggi'>('Sedang');
  const [rep, setRep] = useState<'' | '1' | '7' | '30'>('');
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL');
  const [calDate, setCalDate] = useState(() => new Date());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  const addTask = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setTasks((prev) => [{ text: text.trim(), done: false, due: due || undefined, prio, rep }, ...prev]);
    setText('');
    onNotify('Tugas baru ditambahkan.');
  };

  const toggleTask = (idx: number) => {
    const target = tasks[idx];
    if (!target) return;

    const nextDone = !target.done;
    let rescheduledIso: string | null = null;
    if (nextDone && target.rep && target.due) {
      const d = new Date(`${target.due}T00:00:00`);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + Number(target.rep));
        rescheduledIso = d.toISOString().slice(0, 10);
      }
    }

    setTasks((prev) =>
      prev.map((t, i) => {
        if (i !== idx) return t;
        if (rescheduledIso) {
          return { ...t, done: false, due: rescheduledIso };
        }
        return { ...t, done: !t.done };
      })
    );

    if (rescheduledIso) {
      onNotify(`Tugas selesai & dijadwalkan ulang untuk ${rescheduledIso}.`);
    }
  };

  const deleteTask = (idx: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const visibleTasks = useMemo(
    () =>
      tasks
        .map((t, idx) => ({ t, idx }))
        .filter(({ t }) => {
          if (filter === 'OPEN') return !t.done;
          if (filter === 'DONE') return t.done;
          return true;
        }),
    [tasks, filter]
  );

  // Calendar grid
  const calGrid = useMemo(() => {
    const y = calDate.getFullYear();
    const m = calDate.getMonth();
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
    const dim = new Date(y, m + 1, 0).getDate();
    const cells: { day: number | null; iso?: string; count: number }[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ day: null, count: 0 });
    for (let d = 1; d <= dim; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = tasks.filter((t) => !t.done && t.due === iso).length;
      cells.push({ day: d, iso, count });
    }
    return { y, m, cells };
  }, [calDate, tasks]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ tasks, exportedAt: new Date().toISOString() }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permata-lab-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Backup data tugas JSON berhasil diunduh.');
  };

  const importJson = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (Array.isArray(parsed.tasks)) {
          setTasks(parsed.tasks);
          onNotify(`Berhasil mengimpor ${parsed.tasks.length} tugas.`);
        }
      } catch {
        onNotify('File JSON tidak valid.');
      }
    };
    reader.readAsText(f);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-primary)]">
            Dashboard Tasks &amp; Jadwal Laboratorium
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Tersimpan otomatis di perangkat · Mendukung pengulangan tugas &amp; backup JSON
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Impor JSON</span>
            <input type="file" accept="application/json" onChange={importJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-[var(--ink-secondary)]">
            Penyelesaian Tugas ({doneCount} dari {tasks.length})
          </span>
          <span className="font-mono-num text-[var(--accent)]">{pct}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--accent)]"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Form + Task List */}
        <div className="lg:col-span-2 space-y-4">
          <form
            onSubmit={addTask}
            className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4 space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tambah tugas harian/bulanan lab..."
                className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-[var(--ink-primary)]"
              />
              <select
                value={prio}
                onChange={(e) => setPrio(e.target.value as 'Rendah' | 'Sedang' | 'Tinggi')}
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-[var(--ink-primary)]"
              >
                <option value="Rendah">Prioritas Rendah</option>
                <option value="Sedang">Prioritas Sedang</option>
                <option value="Tinggi">Prioritas Tinggi</option>
              </select>
              <select
                value={rep}
                onChange={(e) => setRep(e.target.value as '' | '1' | '7' | '30')}
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-[var(--ink-primary)]"
              >
                <option value="">Sekali jalan</option>
                <option value="1">Ulangi Harian</option>
                <option value="7">Ulangi Mingguan</option>
                <option value="30">Ulangi Bulanan</option>
              </select>
            </div>
          </form>

          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="inline-flex rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] p-0.5 text-xs font-semibold">
                {(['ALL', 'OPEN', 'DONE'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      filter === f
                        ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                        : 'text-[var(--ink-muted)]'
                    }`}
                  >
                    {f === 'ALL' ? 'Semua' : f === 'OPEN' ? 'Belum Selesai' : 'Selesai'}
                  </button>
                ))}
              </div>
              <a
                href="https://calendar.google.com/calendar/u/0/r"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                <span>Google Calendar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2">
              {visibleTasks.map(({ t, idx }) => (
                <div
                  key={`${t.text}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-hairline)] px-3 py-2.5 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(idx)}
                    className="flex items-start gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        t.done
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-[var(--ink-muted)]'
                      }`}
                    >
                      {t.done && <Check className="w-3 h-3" />}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`font-medium ${
                          t.done
                            ? 'line-through text-[var(--ink-muted)]'
                            : 'text-[var(--ink-primary)]'
                        }`}
                      >
                        {t.text}
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                        {t.prio || 'Sedang'}
                        {t.due ? ` · Jatuh tempo ${t.due}` : ''}
                        {t.rep ? ` · Ulang tiap ${t.rep} hari` : ''}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTask(idx)}
                    aria-label="Hapus tugas"
                    className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {!visibleTasks.length && (
                <p className="text-xs text-[var(--ink-muted)] text-center py-6">
                  Tidak ada tugas pada filter ini.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Mini Interactive Calendar */}
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 h-fit">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-primary)]">
              <Calendar className="w-4 h-4 text-[var(--accent)]" />
              <span>
                {MONTHS_FULL[calGrid.m]} {calGrid.y}
              </span>
            </div>
            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setCalDate(new Date(calGrid.y, calGrid.m - 1, 1))}
                className="px-2 py-1 rounded-md border border-[var(--border-hairline)] hover:bg-[var(--surface-muted)] cursor-pointer"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={() => setCalDate(new Date(calGrid.y, calGrid.m + 1, 1))}
                className="px-2 py-1 rounded-md border border-[var(--border-hairline)] hover:bg-[var(--surface-muted)] cursor-pointer"
              >
                &gt;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-semibold text-[var(--ink-muted)] mb-1.5">
            {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono-num">
            {calGrid.cells.map((c, i) => {
              if (!c.day) return <div key={`empty-${i}`} />;
              const isSelected = due === c.iso;
              return (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => setDue(c.iso || '')}
                  className={`relative py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white font-bold'
                      : 'hover:bg-[var(--surface-muted)] text-[var(--ink-primary)]'
                  }`}
                >
                  {c.day}
                  {c.count > 0 && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[var(--accent)]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
