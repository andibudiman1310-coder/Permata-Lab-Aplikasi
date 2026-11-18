export type ViewId =
  | 'home'
  | 'stok'
  | 'ringkasan'
  | 'mutu'
  | 'kelurahan'
  | 'sdqc'
  | 'tasks'
  | 'links'
  | 'pengaturan'
  | 'panduan'
  | 'tentang';

export type ThemeMode = 'biru' | 'keramik' | 'malam';

export interface AnnouncementItem {
  kicker: string;
  title: string;
  desc: string;
  meta: string;
}

export interface PortalSecuritySettings {
  passwordHash: string;
  recoveryHash: string;
  securityQuestion: string;
  securityAnswerHash: string;
}

export interface AppSettings {
  portalName: string;
  unitSubtitle: string;
  heroKicker: string;
  heroTitle: string;
  heroDesc: string;
  autoSync: boolean;
  mutuTarget: number;
  announcements: AnnouncementItem[];
  security: PortalSecuritySettings;
}

export type SpreadsheetDatasetKind =
  | 'annual'
  | 'mutu'
  | 'kelurahan'
  | 'stok'
  | 'daily'
  | 'monthly'
  | 'qc_hematologi'
  | 'qc_kimia';

export interface SpreadsheetSource {
  id: string;
  label: string;
  kind: SpreadsheetDatasetKind;
  sheetId: string;
  gid?: string;
  sheetName?: string;
  enabled: boolean;
  isPrimary?: boolean;
  lastStatus?: 'idle' | 'ok' | 'error';
  lastMessage?: string;
  lastSyncedAt?: string;
}

export type LinkCategory = 'laporan' | 'aplikasi' | 'stok' | 'link' | 'catatan';

export interface AnnualReportData {
  years: number[];
  exams: [string, number[]][];
  visits: number[];
  live: boolean;
}

export interface ReagentItem {
  n: string;       // nama reagen
  s: string;       // sumber
  a: number;       // stok awal
  i: number;       // masuk
  o: number;       // keluar
  e: number;       // stok akhir
  b: number | null;// buffer
  k: string;       // status mentah dari sheet
  kd: string;      // kode
  kt: string;      // kategori
  sa: string;      // satuan
  ex: string;      // tanggal expired
  w: string;       // peringatan expired
}

export interface ReagentMonth {
  name: string;
  yr: number | null;
  items: ReagentItem[];
}

export type MutuYearMap = Record<number, (number | null)[]>;

export interface KelurahanData {
  years: number[];
  kel: string[];
  months: Record<number, number>;
  val: Record<number, Record<string, number[]>>;
  live?: boolean;
}

export interface DailyDay {
  d: number;
  dow: number; // 0=Senin..6=Minggu
  pas: number;
  pem: number;
  buka: boolean;
}

export interface DailyMonth {
  mi: number;
  yr: number;
  name: string;
  days: DailyDay[];
}

export interface Monthly2026Item {
  kat: string;
  n: string;
  v: number[]; // length 12
}

export interface Monthly2026Data {
  items: Monthly2026Item[];
  tot: number[];
  live: boolean;
}

export interface QcPointRaw {
  d: string;
  v: number;
}

export interface QcBlock {
  group: 'hematologi' | 'kimia';
  source: string;
  param: string;
  label: string;
  lot: string;
  mean: number;
  sd: number;
  pts: QcPointRaw[];
}

export interface LabTask {
  text: string;
  done: boolean;
  due?: string;
  prio?: 'Rendah' | 'Sedang' | 'Tinggi';
  rep?: '' | '1' | '7' | '30';
}

export interface PortalLink {
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  category: LinkCategory;
  internal?: boolean;
}
