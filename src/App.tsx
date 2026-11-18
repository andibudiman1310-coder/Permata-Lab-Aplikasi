import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  BarChart3,
  CheckSquare,
  FlaskConical,
  HelpCircle,
  Home,
  Info,
  Link2,
  Lock,
  MapPin,
  Menu,
  Moon,
  Palette,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sun,
  TestTube2,
  UserCheck,
  X,
} from 'lucide-react';
import {
  AnnualReportData,
  AppSettings,
  DailyMonth,
  KelurahanData,
  Monthly2026Data,
  MutuYearMap,
  PortalLink,
  QcBlock,
  ReagentMonth,
  SpreadsheetSource,
  ThemeMode,
  ViewId,
} from './types/lab';
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_SPREADSHEET_SOURCES,
  FALLBACK_ANNUAL,
  FALLBACK_DAILY_2026,
  FALLBACK_KELURAHAN,
  FALLBACK_MONTHLY_2026,
  FALLBACK_MUTU,
  FALLBACK_QC,
  FALLBACK_STOK,
  PORTAL_LINKS,
  syncAllSpreadsheetSources,
} from './data/labData';
import { HomeView } from './components/views/HomeView';
import { RingkasanView } from './components/views/RingkasanView';
import { StokView } from './components/views/StokView';
import { MutuView } from './components/views/MutuView';
import { KelurahanView } from './components/views/KelurahanView';
import { SdQcView } from './components/views/SdQcView';
import { TasksView } from './components/views/TasksView';
import { LinksView } from './components/views/LinksView';
import { PengaturanView, SettingsTab } from './components/views/PengaturanView';
import { PanduanView } from './components/views/PanduanView';
import { LoginModal } from './components/views/LoginModal';

const THEME_KEY = 'permata_lab_theme_v1';
const SETTINGS_KEY = 'permata_lab_settings_v1';
const SOURCES_KEY = 'permata_lab_sources_v1';
const LINKS_KEY = 'permata_lab_links_v1';

interface NavItem {
  id: ViewId;
  label: string;
  icon: typeof Home;
  staffOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'ringkasan', label: 'Ringkasan Laporan', icon: BarChart3 },
  { id: 'stok', label: 'Stok Reagensia', icon: FlaskConical },
  { id: 'mutu', label: 'Indikator Mutu', icon: ShieldCheck },
  { id: 'kelurahan', label: 'Tren Kelurahan', icon: MapPin },
  { id: 'sdqc', label: 'Standar Deviasi QC', icon: TestTube2 },
  { id: 'tasks', label: 'Tasks & Jadwal', icon: CheckSquare, staffOnly: true },
  { id: 'links', label: 'Portal Tautan', icon: Link2, staffOnly: true },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  { id: 'panduan', label: 'Panduan', icon: HelpCircle },
  { id: 'tentang', label: 'Tentang', icon: Info },
];

