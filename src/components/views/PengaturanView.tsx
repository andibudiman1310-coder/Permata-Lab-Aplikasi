import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Database,
  Download,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  Link2,
  Lock,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Sliders,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  AnnouncementItem,
  AppSettings,
  LinkCategory,
  PortalLink,
  SpreadsheetDatasetKind,
  SpreadsheetSource,
  ThemeMode,
} from '../../types/lab';
import {
  buildSpreadsheetEditUrl,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_APP_SETTINGS,
  DEFAULT_PORTAL_PASSWORD_HASH,
  DEFAULT_SECURITY_QUESTION,
  DEFAULT_SPREADSHEET_SOURCES,
  extractGoogleSheetInfo,
  PORTAL_LINKS,
  RECOVERY_HASH,
  SEC_ANSWER_HASH,
  sha256,
} from '../../data/labData';

export type SettingsTab = 'umum' | 'spreadsheet' | 'tautan' | 'keamanan' | 'backup';

interface PengaturanViewProps {
  initialTab?: SettingsTab;
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
  theme: ThemeMode;
  onChangeTheme: (t: ThemeMode) => void;
  staffMode: boolean;
  onChangeStaffMode: (val: boolean) => void;
  sources: SpreadsheetSource[];
  onUpdateSources: (next: SpreadsheetSource[]) => void;
  onSyncSources: (customSources?: SpreadsheetSource[]) => Promise<void>;
  syncing: boolean;
  portalLinks: PortalLink[];
  onUpdatePortalLinks: (next: PortalLink[]) => void;
  onLockPortal: () => void;
  onNotify: (msg: string) => void;
}

const KIND_LABELS: { id: SpreadsheetDatasetKind; label: string }[] = [
  { id: 'annual', label: 'Laporan Tahunan Lab (Beranda & Ringkasan)' },
  { id: 'mutu', label: 'Indikator Mutu Waktu Tunggu' },
  { id: 'kelurahan', label: 'Tren Pemeriksaan per Kelurahan' },
  { id: 'stok', label: 'Stok Opname Reagensia' },
  { id: 'monthly', label: 'Rekap Bulanan (REKAP TAHUNAN)' },
  { id: 'qc_hematologi', label: 'Standar Deviasi QC Hematologi' },
  { id: 'qc_kimia', label: 'Standar Deviasi QC Kimia Klinik' },
];

const LINK_CAT_OPTIONS: { id: LinkCategory; label: string }[] = [
  { id: 'laporan', label: 'Laporan & Spreadsheet' },
  { id: 'aplikasi', label: 'Aplikasi Kemenkes & TB/HIV' },
  { id: 'stok', label: 'Stok & Kendali Mutu' },
  { id: 'link', label: 'Portal Pegawai & Daerah' },
  { id: 'catatan', label: 'Kalender & Catatan' },
];

