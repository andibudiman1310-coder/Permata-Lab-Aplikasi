import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Search, Settings, Star } from 'lucide-react';
import { LinkCategory, PortalLink } from '../../types/lab';

const FAV_KEY = 'permata_lab_favs_v1';

const CAT_LABELS: { id: 'ALL' | LinkCategory; label: string }[] = [
  { id: 'ALL', label: 'Semua Tautan' },
  { id: 'laporan', label: 'Laporan & Spreadsheet' },
  { id: 'aplikasi', label: 'Aplikasi Kemenkes & TB/HIV' },
  { id: 'stok', label: 'Stok & Kendali Mutu' },
  { id: 'link', label: 'Portal Pegawai & Daerah' },
  { id: 'catatan', label: 'Kalender & Catatan' },
];

interface LinksViewProps {
  links: PortalLink[];
  onOpenSettings?: () => void;
}

export function LinksView({ links, onOpenSettings }: LinksViewProps) {
  const [category, setCategory] = useState<'ALL' | LinkCategory>('ALL');
  const [search, setSearch] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [favs, setFavs] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch {
      // ignore
    }
  }, [favs]);

  const toggleFav = (title: string) => {
    setFavs((prev) =>
      prev.includes(title) ? prev.filter((x) => x !== title) : [...prev, title]
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return links
      .filter((l) => {
        if (category !== 'ALL' && l.category !== category) return false;
        if (onlyFav && !favs.includes(l.title)) return false;
        if (q && !`${l.title} ${l.subtitle}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const fa = favs.includes(a.title) ? 1 : 0;
        const fb = favs.includes(b.title) ? 1 : 0;
        return fb - fa;
      });
  }, [links, category, search, onlyFav, favs]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-primary)]">
            Portal Tautan &amp; Aplikasi Internal Lab
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Kumpulan tautan resmi pelaporan, aplikasi nasional, spreadsheet stok, serta instrumen kendali mutu
          </p>
        </div>
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Edit / Tambah Link</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tautan aplikasi atau spreadsheet..."
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] pl-9 pr-3 py-2 text-xs text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setOnlyFav((f) => !f)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
              onlyFav
                ? 'border-amber-500/50 bg-amber-500/12 text-amber-600'
                : 'border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-secondary)]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFav ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>Favorit ({favs.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CAT_LABELS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                category === c.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-muted)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((item, idx) => {
          const isFav = favs.includes(item.title);
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.25) }}
              className="group rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4 flex flex-col justify-between gap-3 hover:border-[var(--accent)]/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xl leading-none mt-0.5 shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-[var(--ink-primary)] leading-snug">
                      {item.title}
                    </h2>
                    <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                      {item.subtitle}
                      {item.internal ? ' · INTERNAL' : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFav(item.title)}
                  aria-label="Tandai favorit"
                  className="p-1 rounded-lg hover:bg-[var(--surface-muted)] cursor-pointer shrink-0"
                >
                  <Star
                    className={`w-4 h-4 ${
                      isFav ? 'fill-amber-400 text-amber-500' : 'text-[var(--ink-muted)]'
                    }`}
                  />
                </button>
              </div>

              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--surface-muted)] text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
              >
                <span>Buka Tautan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