export default function App() {
  const [view, setView] = useState<ViewId>('home');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
      if (saved === 'biru' || saved === 'keramik' || saved === 'malam') return saved;
    } catch {
      // ignore
    }
    return 'biru';
  });
  const [staffMode, setStaffMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [lockedScreen, setLockedScreen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_APP_SETTINGS,
          ...parsed,
          security: {
            ...DEFAULT_APP_SETTINGS.security,
            ...(parsed.security || {}),
          },
          announcements: Array.isArray(parsed.announcements)
            ? parsed.announcements
            : DEFAULT_APP_SETTINGS.announcements,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_APP_SETTINGS;
  });

  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('spreadsheet');

  const [sources, setSources] = useState<SpreadsheetSource[]>(() => {
    try {
      const raw = localStorage.getItem(SOURCES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_SPREADSHEET_SOURCES;
  });

  const [portalLinks, setPortalLinks] = useState<PortalLink[]>(() => {
    try {
      const raw = localStorage.getItem(LINKS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return PORTAL_LINKS;
  });

  const sourcesRef = useRef<SpreadsheetSource[]>(sources);
  sourcesRef.current = sources;

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
    } catch {
      // ignore
    }
  }, [sources]);

  useEffect(() => {
    try {
      localStorage.setItem(LINKS_KEY, JSON.stringify(portalLinks));
    } catch {
      // ignore
    }
  }, [portalLinks]);

  // Live / fallback datasets
  const [annual, setAnnual] = useState<AnnualReportData>(FALLBACK_ANNUAL);
  const [stokState, setStokState] = useState<{ months: ReagentMonth[]; live: boolean }>({
    months: FALLBACK_STOK,
    live: false,
  });
  const [mutuState, setMutuState] = useState<{ data: MutuYearMap; live: boolean }>({
    data: FALLBACK_MUTU,
    live: false,
  });
  const [kelurahan, setKelurahan] = useState<KelurahanData>(FALLBACK_KELURAHAN);
  const [daily2026, setDaily2026] = useState<DailyMonth[]>(FALLBACK_DAILY_2026);
  const [monthly2026, setMonthly2026] = useState<Monthly2026Data>(FALLBACK_MONTHLY_2026);
  const [qcState, setQcState] = useState<{ blocks: QcBlock[]; live: boolean }>({
    blocks: FALLBACK_QC,
    live: false,
  });

  const notify = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Apply theme attributes to documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'malam') {
      root.classList.add('dark');
      delete root.dataset.theme;
    } else if (theme === 'keramik') {
      root.classList.remove('dark');
      root.dataset.theme = 'keramik';
    } else {
      root.classList.remove('dark');
      delete root.dataset.theme;
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const loadAllLive = useCallback(
    async (showFeedback = false, customSources?: SpreadsheetSource[]) => {
      setSyncing(true);
      try {
        const targetSources = customSources ?? sourcesRef.current;
        const result = await syncAllSpreadsheetSources(targetSources);
        setAnnual(result.annual);
        setStokState(result.stok);
        setMutuState(result.mutu);
        setKelurahan(result.kelurahan);
        setDaily2026(result.daily2026);
        setMonthly2026(result.monthly2026);
        setQcState(result.qc);
        setSources(result.updatedSources);
        setLastUpdated(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        );
        if (showFeedback) {
          notify(
            result.liveSourceCount > 0
              ? `${result.liveSourceCount} sumber Google Sheets berhasil disinkronkan ke semua grafik.`
              : 'Menggunakan data cadangan tervalidasi (offline/sandbox).'
          );
        }
      } catch {
        if (showFeedback) {
          notify('Gagal menghubungi Google Sheets, menggunakan data cadangan.');
        }
      } finally {
        setSyncing(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    if (settings.autoSync) {
      loadAllLive(false);
    }
  }, [loadAllLive, settings.autoSync]);

  const handleNavigate = (target: ViewId) => {
    if (target === 'pengaturan') {
      setSettingsInitialTab('spreadsheet');
    }
    setView(target);
    setSidebarOpen(false);
  };

  const visibleNav = NAV_ITEMS.filter((item) => !item.staffOnly || staffMode);

  return (
    <div className="min-h-screen flex bg-[var(--canvas)] text-[var(--ink-primary)]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 flex flex-col justify-between border-r border-[var(--border-hairline)] transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          color: 'var(--sidebar-ink)',
        }}
      >
        <div className="p-4 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold tracking-tight leading-none truncate">
                  {settings.portalName}
                </p>
                <p className="text-[10.5px] opacity-75 mt-1 truncate">
                  {settings.unitSubtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10"
              aria-label="Tutup menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'opacity-80 hover:opacity-100 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-2 text-[11px]">
          <div className="flex items-center justify-between opacity-80">
            <span>Pembaruan</span>
            <span className="font-mono-num">{lastUpdated} WITA</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLockedScreen(true);
              setLoginOpen(true);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci Layar Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 border-b border-[var(--border-hairline)] bg-[var(--surface)]/90 backdrop-blur-md px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-primary)]"
                aria-label="Buka navigasi"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <p className="text-xs font-bold text-[var(--ink-primary)]">
                  {NAV_ITEMS.find((n) => n.id === view)?.label || 'Beranda'}
                </p>
                <p className="text-[11px] text-[var(--ink-muted)] hidden sm:block">
                  UPTD Puskesmas Sanga-sanga · Sinkron {lastUpdated} WITA
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Theme Switcher */}
              <div
                className="inline-flex rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] p-0.5 text-[11px] font-semibold"
                role="group"
                aria-label="Pilih Tema Tampilan"
              >
                <button
                  type="button"
                  onClick={() => setTheme('biru')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    theme === 'biru'
                      ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                      : 'text-[var(--ink-muted)]'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span className="hidden sm:inline">Biru</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('keramik')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    theme === 'keramik'
                      ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                      : 'text-[var(--ink-muted)]'
                  }`}
                >
                  <Palette className="w-3 h-3" />
                  <span className="hidden sm:inline">Keramik</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('malam')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    theme === 'malam'
                      ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                      : 'text-[var(--ink-muted)]'
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span className="hidden sm:inline">Malam</span>
                </button>
              </div>

              {/* Staff Mode Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !staffMode;
                  setStaffMode(next);
                  if (!next && (view === 'tasks' || view === 'links')) {
                    setView('home');
                  }
                  notify(next ? 'Mode Petugas aktif.' : 'Mode Publik aktif.');
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  staffMode
                    ? 'border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--ink-secondary)]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {staffMode ? 'Mode Petugas' : 'Mode Publik'}
                </span>
              </button>

              {/* Sync Button */}
              <button
                type="button"
                onClick={() => loadAllLive(true)}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] cursor-pointer disabled:opacity-50"
                title="Sinkronkan ulang dari Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sinkron</span>
              </button>
            </div>
          </div>
        </header>

        {/* Active View Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'home' && (
                <HomeView
                  annual={annual}
                  stokMonths={stokState.months}
                  mutuData={mutuState.data}
                  staffMode={staffMode}
                  settings={settings}
                  onNavigate={handleNavigate}
                />
              )}
              {view === 'ringkasan' && (
                <RingkasanView
                  annual={annual}
                  daily2026={daily2026}
                  monthly2026={monthly2026}
                  onRefresh={() => loadAllLive(true)}
                />
              )}
              {view === 'stok' && (
                <StokView
                  months={stokState.months}
                  live={stokState.live}
                  onNotify={notify}
                />
              )}
              {view === 'mutu' && (
                <MutuView
                  data={mutuState.data}
                  live={mutuState.live}
                  defaultTarget={settings.mutuTarget}
                />
              )}
              {view === 'kelurahan' && <KelurahanView data={kelurahan} />}
              {view === 'sdqc' && (
                <SdQcView
                  blocks={qcState.blocks}
                  live={qcState.live}
                  onRefresh={() => loadAllLive(true)}
                />
              )}
              {view === 'tasks' && <TasksView onNotify={notify} />}
              {view === 'links' && (
                <LinksView
                  links={portalLinks}
                  onOpenSettings={() => {
                    setSettingsInitialTab('tautan');
                    setView('pengaturan');
                    setSidebarOpen(false);
                  }}
                />
              )}
              {view === 'pengaturan' && (
                <PengaturanView
                  initialTab={settingsInitialTab}
                  settings={settings}
                  onUpdateSettings={setSettings}
                  theme={theme}
                  onChangeTheme={setTheme}
                  staffMode={staffMode}
                  onChangeStaffMode={setStaffMode}
                  sources={sources}
                  onUpdateSources={setSources}
                  onSyncSources={(custom) => loadAllLive(true, custom)}
                  syncing={syncing}
                  portalLinks={portalLinks}
                  onUpdatePortalLinks={setPortalLinks}
                  onLockPortal={() => {
                    setLockedScreen(true);
                    setLoginOpen(true);
                  }}
                  onNotify={notify}
                />
              )}
              {(view === 'panduan' || view === 'tentang') && (
                <PanduanView section={view} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Optional Lock / Login Modal */}
      <LoginModal
        open={loginOpen}
        lockedMode={lockedScreen}
        security={settings.security}
        onUnlock={(asStaff) => {
          setLoginOpen(false);
          setLockedScreen(false);
          if (asStaff) setStaffMode(true);
          notify('Akses petugas terverifikasi.');
        }}
        onClose={() => setLoginOpen(false)}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="fixed bottom-5 right-5 z-50 rounded-xl border border-[var(--border-hairline)] bg-[var(--ink-primary)] text-[var(--surface)] px-4 py-2.5 text-xs font-semibold shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