export function PengaturanView({
  initialTab = 'spreadsheet',
  settings,
  onUpdateSettings,
  theme,
  onChangeTheme,
  staffMode,
  onChangeStaffMode,
  sources,
  onUpdateSources,
  onSyncSources,
  syncing,
  portalLinks,
  onUpdatePortalLinks,
  onLockPortal,
  onNotify,
}: PengaturanViewProps) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // ---------- TAB 1: UMUM & PENGUMUMAN ----------
  const [portalForm, setPortalForm] = useState({
    portalName: settings.portalName,
    unitSubtitle: settings.unitSubtitle,
    heroKicker: settings.heroKicker,
    heroTitle: settings.heroTitle,
    heroDesc: settings.heroDesc,
    autoSync: settings.autoSync,
    mutuTarget: settings.mutuTarget,
  });

  useEffect(() => {
    setPortalForm({
      portalName: settings.portalName,
      unitSubtitle: settings.unitSubtitle,
      heroKicker: settings.heroKicker,
      heroTitle: settings.heroTitle,
      heroDesc: settings.heroDesc,
      autoSync: settings.autoSync,
      mutuTarget: settings.mutuTarget,
    });
  }, [settings]);

  const [newAnn, setNewAnn] = useState<AnnouncementItem>({
    kicker: 'Pemberitahuan Lab',
    title: '',
    desc: '',
    meta: 'UPTD Puskesmas Sanga-sanga',
  });

  const saveGeneral = (e: FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      ...portalForm,
    });
    onNotify('Pengaturan umum & tampilan disimpan.');
  };

  const addAnnouncement = (e: FormEvent) => {
    e.preventDefault();
    if (!newAnn.title.trim() || !newAnn.desc.trim()) return;
    onUpdateSettings({
      ...settings,
      announcements: [...settings.announcements, { ...newAnn }],
    });
    setNewAnn({
      kicker: 'Pemberitahuan Lab',
      title: '',
      desc: '',
      meta: 'UPTD Puskesmas Sanga-sanga',
    });
    onNotify('Pengumuman baru ditambahkan ke Beranda.');
  };

  const removeAnnouncement = (idx: number) => {
    const next = settings.announcements.filter((_, i) => i !== idx);
    onUpdateSettings({
      ...settings,
      announcements: next.length ? next : DEFAULT_ANNOUNCEMENTS,
    });
    onNotify('Pengumuman dihapus.');
  };

  // ---------- TAB 2: SUMBER SPREADSHEET ----------
  const [newSrcLabel, setNewSrcLabel] = useState('');
  const [newSrcKind, setNewSrcKind] = useState<SpreadsheetDatasetKind>('annual');
  const [newSrcUrlOrId, setNewSrcUrlOrId] = useState('');
  const [newSrcGid, setNewSrcGid] = useState('');
  const [newSrcTabName, setNewSrcTabName] = useState('');
  const [editingSrcId, setEditingSrcId] = useState<string | null>(null);
  const [editSrcDraft, setEditSrcDraft] = useState<SpreadsheetSource | null>(null);

  const extractedPreview = useMemo(
    () => extractGoogleSheetInfo(newSrcUrlOrId),
    [newSrcUrlOrId]
  );

  const handleAddSource = async (e: FormEvent) => {
    e.preventDefault();
    const { sheetId, gid } = extractGoogleSheetInfo(newSrcUrlOrId);
    if (!sheetId) {
      onNotify('Masukkan URL Google Sheets atau Spreadsheet ID yang valid.');
      return;
    }
    const label =
      newSrcLabel.trim() ||
      `${KIND_LABELS.find((k) => k.id === newSrcKind)?.label.split('(')[0].trim()} (Tambahan)`;
    const created: SpreadsheetSource = {
      id: `extra-${Date.now()}`,
      label,
      kind: newSrcKind,
      sheetId,
      gid: newSrcGid.trim() || gid || (newSrcTabName.trim() ? undefined : '0'),
      sheetName: newSrcTabName.trim() || undefined,
      enabled: true,
      isPrimary: false,
      lastStatus: 'idle',
    };
    const next = [...sources, created];
    onUpdateSources(next);
    setNewSrcLabel('');
    setNewSrcUrlOrId('');
    setNewSrcGid('');
    setNewSrcTabName('');
    onNotify(`Sumber "${created.label}" ditambahkan. Menyinkronkan ke seluruh grafik...`);
    await onSyncSources(next);
  };

  const saveEditSource = async () => {
    if (!editSrcDraft) return;
    const { sheetId, gid } = extractGoogleSheetInfo(editSrcDraft.sheetId);
    const cleaned: SpreadsheetSource = {
      ...editSrcDraft,
      sheetId: sheetId || editSrcDraft.sheetId,
      gid: editSrcDraft.gid?.trim() || gid,
      sheetName: editSrcDraft.sheetName?.trim() || undefined,
    };
    const next = sources.map((s) => (s.id === cleaned.id ? cleaned : s));
    onUpdateSources(next);
    setEditingSrcId(null);
    setEditSrcDraft(null);
    onNotify(`Sumber "${cleaned.label}" diperbarui. Menyinkronkan ulang...`);
    await onSyncSources(next);
  };

  const toggleSourceEnabled = async (id: string) => {
    const next = sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    onUpdateSources(next);
    await onSyncSources(next);
  };

  const removeSource = async (id: string) => {
    const next = sources.filter((s) => s.id !== id);
    onUpdateSources(next);
    onNotify('Sumber spreadsheet tambahan dihapus.');
    await onSyncSources(next);
  };

  // ---------- TAB 3: KELOLA PORTAL TAUTAN ----------
  const [linkFilterCat, setLinkFilterCat] = useState<'ALL' | LinkCategory>('ALL');
  const [linkSearch, setLinkSearch] = useState('');
  const [newLink, setNewLink] = useState<PortalLink>({
    title: '',
    subtitle: '',
    href: '',
    icon: '🔗',
    category: 'laporan',
    internal: false,
  });
  const [editingLinkIdx, setEditingLinkIdx] = useState<number | null>(null);
  const [editLinkDraft, setEditLinkDraft] = useState<PortalLink | null>(null);

  const visibleLinks = useMemo(() => {
    const q = linkSearch.trim().toLowerCase();
    return portalLinks
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => {
        if (linkFilterCat !== 'ALL' && item.category !== linkFilterCat) return false;
        if (q && !`${item.title} ${item.subtitle} ${item.href}`.toLowerCase().includes(q)) return false;
        return true;
      });
  }, [portalLinks, linkFilterCat, linkSearch]);

  const handleAddLink = (e: FormEvent) => {
    e.preventDefault();
    if (!newLink.title.trim() || !newLink.href.trim()) {
      onNotify('Judul dan URL tautan wajib diisi.');
      return;
    }
    const cleanHref = /^https?:\/\//i.test(newLink.href.trim())
      ? newLink.href.trim()
      : `https://${newLink.href.trim()}`;
    onUpdatePortalLinks([
      {
        ...newLink,
        title: newLink.title.trim(),
        subtitle: newLink.subtitle.trim() || 'Tautan Eksternal',
        href: cleanHref,
        icon: newLink.icon.trim() || '🔗',
      },
      ...portalLinks,
    ]);
    setNewLink({
      title: '',
      subtitle: '',
      href: '',
      icon: '🔗',
      category: newLink.category,
      internal: false,
    });
    onNotify('Link baru berhasil ditambahkan ke Portal Tautan.');
  };

  const saveEditLink = () => {
    if (editingLinkIdx === null || !editLinkDraft) return;
    if (!editLinkDraft.title.trim() || !editLinkDraft.href.trim()) {
      onNotify('Judul dan URL tautan tidak boleh kosong.');
      return;
    }
    const cleanHref = /^https?:\/\//i.test(editLinkDraft.href.trim())
      ? editLinkDraft.href.trim()
      : `https://${editLinkDraft.href.trim()}`;
    const updated = portalLinks.map((l, i) =>
      i === editingLinkIdx ? { ...editLinkDraft, href: cleanHref } : l
    );
    onUpdatePortalLinks(updated);
    setEditingLinkIdx(null);
    setEditLinkDraft(null);
    onNotify('Perubahan link disimpan.');
  };

  const deleteLink = (idx: number) => {
    onUpdatePortalLinks(portalLinks.filter((_, i) => i !== idx));
    onNotify('Link dihapus dari Portal Tautan.');
  };

  // ---------- TAB 4: KEAMANAN & KUNCI PORTAL ----------
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [secQuestion, setSecQuestion] = useState(settings.security.securityQuestion);
  const [secAnswer, setSecAnswer] = useState('');
  const [newRecoveryCode, setNewRecoveryCode] = useState('');

  const isDefaultPassword = settings.security.passwordHash === DEFAULT_PORTAL_PASSWORD_HASH;
  const isDefaultRecovery = settings.security.recoveryHash === RECOVERY_HASH;

  const updatePortalPassword = (e: FormEvent) => {
    e.preventDefault();
    if (sha256(curPw.trim()) !== settings.security.passwordHash) {
      onNotify('Kata sandi saat ini tidak cocok.');
      return;
    }
    if (newPw.trim().length < 6) {
      onNotify('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPw.trim() !== confirmPw.trim()) {
      onNotify('Konfirmasi kata sandi tidak sama.');
      return;
    }
    onUpdateSettings({
      ...settings,
      security: {
        ...settings.security,
        passwordHash: sha256(newPw.trim()),
      },
    });
    setCurPw('');
    setNewPw('');
    setConfirmPw('');
    onNotify('Kata sandi layar portal berhasil diperbarui.');
  };

  const updateRecoveryConfig = (e: FormEvent) => {
    e.preventDefault();
    const nextSec = { ...settings.security };
    if (secQuestion.trim()) nextSec.securityQuestion = secQuestion.trim();
    if (secAnswer.trim()) nextSec.securityAnswerHash = sha256(secAnswer.trim().toLowerCase());
    if (newRecoveryCode.trim()) nextSec.recoveryHash = sha256(newRecoveryCode.trim());
    onUpdateSettings({
      ...settings,
      security: nextSec,
    });
    setSecAnswer('');
    setNewRecoveryCode('');
    onNotify('Kode pemulihan & pertanyaan keamanan berhasil diperbarui.');
  };

  const resetSecurityDefaults = () => {
    onUpdateSettings({
      ...settings,
      security: {
        passwordHash: DEFAULT_PORTAL_PASSWORD_HASH,
        recoveryHash: RECOVERY_HASH,
        securityQuestion: DEFAULT_SECURITY_QUESTION,
        securityAnswerHash: SEC_ANSWER_HASH,
      },
    });
    setSecQuestion(DEFAULT_SECURITY_QUESTION);
    onNotify('Keamanan dikembalikan ke default (sandi: labpermata2026).');
  };

  // ---------- TAB 5: BACKUP & RESET ----------
  const exportAllConfig = () => {
    const payload = {
      settings,
      sources,
      portalLinks,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permata-lab-konfigurasi-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Seluruh pengaturan, sumber spreadsheet & link diekspor ke JSON.');
  };

  const importAllConfig = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (parsed.settings) onUpdateSettings({ ...DEFAULT_APP_SETTINGS, ...parsed.settings });
        if (Array.isArray(parsed.sources)) onUpdateSources(parsed.sources);
        if (Array.isArray(parsed.portalLinks)) onUpdatePortalLinks(parsed.portalLinks);
        onNotify('Konfigurasi, sumber spreadsheet, & link berhasil diimpor.');
      } catch {
        onNotify('File JSON konfigurasi tidak valid.');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Header & Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-primary)]">
            Pengaturan Portal, Spreadsheet &amp; Tautan
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Tambahkan sumber Google Spreadsheets baru untuk memperbarui grafik, kelola semua link portal, serta atur sandi &amp; pemulihan kunci layar
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] p-1 text-xs font-semibold">
          {[
            { id: 'spreadsheet', label: 'Sumber Spreadsheet', icon: FileSpreadsheet },
            { id: 'tautan', label: 'Portal Tautan', icon: Link2 },
            { id: 'umum', label: 'Umum & Tampilan', icon: Sliders },
            { id: 'keamanan', label: 'Kunci & Keamanan', icon: Lock },
            { id: 'backup', label: 'Backup & Reset', icon: Database },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as SettingsTab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  tab === t.id
                    ? 'bg-[var(--surface)] text-[var(--ink-primary)] shadow-xs'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB: SUMBER SPREADSHEET */}
      {tab === 'spreadsheet' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Add New Spreadsheet Source Form */}
          <form
            onSubmit={handleAddSource}
            className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-4 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                  Tambah Sumber Spreadsheet Baru (Otomatis Terhubung ke Grafik)
                </h2>
                <p className="text-[var(--ink-muted)] mt-0.5">
                  Tempelkan link Google Sheets (pastikan akses spreadsheet disetel &ldquo;Siapa saja yang memiliki link dapat melihat&rdquo;) untuk langsung menggabungkan data tahun/bulan/QC baru ke semua grafik.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSyncSources()}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] font-semibold text-[var(--ink-primary)] hover:bg-[var(--accent-soft)] cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Semua Sumber</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Label / Nama Sumber
                </label>
                <input
                  type="text"
                  value={newSrcLabel}
                  onChange={(e) => setNewSrcLabel(e.target.value)}
                  placeholder="Misal: Laporan Lab 2026–2027"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--ink-primary)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Jenis Grafik / Dataset
                </label>
                <select
                  value={newSrcKind}
                  onChange={(e) => setNewSrcKind(e.target.value as SpreadsheetDatasetKind)}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--ink-primary)] font-semibold"
                >
                  {KIND_LABELS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Link Google Sheets atau Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={newSrcUrlOrId}
                  onChange={(e) => setNewSrcUrlOrId(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit?gid=..."
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--ink-primary)] font-mono-num"
                />
                {newSrcUrlOrId.trim() && (
                  <p className="text-[11px] text-[var(--ink-muted)] mt-1 font-mono-num">
                    ID terdeteksi: <span className="text-[var(--ink-primary)]">{extractedPreview.sheetId || '–'}</span>
                    {extractedPreview.gid ? ` · GID: ${extractedPreview.gid}` : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  GID Tab (Opsional jika ada di link)
                </label>
                <input
                  type="text"
                  value={newSrcGid}
                  onChange={(e) => setNewSrcGid(e.target.value)}
                  placeholder="Misal: 0 atau 1810939200"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 font-mono-num"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Atau Nama Tab Sheet (Opsional)
                </label>
                <input
                  type="text"
                  value={newSrcTabName}
                  onChange={(e) => setNewSrcTabName(e.target.value)}
                  placeholder="Misal: REKAP KELURAHAN"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                />
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan &amp; Hubungkan ke Grafik</span>
                </button>
              </div>
            </div>
          </form>

          {/* List of Configured Spreadsheet Sources */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                Daftar Sumber Spreadsheet Terhubung ({sources.length})
              </h2>
              <button
                type="button"
                onClick={async () => {
                  onUpdateSources(DEFAULT_SPREADSHEET_SOURCES);
                  onNotify('Daftar sumber spreadsheet dikembalikan ke bawaan.');
                  await onSyncSources(DEFAULT_SPREADSHEET_SOURCES);
                }}
                className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
              >
                Reset Sumber Bawaan
              </button>
            </div>

            <div className="space-y-2.5">
              {sources.map((src) => {
                const isEditing = editingSrcId === src.id && editSrcDraft;
                const kindName =
                  KIND_LABELS.find((k) => k.id === src.kind)?.label || src.kind;
                return (
                  <div
                    key={src.id}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)]/45 p-3.5 text-xs space-y-2.5"
                  >
                    {!isEditing ? (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="checkbox"
                              checked={src.enabled}
                              onChange={() => toggleSourceEnabled(src.id)}
                              className="accent-[var(--accent)] cursor-pointer"
                              title="Aktifkan/nonaktifkan sumber"
                            />
                            <span className="font-bold text-[var(--ink-primary)]">
                              {src.label}
                            </span>
                            <span className="text-[11px] text-[var(--ink-muted)]">
                              · {kindName}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono-num text-[var(--ink-muted)] truncate">
                            ID: {src.sheetId}
                            {src.sheetName ? ` · Tab: ${src.sheetName}` : src.gid ? ` · GID: ${src.gid}` : ''}
                            {src.lastStatus === 'ok' && (
                              <span className="text-emerald-600 font-semibold ml-2">
                                · Live ({src.lastMessage})
                              </span>
                            )}
                            {src.lastStatus === 'error' && (
                              <span className="text-rose-600 font-semibold ml-2">
                                · {src.lastMessage}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <a
                            href={buildSpreadsheetEditUrl(src)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--ink-primary)] font-semibold hover:bg-[var(--surface-muted)]"
                          >
                            <span>Buka</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSrcId(src.id);
                              setEditSrcDraft({ ...src });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--ink-primary)] font-semibold hover:bg-[var(--accent-soft)] cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          {!src.isPrimary && (
                            <button
                              type="button"
                              onClick={() => removeSource(src.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <input
                          type="text"
                          value={editSrcDraft.label}
                          onChange={(e) =>
                            setEditSrcDraft({ ...editSrcDraft, label: e.target.value })
                          }
                          placeholder="Label sumber"
                          className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-2.5 py-1.5"
                        />
                        <input
                          type="text"
                          value={editSrcDraft.sheetId}
                          onChange={(e) =>
                            setEditSrcDraft({ ...editSrcDraft, sheetId: e.target.value })
                          }
                          placeholder="URL atau Sheet ID"
                          className="lg:col-span-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-2.5 py-1.5 font-mono-num"
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={editSrcDraft.gid || ''}
                            onChange={(e) =>
                              setEditSrcDraft({ ...editSrcDraft, gid: e.target.value })
                            }
                            placeholder="GID"
                            className="w-1/2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-2 py-1.5 font-mono-num"
                          />
                          <input
                            type="text"
                            value={editSrcDraft.sheetName || ''}
                            onChange={(e) =>
                              setEditSrcDraft({ ...editSrcDraft, sheetName: e.target.value })
                            }
                            placeholder="Nama Tab"
                            className="w-1/2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-2 py-1.5"
                          />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSrcId(null);
                              setEditSrcDraft(null);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] font-semibold cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>Batal</span>
                          </button>
                          <button
                            type="button"
                            onClick={saveEditSource}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold cursor-pointer"
                          >
                            <Save className="w-3 h-3" />
                            <span>Simpan &amp; Sinkronkan</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: KELOLA PORTAL TAUTAN (EDIT EXISTING + ADD NEW) */}
      {tab === 'tautan' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Tambah Link Baru */}
          <form
            onSubmit={handleAddLink}
            className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-3 text-xs"
          >
            <h2 className="text-sm font-bold text-[var(--ink-primary)]">
              Tambah Link Baru ke Portal Tautan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              <div className="lg:col-span-2">
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Judul Tautan
                </label>
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  placeholder="Contoh: LAPORAN LAB 2027"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Subjudul / Keterangan
                </label>
                <input
                  type="text"
                  value={newLink.subtitle}
                  onChange={(e) => setNewLink({ ...newLink, subtitle: e.target.value })}
                  placeholder="Contoh: Spreadsheet Google Sheets"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Kategori
                </label>
                <select
                  value={newLink.category}
                  onChange={(e) =>
                    setNewLink({ ...newLink, category: e.target.value as LinkCategory })
                  }
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                >
                  {LINK_CAT_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Ikon (Emoji)
                </label>
                <input
                  type="text"
                  value={newLink.icon}
                  onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-center"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Alamat URL Tujuan
                </label>
                <input
                  type="text"
                  value={newLink.href}
                  onChange={(e) => setNewLink({ ...newLink, href: e.target.value })}
                  placeholder="https://docs.google.com/..."
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 font-mono-num"
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="inline-flex items-center gap-2 font-semibold text-[var(--ink-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(newLink.internal)}
                    onChange={(e) => setNewLink({ ...newLink, internal: e.target.checked })}
                    className="accent-[var(--accent)]"
                  />
                  <span>Tautan Internal</span>
                </label>
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Link</span>
                </button>
              </div>
            </div>
          </form>

          {/* Edit Link Yang Sudah Ada */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                Edit atau Hapus Link yang Sudah Ada ({portalLinks.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  onUpdatePortalLinks(PORTAL_LINKS);
                  onNotify('Seluruh tautan dikembalikan ke daftar bawaan.');
                }}
                className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
              >
                Reset Tautan Bawaan
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                placeholder="Cari link berdasarkan judul atau URL..."
                className="flex-1 min-w-[200px] rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
              />
              <select
                value={linkFilterCat}
                onChange={(e) => setLinkFilterCat(e.target.value as 'ALL' | LinkCategory)}
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 font-semibold"
              >
                <option value="ALL">Semua Kategori</option>
                {LINK_CAT_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {visibleLinks.map(({ item, idx }) => {
                const isEditing = editingLinkIdx === idx && editLinkDraft;
                return (
                  <div
                    key={`${item.title}-${idx}`}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)]/40 p-3"
                  >
                    {!isEditing ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--ink-primary)] truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[var(--ink-muted)] truncate">
                              {item.subtitle} · {item.category}
                              {item.internal ? ' · INTERNAL' : ''}
                            </p>
                            <p className="text-[11px] font-mono-num text-[var(--accent)] truncate">
                              {item.href}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLinkIdx(idx);
                              setEditLinkDraft({ ...item });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] font-semibold hover:bg-[var(--accent-soft)] cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLink(idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={editLinkDraft.title}
                          onChange={(e) =>
                            setEditLinkDraft({ ...editLinkDraft, title: e.target.value })
                          }
                          placeholder="Judul"
                          className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-2.5 py-1.5"
                        />
                        <input
                          type="text"
                          value={editLinkDraft.subtitle}
                          onChange={(e) =>
                            setEditLinkDraft({ ...editLinkDraft, subtitle: e.target.value })
                          }
                          placeholder="Subjudul"
                          className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-2.5 py-1.5"
                        />
                        <select
                          value={editLinkDraft.category}
                          onChange={(e) =>
                            setEditLinkDraft({
                              ...editLinkDraft,
                              category: e.target.value as LinkCategory,
                            })
                          }
                          className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-2.5 py-1.5"
                        >
                          {LINK_CAT_OPTIONS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={editLinkDraft.icon}
                            onChange={(e) =>
                              setEditLinkDraft({ ...editLinkDraft, icon: e.target.value })
                            }
                            className="w-14 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-2 py-1.5 text-center"
                          />
                          <label className="inline-flex items-center gap-1.5 px-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(editLinkDraft.internal)}
                              onChange={(e) =>
                                setEditLinkDraft({ ...editLinkDraft, internal: e.target.checked })
                              }
                              className="accent-[var(--accent)]"
                            />
                            <span>Internal</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={editLinkDraft.href}
                          onChange={(e) =>
                            setEditLinkDraft({ ...editLinkDraft, href: e.target.value })
                          }
                          placeholder="URL"
                          className="sm:col-span-2 lg:col-span-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-2.5 py-1.5 font-mono-num"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLinkIdx(null);
                              setEditLinkDraft(null);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] font-semibold cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={saveEditLink}
                            className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold cursor-pointer"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: UMUM & TAMPILAN */}
      {tab === 'umum' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          <form
            onSubmit={saveGeneral}
            className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                Identitas Portal &amp; Preferensi Sistem
              </h2>
              <Palette className="w-4 h-4 text-[var(--accent)]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Nama Portal (Sidebar)
                </label>
                <input
                  type="text"
                  value={portalForm.portalName}
                  onChange={(e) => setPortalForm({ ...portalForm, portalName: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--ink-primary)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Subjudul Unit
                </label>
                <input
                  type="text"
                  value={portalForm.unitSubtitle}
                  onChange={(e) => setPortalForm({ ...portalForm, unitSubtitle: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--ink-primary)]"
                />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Kicker Beranda
                </label>
                <input
                  type="text"
                  value={portalForm.heroKicker}
                  onChange={(e) => setPortalForm({ ...portalForm, heroKicker: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--ink-primary)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Judul Utama Beranda
                </label>
                <input
                  type="text"
                  value={portalForm.heroTitle}
                  onChange={(e) => setPortalForm({ ...portalForm, heroTitle: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--ink-primary)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Deskripsi Beranda
                </label>
                <textarea
                  rows={2}
                  value={portalForm.heroDesc}
                  onChange={(e) => setPortalForm({ ...portalForm, heroDesc: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--ink-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Tema Tampilan Aktif
                </label>
                <div className="flex gap-1.5">
                  {(['biru', 'keramik', 'malam'] as ThemeMode[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onChangeTheme(t)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold capitalize cursor-pointer ${
                        theme === t
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-secondary)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Target Indikator Mutu Default
                </label>
                <select
                  value={portalForm.mutuTarget}
                  onChange={(e) =>
                    setPortalForm({ ...portalForm, mutuTarget: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 font-mono-num font-bold text-[var(--ink-primary)]"
                >
                  <option value={80}>80%</option>
                  <option value={85}>85%</option>
                  <option value={90}>90%</option>
                  <option value={95}>95%</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-hairline)] px-3 py-2.5 cursor-pointer">
                <span className="font-medium text-[var(--ink-primary)]">
                  Aktifkan Mode Petugas (Tasks &amp; Portal Tautan)
                </span>
                <input
                  type="checkbox"
                  checked={staffMode}
                  onChange={(e) => onChangeStaffMode(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-hairline)] px-3 py-2.5 cursor-pointer">
                <span className="font-medium text-[var(--ink-primary)]">
                  Auto-sinkron Google Sheets saat aplikasi dibuka
                </span>
                <input
                  type="checkbox"
                  checked={portalForm.autoSync}
                  onChange={(e) => setPortalForm({ ...portalForm, autoSync: e.target.checked })}
                  className="accent-[var(--accent)]"
                />
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Pengaturan Umum</span>
            </button>
          </form>

          {/* Kelola Pengumuman Beranda */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                Kelola Pengumuman Beranda ({settings.announcements.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ ...settings, announcements: DEFAULT_ANNOUNCEMENTS });
                  onNotify('Daftar pengumuman dikembalikan ke bawaan.');
                }}
                className="text-[11px] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
              >
                Reset Bawaan
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {settings.announcements.map((a, idx) => (
                <div
                  key={`${a.title}-${idx}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)]/50 p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold uppercase text-[var(--accent)]">
                      {a.kicker}
                    </p>
                    <p className="font-bold text-[var(--ink-primary)] mt-0.5">{a.title}</p>
                    <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5 line-clamp-2">
                      {a.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAnnouncement(idx)}
                    aria-label="Hapus pengumuman"
                    className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={addAnnouncement}
              className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)] text-xs"
            >
              <p className="font-bold text-[var(--ink-primary)]">Tambah Pengumuman Baru</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newAnn.kicker}
                  onChange={(e) => setNewAnn({ ...newAnn, kicker: e.target.value })}
                  placeholder="Kategori / Kicker"
                  className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                />
                <input
                  type="text"
                  value={newAnn.meta}
                  onChange={(e) => setNewAnn({ ...newAnn, meta: e.target.value })}
                  placeholder="Label bawah (meta)"
                  className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                />
              </div>
              <input
                type="text"
                value={newAnn.title}
                onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                placeholder="Judul pengumuman..."
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
              />
              <textarea
                rows={2}
                value={newAnn.desc}
                onChange={(e) => setNewAnn({ ...newAnn, desc: e.target.value })}
                placeholder="Isi pengumuman singkat..."
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pengumuman</span>
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* TAB: KEAMANAN & KUNCI PORTAL */}
      {tab === 'keamanan' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]">
                <KeyRound className="w-4 h-4 text-[var(--accent)]" />
                <span>Status Kunci Layar Portal &amp; Kode Pemulihan</span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                Kata sandi layar portal:{' '}
                <strong className="font-mono-num text-[var(--ink-primary)]">
                  {isDefaultPassword ? 'labpermata2026 (Default Aktif)' : 'Sandi Kustom Aktif'}
                </strong>{' '}
                · Kode pemulihan:{' '}
                <strong className="font-mono-num text-[var(--ink-primary)]">
                  {isDefaultRecovery ? 'SANGASANGA-2026 (Default Aktif)' : 'Kode Pemulihan Kustom Aktif'}
                </strong>
              </p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Pertanyaan keamanan aktif:{' '}
                <span className="italic">{settings.security.securityQuestion}</span> (jawaban default:{' '}
                <span className="font-mono-num font-semibold">sanga-sanga</span>)
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={onLockPortal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Layar Sekarang</span>
              </button>
              <button
                type="button"
                onClick={resetSecurityDefaults}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-semibold text-[var(--ink-primary)] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Default</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form
              onSubmit={updatePortalPassword}
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                Ubah Kata Sandi Layar Portal
              </h3>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Kata Sandi Saat Ini
                </label>
                <input
                  type="password"
                  value={curPw}
                  onChange={(e) => setCurPw(e.target.value)}
                  placeholder={isDefaultPassword ? 'Default: labpermata2026' : 'Masukkan sandi saat ini'}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Kata Sandi Baru (min. 6 karakter)
                </label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Masukkan sandi baru"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Ulangi sandi baru"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Perbarui Kata Sandi</span>
              </button>
            </form>

            <form
              onSubmit={updateRecoveryConfig}
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                Atur Pertanyaan Keamanan &amp; Kode Pemulihan
              </h3>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Pertanyaan Keamanan
                </label>
                <input
                  type="text"
                  value={secQuestion}
                  onChange={(e) => setSecQuestion(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Jawaban Keamanan Baru (kosongkan jika tidak diubah)
                </label>
                <input
                  type="text"
                  value={secAnswer}
                  onChange={(e) => setSecAnswer(e.target.value)}
                  placeholder="Misal: sanga-sanga"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink-secondary)] mb-1">
                  Kode Pemulihan Darurat Baru (kosongkan jika tidak diubah)
                </label>
                <input
                  type="text"
                  value={newRecoveryCode}
                  onChange={(e) => setNewRecoveryCode(e.target.value)}
                  placeholder="Default: SANGASANGA-2026"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 font-mono-num"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Konfigurasi Pemulihan</span>
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* TAB: BACKUP & RESET */}
      {tab === 'backup' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-4 text-xs"
        >
          <h2 className="text-sm font-bold text-[var(--ink-primary)]">
            Cadangkan &amp; Pulihkan Konfigurasi Portal
          </h2>
          <p className="text-[var(--ink-secondary)] leading-relaxed max-w-2xl">
            Seluruh pengaturan tampilan, sumber Google Spreadsheets terhubung, daftar portal tautan, serta pengumuman tersimpan di browser perangkat ini dan dapat diekspor ke satu berkas JSON.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportAllConfig}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Konfigurasi (.json)</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-primary)] font-semibold cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Impor Konfigurasi (.json)</span>
              <input type="file" accept="application/json" onChange={importAllConfig} className="hidden" />
            </label>

            <button
              type="button"
              onClick={async () => {
                onUpdateSources(DEFAULT_SPREADSHEET_SOURCES);
                onUpdatePortalLinks(PORTAL_LINKS);
                onUpdateSettings(DEFAULT_APP_SETTINGS);
                onNotify('Semua pengaturan, spreadsheet, & tautan dikembalikan ke bawaan.');
                await onSyncSources(DEFAULT_SPREADSHEET_SOURCES);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-600 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Semua ke Bawaan</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
