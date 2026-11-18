import {
  AnnouncementItem,
  AnnualReportData,
  AppSettings,
  DailyMonth,
  KelurahanData,
  Monthly2026Data,
  MutuYearMap,
  PortalLink,
  QcBlock,
  ReagentItem,
  ReagentMonth,
  SpreadsheetSource,
} from '../types/lab';

export const ADMIN_EMAIL = 'labpkmsangasanga@gmail.com';
// Default portal password: labpermata2026
export const DEFAULT_PORTAL_PASSWORD_HASH =
  '0105ffa2b13072ed8c23aeae83fcdd3c2d91aaa7bf4072b107dbd63674f7d0d5';
export const VALID_HASHES = [DEFAULT_PORTAL_PASSWORD_HASH];
// Default recovery code: SANGASANGA-2026
export const RECOVERY_HASH =
  '3ed57a96808fdcaa83c0e103fe0ad64e8cf80e17ccc832276e25f42064ff813b';
// Default security answer: sanga-sanga / sangasanga
export const SEC_ANSWER_HASH =
  '11e2ee3458b52978960c5489c8a75aa269273c09b52a77524dfac790edfe352f';
export const ALT_SEC_ANSWER_HASH =
  '421c420cddc4dd8ee7926927bef747c79143d38663afd10b304b968c4d46db7e';
export const DEFAULT_SECURITY_QUESTION =
  'Nama kecamatan/puskesmas tempat laboratorium ini beroperasi?';

export const MONTHS_FULL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];
const MONTHS_UPPER = MONTHS_FULL.map((m) => m.toUpperCase());

export const fmtID = (n: number | null | undefined, digits = 0): string => {
  if (n == null || !isFinite(n)) return '–';
  return Number(n).toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export function parseCSV(t: string): string[][] {
  const r: string[][] = [];
  let row: string[] = [];
  let c = '';
  let q = false;
  const clean = String(t || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (q) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          c += '"';
          i++;
        } else q = false;
      } else c += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      row.push(c);
      c = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(c);
      r.push(row);
      row = [];
      c = '';
    } else c += ch;
  }
  if (c || row.length) {
    row.push(c);
    r.push(row);
  }
  return r;
}

const parseIntOnly = (v: unknown): number => {
  const n = parseInt(String(v ?? '').replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

const parseIntNullable = (v: unknown): number | null => {
  const x = String(v ?? '').replace(/[^\d-]/g, '');
  if (!x || x === '-') return null;
  const n = parseInt(x, 10);
  return isNaN(n) ? null : n;
};

export function sha256(s: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const b = Array.from(new TextEncoder().encode(s));
  const l = b.length * 8;
  b.push(0x80);
  while (b.length % 64 !== 56) b.push(0);
  for (let i = 7; i >= 0; i--) b.push(i > 3 ? 0 : (l >>> (i * 8)) & 255);
  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ];
  const r = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < b.length; o += 64) {
    const w: number[] = [];
    for (let i = 0; i < 16; i++)
      w[i] =
        (b[o + 4 * i] << 24) |
        (b[o + 4 * i + 1] << 16) |
        (b[o + 4 * i + 2] << 8) |
        b[o + 4 * i + 3];
    for (let i = 16; i < 64; i++) {
      const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, bb, c, d, e, f, g, hh] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
      const S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22);
      const mj = (a & bb) ^ (a & c) ^ (bb & c);
      const t2 = (S0 + mj) | 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = bb;
      bb = a;
      a = (t1 + t2) | 0;
    }
    H = [
      (H[0] + a) | 0,
      (H[1] + bb) | 0,
      (H[2] + c) | 0,
      (H[3] + d) | 0,
      (H[4] + e) | 0,
      (H[5] + f) | 0,
      (H[6] + g) | 0,
      (H[7] + hh) | 0,
    ];
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

// ==================== 1. LAPORAN TAHUNAN LAB ====================
const ANNUAL_SHEET_ID = '1K332LzWdG6W4S7eOYeVjq2rZHHgtEnR9-bqdUOObHHA';
const ANNUAL_GID = '1810939200';

export const FALLBACK_ANNUAL: AnnualReportData = {
  years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
  exams: [
    ['Darah Lengkap', [558, 1260, 1560, 755, 645, 769, 1105, 1471, 935]],
    ['HB', [287, 1260, 1580, 288, 247, 282, 795, 733, 620]],
    ['Gula Darah Sewaktu', [585, 578, 626, 425, 386, 474, 1564, 1807, 1132]],
    ['Gula Darah Puasa', [28, 156, 189, 80, 140, 243, 297, 346, 521]],
    ['Gula Darah 2 JPP', [1, 7, 17, 71, 3, 28, 13, 12, 1]],
    ['Asam Urat', [401, 670, 635, 456, 266, 487, 1134, 1348, 471]],
    ['Kolesterol', [495, 672, 779, 455, 261, 593, 1102, 1363, 821]],
    ['Golongan Darah', [282, 267, 525, 557, 368, 299, 502, 387, 329]],
    ['Widal', [390, 422, 682, 181, 101, 125, 143, 145, 63]],
    ['Tes Kehamilan', [119, 147, 305, 286, 248, 239, 297, 573, 278]],
    ['HbsAg', [373, 336, 613, 567, 490, 556, 535, 626, 472]],
    ['Anti HIV', [373, 368, 578, 436, 446, 570, 534, 532, 478]],
    ['Sifilis', [49, 60, 373, 552, 508, 522, 510, 532, 450]],
    ['Rapid Ag Covid-19', [0, 0, 0, 0, 0, 768, 78, 2, 0]],
    ['Malaria RDT', [0, 0, 0, 12, 22, 0, 64, 0, 23]],
    ['TCM', [0, 0, 0, 50, 46, 46, 239, 0, 479]],
    ['BTA Follow Up', [30, 50, 29, 44, 50, 50, 42, 44, 38]],
    ['Napza 1 Parameter', [260, 313, 356, 283, 106, 464, 0, 0, 0]],
    ['Napza 3 Parameter', [0, 0, 0, 6, 0, 0, 422, 210, 741]],
    ['3 Parameter (Urine Rutin)', [320, 239, 374, 450, 377, 376, 445, 559, 449]],
    ['10 Parameter (Urine Lengkap)', [51, 71, 99, 113, 71, 124, 110, 93, 68]],
    ['Sedimen Urin', [51, 71, 92, 108, 68, 107, 68, 66, 59]],
  ],
  visits: [2148, 2360, 3392, 4850, 4309, 3698, 4192, 4690, 3542],
  live: false,
};

const EXAM_GROUP_RULES: [string, RegExp][] = [
  ['Hematologi', /darah lengkap|^hb$|golongan darah/i],
  ['Kimia Klinik', /gula darah|asam urat|kolesterol/i],
  ['Urinalisis', /\(urine|sedimen/i],
  [
    'Imunoserologi & Skrining',
    /widal|kehamilan|hbsag|hiv|sifilis|covid|malaria|napza/i,
  ],
  ['TB (TCM & BTA)', /tcm|bta/i],
];

export function classifyExamGroup(name: string): string {
  for (const [label, rx] of EXAM_GROUP_RULES) {
    if (rx.test(name)) return label;
  }
  return 'Lainnya';
}

export async function fetchAnnualReport(): Promise<AnnualReportData> {
  const url = `https://docs.google.com/spreadsheets/d/${ANNUAL_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${ANNUAL_GID}&_=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (/^\s*</.test(text)) throw new Error('Sheet requires login');
  const rows = parseCSV(text);
  const h = rows.findIndex((r) => /JENIS PEMERIKSAAN/i.test(r[1] || ''));
  if (h < 0) throw new Error('Header tidak ditemukan');
  const yrs: number[] = [];
  const cols: number[] = [];
  rows[h].forEach((x, k) => {
    const m = /(\d{4})/.exec(x || '');
    if (k >= 2 && m) {
      yrs.push(+m[1]);
      cols.push(k);
    }
  });
  const exams: [string, number[]][] = [];
  for (let i = h + 1; i < rows.length && (rows[i][1] || '').trim(); i++) {
    if (/wilayah|kunjungan/i.test(rows[i][1])) continue;
    exams.push([
      rows[i][1].trim(),
      cols.map((k) => parseIntOnly(rows[i][k])),
    ]);
  }
  const tv = rows.find((r) => /^total kunjungan/i.test((r[1] || '').trim()));
  if (!exams.length || !tv) throw new Error('Data tidak lengkap');
  return {
    years: yrs,
    exams,
    visits: cols.map((k) => parseIntOnly(tv[k])),
    live: true,
  };
}

// ==================== 2. STOK REAGENSIA ====================
const STOK_SID = '1axwil6eYFLv8OPg44DwEL0SHawrB5r_tdzWnhR78clg';
const STOK_GID = '131724345';
const STOK_GID_MASTER = '967284261';
const STOK_GID_LOG = '512586976';

export const STOK_SHEET_URL = `https://docs.google.com/spreadsheets/d/${STOK_SID}/edit?gid=${STOK_GID}`;

export const FALLBACK_STOK: ReagentMonth[] = [
  {
    name: 'Agustus',
    yr: 2026,
    items: [
      { n: 'Diluent Sysmex XP-100 (20L)', s: 'Dinkes', a: 4, i: 2, o: 2, e: 4, b: 2, k: 'AMAN', kd: 'R-HEM-01', kt: 'Hematologi', sa: 'Jerigen', ex: '15/03/2027', w: '' },
      { n: 'Stromatolyser WH (500 mL)', s: 'Dinkes', a: 3, i: 1, o: 2, e: 2, b: 2, k: 'ORDER', kd: 'R-HEM-02', kt: 'Hematologi', sa: 'Botol', ex: '20/02/2027', w: '' },
      { n: 'Glukosa Stick / Strip', s: 'BLUD', a: 12, i: 4, o: 8, e: 8, b: 6, k: 'AMAN', kd: 'R-KIM-01', kt: 'Kimia Klinik', sa: 'Box', ex: '30/06/2027', w: '' },
      { n: 'Kolesterol Stick / Strip', s: 'BLUD', a: 9, i: 4, o: 6, e: 7, b: 5, k: 'AMAN', kd: 'R-KIM-02', kt: 'Kimia Klinik', sa: 'Box', ex: '12/04/2027', w: '' },
      { n: 'Asam Urat Stick / Strip', s: 'BLUD', a: 8, i: 2, o: 5, e: 5, b: 4, k: 'AMAN', kd: 'R-KIM-03', kt: 'Kimia Klinik', sa: 'Box', ex: '28/12/2026', w: 'SEGERA KEDALUWARSA' },
      { n: 'Rapid Test HBsAg', s: 'Program', a: 6, i: 0, o: 3, e: 3, b: 3, k: 'ORDER', kd: 'R-IMU-01', kt: 'Imunologi', sa: 'Box', ex: '10/01/2027', w: 'SEGERA KEDALUWARSA' },
      { n: 'Rapid Test HIV (SD Bioline)', s: 'Program', a: 7, i: 2, o: 3, e: 6, b: 3, k: 'AMAN', kd: 'R-IMU-02', kt: 'Imunologi', sa: 'Box', ex: '18/05/2027', w: '' },
      { n: 'Rapid Test Sifilis (TP)', s: 'Program', a: 5, i: 2, o: 3, e: 4, b: 3, k: 'AMAN', kd: 'R-IMU-03', kt: 'Imunologi', sa: 'Box', ex: '22/08/2027', w: '' },
      { n: 'Cartridge TCM MTB/RIF', s: 'Program TB', a: 80, i: 40, o: 46, e: 74, b: 40, k: 'AMAN', kd: 'R-MIK-01', kt: 'Mikrobiologi', sa: 'Test', ex: '14/04/2027', w: '' },
      { n: 'Urine Strip 10 Parameter', s: 'BLUD', a: 4, i: 2, o: 3, e: 3, b: 3, k: 'ORDER', kd: 'R-URN-01', kt: 'Urinalisa', sa: 'Botol', ex: '01/03/2027', w: '' },
      { n: 'Urine Strip 3 Parameter', s: 'BLUD', a: 7, i: 3, o: 4, e: 6, b: 4, k: 'AMAN', kd: 'R-URN-02', kt: 'Urinalisa', sa: 'Botol', ex: '11/07/2027', w: '' },
      { n: 'Reagen Golongan Darah (ABO)', s: 'Dinkes', a: 3, i: 0, o: 2, e: 1, b: 2, k: 'ORDER', kd: 'R-HEM-03', kt: 'Hematologi', sa: 'Set', ex: '20/10/2026', w: 'SUDAH KEDALUWARSA' },
      { n: 'Widal Antigen Set', s: 'BLUD', a: 2, i: 0, o: 1, e: 1, b: 2, k: 'ORDER', kd: 'R-IMU-04', kt: 'Imunologi', sa: 'Set', ex: '15/11/2026', w: 'SEGERA KEDALUWARSA' },
      { n: 'PP Test / Tes Kehamilan', s: 'BLUD', a: 10, i: 4, o: 5, e: 9, b: 4, k: 'AMAN', kd: 'R-IMU-05', kt: 'Imunologi', sa: 'Box', ex: '19/09/2027', w: '' },
      { n: 'Napza 3 Parameter Strip', s: 'BLUD', a: 12, i: 5, o: 7, e: 10, b: 5, k: 'AMAN', kd: 'R-NAP-01', kt: 'Imunologi', sa: 'Box', ex: '25/06/2027', w: '' },
      { n: 'Tabung EDTA 3 mL', s: 'BLUD', a: 18, i: 10, o: 12, e: 16, b: 8, k: 'AMAN', kd: 'R-BMH-01', kt: 'Lain-lain', sa: 'Box', ex: '30/12/2027', w: '' },
      { n: 'Pot Sputum Dahak Steril', s: 'Program TB', a: 110, i: 50, o: 70, e: 90, b: 60, k: 'AMAN', kd: 'R-BMH-02', kt: 'Lain-lain', sa: 'Pcs', ex: '30/12/2027', w: '' },
      { n: 'Ziehl-Neelsen Pewarna BTA', s: 'Program TB', a: 2, i: 0, o: 2, e: 0, b: 2, k: 'HABIS', kd: 'R-MIK-02', kt: 'Mikrobiologi', sa: 'Paket', ex: '15/05/2027', w: '' },
    ],
  },
  {
    name: 'September',
    yr: 2026,
    items: [
      { n: 'Diluent Sysmex XP-100 (20L)', s: 'Dinkes', a: 4, i: 2, o: 3, e: 3, b: 2, k: 'AMAN', kd: 'R-HEM-01', kt: 'Hematologi', sa: 'Jerigen', ex: '15/03/2027', w: '' },
      { n: 'Stromatolyser WH (500 mL)', s: 'Dinkes', a: 2, i: 2, o: 2, e: 2, b: 2, k: 'ORDER', kd: 'R-HEM-02', kt: 'Hematologi', sa: 'Botol', ex: '20/02/2027', w: '' },
      { n: 'Glukosa Stick / Strip', s: 'BLUD', a: 8, i: 6, o: 7, e: 7, b: 6, k: 'AMAN', kd: 'R-KIM-01', kt: 'Kimia Klinik', sa: 'Box', ex: '30/06/2027', w: '' },
      { n: 'Kolesterol Stick / Strip', s: 'BLUD', a: 7, i: 2, o: 5, e: 4, b: 5, k: 'ORDER', kd: 'R-KIM-02', kt: 'Kimia Klinik', sa: 'Box', ex: '12/04/2027', w: '' },
      { n: 'Asam Urat Stick / Strip', s: 'BLUD', a: 5, i: 2, o: 4, e: 3, b: 4, k: 'ORDER', kd: 'R-KIM-03', kt: 'Kimia Klinik', sa: 'Box', ex: '28/12/2026', w: 'SEGERA KEDALUWARSA' },
      { n: 'Rapid Test HBsAg', s: 'Program', a: 3, i: 4, o: 3, e: 4, b: 3, k: 'AMAN', kd: 'R-IMU-01', kt: 'Imunologi', sa: 'Box', ex: '10/01/2027', w: 'SEGERA KEDALUWARSA' },
      { n: 'Rapid Test HIV (SD Bioline)', s: 'Program', a: 6, i: 0, o: 3, e: 3, b: 3, k: 'ORDER', kd: 'R-IMU-02', kt: 'Imunologi', sa: 'Box', ex: '18/05/2027', w: '' },
      { n: 'Rapid Test Sifilis (TP)', s: 'Program', a: 4, i: 3, o: 2, e: 5, b: 3, k: 'AMAN', kd: 'R-IMU-03', kt: 'Imunologi', sa: 'Box', ex: '22/08/2027', w: '' },
      { n: 'Cartridge TCM MTB/RIF', s: 'Program TB', a: 74, i: 30, o: 42, e: 62, b: 40, k: 'AMAN', kd: 'R-MIK-01', kt: 'Mikrobiologi', sa: 'Test', ex: '14/04/2027', w: '' },
      { n: 'Urine Strip 10 Parameter', s: 'BLUD', a: 3, i: 4, o: 3, e: 4, b: 3, k: 'AMAN', kd: 'R-URN-01', kt: 'Urinalisa', sa: 'Botol', ex: '01/03/2027', w: '' },
      { n: 'Urine Strip 3 Parameter', s: 'BLUD', a: 6, i: 0, o: 4, e: 2, b: 4, k: 'ORDER', kd: 'R-URN-02', kt: 'Urinalisa', sa: 'Botol', ex: '11/07/2027', w: '' },
      { n: 'Reagen Golongan Darah (ABO)', s: 'Dinkes', a: 1, i: 0, o: 1, e: 0, b: 2, k: 'HABIS', kd: 'R-HEM-03', kt: 'Hematologi', sa: 'Set', ex: '20/10/2026', w: '' },
      { n: 'Widal Antigen Set', s: 'BLUD', a: 1, i: 2, o: 1, e: 2, b: 2, k: 'ORDER', kd: 'R-IMU-04', kt: 'Imunologi', sa: 'Set', ex: '15/11/2026', w: 'SEGERA KEDALUWARSA' },
      { n: 'PP Test / Tes Kehamilan', s: 'BLUD', a: 9, i: 0, o: 4, e: 5, b: 4, k: 'AMAN', kd: 'R-IMU-05', kt: 'Imunologi', sa: 'Box', ex: '19/09/2027', w: '' },
      { n: 'Napza 3 Parameter Strip', s: 'BLUD', a: 10, i: 4, o: 6, e: 8, b: 5, k: 'AMAN', kd: 'R-NAP-01', kt: 'Imunologi', sa: 'Box', ex: '25/06/2027', w: '' },
      { n: 'Tabung EDTA 3 mL', s: 'BLUD', a: 16, i: 6, o: 11, e: 11, b: 8, k: 'AMAN', kd: 'R-BMH-01', kt: 'Lain-lain', sa: 'Box', ex: '30/12/2027', w: '' },
      { n: 'Pot Sputum Dahak Steril', s: 'Program TB', a: 90, i: 60, o: 65, e: 85, b: 60, k: 'AMAN', kd: 'R-BMH-02', kt: 'Lain-lain', sa: 'Pcs', ex: '30/12/2027', w: '' },
      { n: 'Ziehl-Neelsen Pewarna BTA', s: 'Program TB', a: 0, i: 3, o: 1, e: 2, b: 2, k: 'ORDER', kd: 'R-MIK-02', kt: 'Mikrobiologi', sa: 'Paket', ex: '15/05/2027', w: '' },
    ],
  },
  {
    name: 'Oktober',
    yr: 2026,
    items: [
      { n: 'Diluent Sysmex XP-100 (20L)', s: 'Dinkes', a: 3, i: 3, o: 2, e: 4, b: 2, k: 'AMAN', kd: 'R-HEM-01', kt: 'Hematologi', sa: 'Jerigen', ex: '15/03/2027', w: '' },
      { n: 'Stromatolyser WH (500 mL)', s: 'Dinkes', a: 2, i: 0, o: 1, e: 1, b: 2, k: 'ORDER', kd: 'R-HEM-02', kt: 'Hematologi', sa: 'Botol', ex: '20/02/2027', w: '' },
      { n: 'Glukosa Stick / Strip', s: 'BLUD', a: 7, i: 5, o: 7, e: 5, b: 6, k: 'ORDER', kd: 'R-KIM-01', kt: 'Kimia Klinik', sa: 'Box', ex: '30/06/2027', w: '' },
      { n: 'Kolesterol Stick / Strip', s: 'BLUD', a: 4, i: 6, o: 4, e: 6, b: 5, k: 'AMAN', kd: 'R-KIM-02', kt: 'Kimia Klinik', sa: 'Box', ex: '12/04/2027', w: '' },
      { n: 'Asam Urat Stick / Strip', s: 'BLUD', a: 3, i: 0, o: 3, e: 0, b: 4, k: 'HABIS', kd: 'R-KIM-03', kt: 'Kimia Klinik', sa: 'Box', ex: '28/12/2026', w: '' },
      { n: 'Rapid Test HBsAg', s: 'Program', a: 4, i: 2, o: 2, e: 4, b: 3, k: 'AMAN', kd: 'R-IMU-01', kt: 'Imunologi', sa: 'Box', ex: '10/01/2027', w: 'SEGERA KEDALUWARSA' },
      { n: 'Rapid Test HIV (SD Bioline)', s: 'Program', a: 3, i: 4, o: 3, e: 4, b: 3, k: 'AMAN', kd: 'R-IMU-02', kt: 'Imunologi', sa: 'Box', ex: '18/05/2027', w: '' },
      { n: 'Rapid Test Sifilis (TP)', s: 'Program', a: 5, i: 0, o: 3, e: 2, b: 3, k: 'ORDER', kd: 'R-IMU-03', kt: 'Imunologi', sa: 'Box', ex: '22/08/2027', w: '' },
      { n: 'Cartridge TCM MTB/RIF', s: 'Program TB', a: 62, i: 40, o: 44, e: 58, b: 40, k: 'AMAN', kd: 'R-MIK-01', kt: 'Mikrobiologi', sa: 'Test', ex: '14/04/2027', w: '' },
      { n: 'Urine Strip 10 Parameter', s: 'BLUD', a: 4, i: 0, o: 2, e: 2, b: 3, k: 'ORDER', kd: 'R-URN-01', kt: 'Urinalisa', sa: 'Botol', ex: '01/03/2027', w: '' },
      { n: 'Urine Strip 3 Parameter', s: 'BLUD', a: 2, i: 5, o: 3, e: 4, b: 4, k: 'ORDER', kd: 'R-URN-02', kt: 'Urinalisa', sa: 'Botol', ex: '11/07/2027', w: '' },
      { n: 'Reagen Golongan Darah (ABO)', s: 'Dinkes', a: 0, i: 4, o: 1, e: 3, b: 2, k: 'AMAN', kd: 'R-HEM-03', kt: 'Hematologi', sa: 'Set', ex: '15/09/2027', w: '' },
      { n: 'Widal Antigen Set', s: 'BLUD', a: 2, i: 0, o: 1, e: 1, b: 2, k: 'ORDER', kd: 'R-IMU-04', kt: 'Imunologi', sa: 'Set', ex: '10/11/2026', w: 'SUDAH KEDALUWARSA' },
      { n: 'PP Test / Tes Kehamilan', s: 'BLUD', a: 5, i: 4, o: 4, e: 5, b: 4, k: 'AMAN', kd: 'R-IMU-05', kt: 'Imunologi', sa: 'Box', ex: '19/09/2027', w: '' },
      { n: 'Napza 3 Parameter Strip', s: 'BLUD', a: 8, i: 4, o: 5, e: 7, b: 5, k: 'AMAN', kd: 'R-NAP-01', kt: 'Imunologi', sa: 'Box', ex: '25/06/2027', w: '' },
      { n: 'Tabung EDTA 3 mL', s: 'BLUD', a: 11, i: 8, o: 9, e: 10, b: 8, k: 'AMAN', kd: 'R-BMH-01', kt: 'Lain-lain', sa: 'Box', ex: '30/12/2027', w: '' },
      { n: 'Pot Sputum Dahak Steril', s: 'Program TB', a: 85, i: 40, o: 75, e: 50, b: 60, k: 'ORDER', kd: 'R-BMH-02', kt: 'Lain-lain', sa: 'Pcs', ex: '30/12/2027', w: '' },
      { n: 'Ziehl-Neelsen Pewarna BTA', s: 'Program TB', a: 2, i: 0, o: 2, e: 0, b: 2, k: 'HABIS', kd: 'R-MIK-02', kt: 'Mikrobiologi', sa: 'Paket', ex: '15/05/2027', w: '' },
    ],
  },
];

export function getReagentStatus(x: ReagentItem): 'Habis' | 'Order' | 'Aman' | 'Tanpa buffer' {
  if (x.e <= 0 || x.k === 'HABIS') return 'Habis';
  if (x.k === 'ORDER' || (!x.k && x.b != null && x.e <= x.b)) return 'Order';
  if (x.k === 'AMAN' || x.b != null) return 'Aman';
  return 'Tanpa buffer';
}

export const REAGENT_CATS = [
  'Kimia Klinik',
  'Imunologi',
  'Mikrobiologi',
  'Hematologi',
  'Urinalisa',
  'Lain-lain',
];

export function getReagentCatIdx(x: ReagentItem): number {
  const t = (x.kt || '').toLowerCase();
  if (t) {
    if (/kimia/.test(t)) return 0;
    if (/imun|serolog/.test(t)) return 1;
    if (/molekul|mikrob/.test(t)) return 2;
    if (/hemato/.test(t)) return 3;
    if (/urin/.test(t)) return 4;
    if (/tabung|wadah|lain/.test(t)) return 5;
  }
  const n = x.n.toLowerCase();
  if (/needle|jarum|cover\s*gla|pipet|spirt|spirit|alkohol|water|aquadest|pot\s*sputum|pot\s*urin|tabung|handscoon|kapas/.test(n)) return 5;
  if (/urin|param|sedimen/.test(n)) return 4;
  if (/hemato|lyse|stromato|diluent|cleaner|edta|golongan\s*darah|sysmex/.test(n)) return 3;
  if (/glukosa|glucose|asam\s*urat|kolesterol|chol|ureum|kreatinin|sgot|sgpt|hba1c/.test(n)) return 0;
  if (/hiv|hbsag|widal|sifilis|rapid|kehamilan|pp\s*test|napza/.test(n)) return 1;
  if (/tcm|cartridge|ziehl|bta|giemsa|mikro/.test(n)) return 2;
  return 5;
}

function parseStokOpname(rows: string[][]): ReagentMonth[] {
  let h = -1;
  let n = -1;
  for (let i = 0; i < rows.length && h < 0; i++) {
    for (let k = 0; k < rows[i].length; k++) {
      if (/^nama\s*reagen$/i.test((rows[i][k] || '').trim())) {
        h = i;
        n = k;
        break;
      }
    }
  }
  if (h < 0) return [];
  const col: Record<string, number> = {
    kd: n - 1,
    n,
    kt: n + 1,
    s: n + 2,
    sa: n + 3,
    lt: n + 4,
    ex: n + 5,
    a: n + 6,
    i: n + 7,
    o: n + 8,
    e: n + 9,
    b: n + 10,
    hr: n + 11,
    k: n + 12,
    w: n + 13,
  };
  const hd: Record<string, string> = {
    kode: 'kd',
    kategori: 'kt',
    sumber: 's',
    satuan: 'sa',
    'lot terakhir': 'lt',
    'expired terakhir': 'ex',
    'stok awal': 'a',
    masuk: 'i',
    keluar: 'o',
    'stok akhir': 'e',
    buffer: 'b',
    'cukup (hari)': 'hr',
    status: 'k',
    'peringatan expired': 'w',
  };
  rows[h].forEach((x, j) => {
    const t = (x || '').trim().toLowerCase();
    if (hd[t]) col[hd[t]] = j;
  });
  let mn = -1;
  let yr: number | null = null;
  for (let i = 0; i <= h && mn < 0; i++) {
    rows[i].forEach((x) => {
      const m = /^(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(20\d{2})$/i.exec(
        (x || '').trim()
      );
      if (m && mn < 0) {
        mn = MONTHS_UPPER.indexOf(m[1].toUpperCase());
        yr = +m[2];
      }
    });
  }
  if (mn < 0) {
    const now = new Date();
    mn = now.getMonth();
    yr = now.getFullYear();
  }
  const items: ReagentItem[] = [];
  const g = (r: string[], c: number) => String(r[c] ?? '').trim();
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i];
    const nm = g(r, col.n);
    if (!nm) continue;
    const st = g(r, col.k).toUpperCase();
    if (st === 'NONAKTIF') continue;
    const aw = parseIntNullable(r[col.a]);
    const mi = parseIntNullable(r[col.i]);
    const ke = parseIntNullable(r[col.o]);
    const ak = parseIntNullable(r[col.e]);
    if (aw == null && mi == null && ke == null && ak == null) continue;
    items.push({
      n: nm,
      s: g(r, col.s),
      a: aw || 0,
      i: mi || 0,
      o: ke || 0,
      e: ak == null ? 0 : ak,
      b: parseIntNullable(r[col.b]),
      k: st,
      kd: g(r, col.kd),
      kt: g(r, col.kt),
      sa: g(r, col.sa),
      ex: g(r, col.ex),
      w: g(r, col.w),
    });
  }
  return items.length ? [{ name: MONTHS_FULL[mn], yr, items }] : [];
}

function parseMasterReagen(rows: string[][]) {
  let h = -1;
  let n = -1;
  for (let i = 0; i < rows.length && h < 0; i++) {
    for (let k = 0; k < rows[i].length; k++) {
      if (/^nama\s*reagen$/i.test((rows[i][k] || '').trim())) {
        h = i;
        n = k;
        break;
      }
    }
  }
  if (h < 0) return [];
  const col: Record<string, number> = {
    kd: n - 1,
    n,
    kt: n + 1,
    s: n + 2,
    sa: n + 3,
    a: n + 4,
    b: n + 5,
    ak: n + 6,
  };
  const hd: Record<string, string> = {
    kode: 'kd',
    kategori: 'kt',
    sumber: 's',
    satuan: 'sa',
    buffer: 'b',
    aktif: 'ak',
  };
  rows[h].forEach((x, j) => {
    const t = (x || '').trim().toLowerCase();
    if (hd[t]) col[hd[t]] = j;
    else if (/^stok\s*awal/.test(t)) col.a = j;
  });
  const g = (r: string[], c: number) => String(r[c] ?? '').trim();
  const out = [];
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i];
    const nm = g(r, col.n);
    if (!nm) continue;
    out.push({
      kd: g(r, col.kd) || nm,
      n: nm,
      kt: g(r, col.kt),
      s: g(r, col.s),
      sa: g(r, col.sa),
      a: parseIntNullable(r[col.a]) || 0,
      b: parseIntNullable(r[col.b]),
      aktif: !/^(tidak|nonaktif|no|n|false|0)$/i.test(g(r, col.ak)),
    });
  }
  return out;
}

function parseLogTransaksi(rows: string[][]) {
  let h = -1;
  let n = -1;
  for (let i = 0; i < rows.length && h < 0; i++) {
    for (let k = 0; k < rows[i].length; k++) {
      if (/^nama\s*reagen/i.test((rows[i][k] || '').trim())) {
        h = i;
        n = k;
        break;
      }
    }
  }
  if (h < 0) return [];
  const col: Record<string, number> = { t: n - 2, kd: n - 1, n, j: n + 1, q: n + 2 };
  rows[h].forEach((x, j) => {
    const t = (x || '').trim().toLowerCase();
    if (/^tanggal/.test(t)) col.t = j;
    else if (/^kode/.test(t)) col.kd = j;
    else if (t === 'jenis') col.j = j;
    else if (t === 'jumlah') col.q = j;
  });
  const tglParse = (t: string) => {
    const s = String(t || '').trim();
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (m) return { y: +m[1], m: +m[2] - 1 };
    m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(s);
    if (!m) return null;
    const a = +m[1];
    const b = +m[2];
    return { y: +m[3], m: b > 12 && a <= 12 ? a - 1 : b - 1 };
  };
  const out: { kd: string; nm: string; y: number; m: number; j: 'i' | 'o'; q: number }[] = [];
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i];
    const d = tglParse(r[col.t]);
    if (!d) continue;
    const jn = String(r[col.j] || '').trim().toLowerCase();
    const q = parseIntNullable(r[col.q]);
    if (q == null || !q) continue;
    const kd = String(r[col.kd] || '').trim() || String(r[col.n] || '').trim();
    if (!kd) continue;
    const j = /^masuk/.test(jn) ? 'i' : /^keluar/.test(jn) ? 'o' : null;
    if (j) out.push({ kd, nm: String(r[col.n] || '').trim(), y: d.y, m: d.m, j, q });
  }
  return out;
}

export async function fetchStokReagensia(): Promise<{ months: ReagentMonth[]; live: boolean }> {
  const ambil = async (gid: string) => {
    const r = await fetch(
      `https://docs.google.com/spreadsheets/d/${STOK_SID}/gviz/tq?tqx=out:csv&gid=${gid}&_=${Date.now()}`,
      { cache: 'no-store' }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const t = await r.text();
    if (/^\s*</.test(t)) throw new Error('Sheet belum publik');
    return parseCSV(t);
  };
  const curRows = await ambil(STOK_GID);
  const curMonths = parseStokOpname(curRows);
  if (!curMonths.length) throw new Error('Tab STOK OPNAME kosong');
  try {
    const [mRows, lRows] = await Promise.all([ambil(STOK_GID_MASTER), ambil(STOK_GID_LOG)]);
    const ms = parseMasterReagen(mRows);
    const lg = parseLogTransaksi(lRows);
    if (ms.length && lg.length) {
      const cur = curMonths[0];
      const yr = cur.yr || new Date().getFullYear();
      const ci = MONTHS_UPPER.indexOf(cur.name.toUpperCase());
      let last = ci >= 0 ? ci : 0;
      lg.forEach((t) => {
        if (t.y === yr && t.m > last) last = t.m;
      });
      const idx: Record<string, (typeof ms)[0]> = {};
      ms.forEach((r) => {
        idx[r.kd] = r;
        idx[r.n] = r;
      });
      const run: Record<string, number> = {};
      const io: Record<string, { i: number; o: number }> = {};
      ms.forEach((r) => {
        run[r.kd] = r.a;
      });
      lg.forEach((t) => {
        if (t.y !== yr) return;
        const r = idx[t.kd] || idx[t.nm];
        if (!r) return;
        const k = `${r.kd}|${t.m}`;
        (io[k] || (io[k] = { i: 0, o: 0 }))[t.j] += t.q;
      });
      const built: ReagentMonth[] = [];
      for (let m = 0; m <= last; m++) {
        if (m === ci) {
          built.push(cur);
          ms.forEach((r) => {
            const x = io[`${r.kd}|${m}`] || { i: 0, o: 0 };
            run[r.kd] += x.i - x.o;
          });
          continue;
        }
        const items: ReagentItem[] = [];
        ms.forEach((r) => {
          const x = io[`${r.kd}|${m}`] || { i: 0, o: 0 };
          const aw = run[r.kd];
          const ak = aw + x.i - x.o;
          run[r.kd] = ak;
          if (!r.aktif) return;
          items.push({
            n: r.n,
            s: r.s,
            a: aw,
            i: x.i,
            o: x.o,
            e: ak,
            b: r.b,
            k: '',
            kd: r.kd,
            kt: r.kt,
            sa: r.sa,
            ex: '',
            w: '',
          });
        });
        built.push({ name: MONTHS_FULL[m], yr, items });
      }
      if (built.length) return { months: built, live: true };
    }
  } catch {
    // fallback to single current month from STOK OPNAME
  }
  return { months: curMonths, live: true };
}

// ==================== 3. INDIKATOR MUTU LAB ====================
const MUTU_SID = '1kvkQXjqyGytj7MSHAz_a6zoznmHKAITRkXrtV5lWMlc';

export const FALLBACK_MUTU: MutuYearMap = {
  2025: [80, 89, 78, 90, 100, 93, 98, 97, 98, 96, 96, 96],
  2026: [85, 71, 95, 55, 80, 63, 67, 62, 70, null, null, null],
};

function numId(s: unknown): number | null {
  if (s == null) return null;
  let str = String(s).replace(/[%\s]/g, '');
  if (!str) return null;
  if (str.includes(',')) str = str.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

function monthIdx(s: unknown): number {
  const u = String(s || '').toUpperCase().trim();
  if (!u) return -1;
  for (let i = 0; i < 12; i++) if (u.indexOf(MONTHS_UPPER[i]) === 0) return i;
  return -1;
}

export async function fetchMutuData(): Promise<{ data: MutuYearMap; live: boolean }> {
  const url = `https://docs.google.com/spreadsheets/d/${MUTU_SID}/gviz/tq?tqx=out:csv&gid=0&_=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const txt = await res.text();
  if (/^\s*</.test(txt)) throw new Error('Sheet belum publik');
  const rows = parseCSV(txt);
  const out: MutuYearMap = {};
  let hi = -1;
  let yc = -1;
  let mc: Record<number, number> = {};
  for (let i = 0; i < rows.length && hi < 0; i++) {
    let t = -1;
    let cnt = 0;
    const map: Record<number, number> = {};
    for (let j = 0; j < rows[i].length; j++) {
      const h = String(rows[i][j] || '').toUpperCase().trim();
      if (h === 'TAHUN') t = j;
      const m = monthIdx(h);
      if (m > -1 && h.length <= 10) {
        map[j] = m;
        cnt++;
      }
    }
    if (t > -1 && cnt >= 6) {
      hi = i;
      yc = t;
      mc = map;
    }
  }
  if (hi > -1) {
    for (let i = hi + 1; i < rows.length; i++) {
      const y = String(rows[i][yc] || '').trim();
      if (!/^(19|20)\d\d$/.test(y)) continue;
      const v: (number | null)[] = Array(12).fill(null);
      let any = false;
      for (const c in mc) {
        const n = numId(rows[i][+c]);
        if (n != null) {
          v[mc[+c]] = n;
          any = true;
        }
      }
      if (any) out[+y] = v;
    }
  }
  if (!Object.keys(out).length) {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      for (let j = 0; j < r.length - 1; j++) {
        const ys = String(r[j] || '').replace(/^(2)[.,](\d{3})$/, '$1$2').trim();
        if (!/^(19|20)\d\d$/.test(ys)) continue;
        const m = monthIdx(r[j + 1]);
        if (m < 0) continue;
        let n: number | null = null;
        for (let k = j + 2; k < r.length && n == null; k++) n = numId(r[k]);
        if (n == null) break;
        if (n > 0 && n <= 1) n = Math.round(n * 1000) / 10;
        if (!out[+ys]) out[+ys] = Array(12).fill(null);
        out[+ys][m] = n;
        break;
      }
    }
  }
  if (!Object.keys(out).length) throw new Error('Kosong');
  return { data: out, live: true };
}

// ==================== 4. TREN PER KELURAHAN ====================
export const KEL_CATS = [
  'Kimia Klinik',
  'Hematologi',
  'Imunologi',
  'Urinalisa',
  'NAPZA / Toksikologi',
  'Mikrobiologi & Parasitologi',
  'Lain-lain',
];

export const FALLBACK_KELURAHAN: KelurahanData = {
  years: [2021, 2022, 2023, 2024, 2025, 2026],
  kel: [
    'Sanga Sanga Dalam',
    'Jawa',
    'Sanga Sanga Muara',
    'Pendingin',
    'Sarijaya',
    'Bantuas',
    'Muara Kembang',
    'Lainnya (luar wilayah / tidak diisi)',
  ],
  months: { 2026: 10 },
  val: {
    2021: {
      'Sanga Sanga Dalam': [333, 310, 1278, 154, 44, 45, 0],
      Jawa: [117, 144, 489, 75, 28, 10, 0],
      'Sanga Sanga Muara': [46, 123, 242, 78, 2, 7, 0],
      Pendingin: [62, 173, 391, 101, 11, 10, 0],
      Sarijaya: [21, 45, 219, 20, 4, 3, 0],
      Bantuas: [3, 8, 42, 3, 7, 1, 0],
      'Muara Kembang': [5, 3, 7, 0, 0, 2, 0],
      'Lainnya (luar wilayah / tidak diisi)': [39, 40, 541, 14, 7, 3, 0],
    },
    2022: {
      'Sanga Sanga Dalam': [499, 380, 595, 180, 173, 74, 0],
      Jawa: [147, 181, 246, 97, 75, 32, 0],
      'Sanga Sanga Muara': [85, 136, 165, 60, 34, 43, 0],
      Pendingin: [87, 173, 243, 100, 46, 47, 0],
      Sarijaya: [30, 60, 84, 18, 27, 12, 0],
      Bantuas: [16, 9, 27, 5, 49, 2, 0],
      'Muara Kembang': [4, 3, 9, 3, 24, 2, 0],
      'Lainnya (luar wilayah / tidak diisi)': [68, 59, 307, 28, 31, 8, 0],
    },
    2023: {
      'Sanga Sanga Dalam': [897, 844, 429, 182, 148, 103, 0],
      Jawa: [391, 334, 200, 96, 77, 33, 0],
      'Sanga Sanga Muara': [423, 219, 179, 85, 53, 35, 0],
      Pendingin: [238, 224, 186, 99, 56, 19, 0],
      Sarijaya: [203, 105, 68, 29, 32, 13, 0],
      Bantuas: [23, 40, 42, 12, 35, 3, 0],
      'Muara Kembang': [17, 12, 11, 7, 12, 0, 0],
      'Lainnya (luar wilayah / tidak diisi)': [72, 48, 92, 11, 15, 4, 0],
    },
    2024: {
      'Sanga Sanga Dalam': [782, 738, 544, 183, 176, 101, 0],
      Jawa: [360, 277, 207, 82, 85, 39, 0],
      'Sanga Sanga Muara': [254, 216, 151, 96, 31, 31, 0],
      Pendingin: [337, 241, 196, 106, 27, 45, 0],
      Sarijaya: [116, 102, 90, 30, 30, 14, 0],
      Bantuas: [24, 31, 37, 9, 31, 6, 0],
      'Muara Kembang': [20, 12, 21, 6, 10, 3, 0],
      'Lainnya (luar wilayah / tidak diisi)': [52, 32, 93, 10, 17, 6, 0],
    },
    2025: {
      'Sanga Sanga Dalam': [757, 290, 394, 227, 190, 83, 0],
      Jawa: [339, 161, 157, 74, 76, 26, 0],
      'Sanga Sanga Muara': [180, 98, 135, 51, 88, 81, 0],
      Pendingin: [288, 161, 174, 49, 100, 26, 0],
      Sarijaya: [123, 53, 66, 24, 39, 57, 0],
      Bantuas: [18, 13, 11, 42, 7, 1, 0],
      'Muara Kembang': [13, 6, 7, 21, 3, 1, 0],
      'Lainnya (luar wilayah / tidak diisi)': [106, 76, 60, 17, 35, 2, 0],
    },
    2026: {
      'Sanga Sanga Dalam': [713, 400, 210, 208, 91, 29, 0],
      Jawa: [269, 184, 116, 92, 63, 24, 0],
      'Sanga Sanga Muara': [198, 175, 115, 98, 42, 24, 0],
      Pendingin: [209, 174, 99, 89, 44, 12, 0],
      Sarijaya: [126, 73, 45, 46, 21, 5, 0],
      Bantuas: [22, 21, 13, 9, 15, 1, 0],
      'Muara Kembang': [12, 10, 9, 4, 18, 1, 0],
      'Lainnya (luar wilayah / tidak diisi)': [106, 54, 71, 25, 9, 5, 0],
    },
  },
  live: false,
};

export async function fetchKelurahanData(): Promise<KelurahanData> {
  const url = `https://docs.google.com/spreadsheets/d/${STOK_SID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    'REKAP KELURAHAN'
  )}&_=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const t = await res.text();
  if (/^\s*</.test(t)) throw new Error('Sheet belum publik');
  const rows = parseCSV(t);
  const LAYOUT: Record<number, number[]> = {
    2021: [0, 2, 1, 3, 4, 5, 5],
    2022: [0, 2, 1, 3, 4, 5, 5],
    2023: [0, 2, 1, 3, 4, 5, 5],
    2024: [0, 2, 1, 3, 4, 5, 5],
    2025: [0, 2, 1, 3, 4, 5, 5],
    2026: [0, 2, 1, 3, 4, 5, 5],
  };
  const catOf = (h: string) => {
    const l = h.toLowerCase();
    if (/kimia/.test(l)) return 0;
    if (/hemato/.test(l)) return 1;
    if (/imuno/.test(l)) return 2;
    if (/urina/.test(l)) return 3;
    if (/napza|toksiko/.test(l)) return 4;
    if (/mikrob|parasit/.test(l)) return 5;
    return l.trim() && !/^(no|nomor|total|jumlah)$/.test(l.trim()) ? 6 : -1;
  };
  const isLain = (k: string) => /lainnya/i.test(k);
  const title = (n: string) =>
    isLain(n)
      ? 'Lainnya (luar wilayah / tidak diisi)'
      : n.toLowerCase().replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase());

  const out: KelurahanData = { years: [], kel: [], months: { 2026: 10 }, val: {}, live: true };
  let lain = false;
  const known = Object.keys(LAYOUT).map(Number).sort((a, b) => a - b);

  for (let i = 0; i < rows.length; i++) {
    const m = /^(?:tahun|riwayat)\s+(\d{4})/i.exec(String(rows[i][0] || '').trim());
    if (!m) continue;
    const y = +m[1];
    let label = '';
    for (let c = 1; c < rows[i].length; c++) label += ' ' + String(rows[i][c] || '');
    const mm = /JANUARI\s*-\s*([A-Z]+)/.exec(label.toUpperCase());
    if (mm && MONTHS_UPPER.indexOf(mm[1]) > -1) out.months[y] = MONTHS_UPPER.indexOf(mm[1]) + 1;
    let h = -1;
    for (let j = i + 1; j <= i + 3 && j < rows.length; j++) {
      if (/^kelurahan$/i.test(String(rows[j][0] || '').trim())) {
        h = j;
        break;
      }
    }
    if (h < 0) continue;
    let map: number[] = [];
    let ok = 0;
    for (let c = 1; c < rows[h].length; c++) {
      const txt = String(rows[h][c] || '').trim();
      if (/^total$/i.test(txt)) break;
      const ci = catOf(txt);
      map.push(ci);
      if (ci > -1) ok++;
    }
    if (ok < 5) {
      let yy = y;
      if (!LAYOUT[yy]) {
        yy = known[known.length - 1];
        for (const k of known) if (k <= y) yy = k;
      }
      map = LAYOUT[yy].slice();
    }
    const vals: Record<string, number[]> = {};
    for (let j = h + 1; j < rows.length; j++) {
      const nm = String(rows[j][0] || '').trim();
      if (!nm || /^total/i.test(nm)) break;
      const v = [0, 0, 0, 0, 0, 0, 0];
      for (let k = 0; k < map.length; k++) {
        if (map[k] > -1) v[map[k]] += parseIntOnly(rows[j][k + 1]);
      }
      const name = title(nm);
      vals[name] = v;
      if (isLain(name)) lain = true;
      else if (!out.kel.includes(name)) out.kel.push(name);
    }
    if (Object.keys(vals).length) {
      if (out.val[y]) {
        Object.keys(vals).forEach((n) => {
          const a = out.val[y][n] || (out.val[y][n] = [0, 0, 0, 0, 0, 0, 0]);
          for (let q = 0; q < 7; q++) a[q] += vals[n][q];
        });
      } else out.val[y] = vals;
      if (!out.years.includes(y)) out.years.push(y);
    }
  }
  if (lain) out.kel.push(title('LAINNYA'));
  out.years.sort((a, b) => a - b);
  if (!out.years.length || !out.kel.length) throw new Error('Kosong');
  return out;
}

// ==================== 5. PEMERIKSAAN HARIAN & BULANAN 2026 ====================
function buildFallbackDaily(): DailyMonth[] {
  const samplePattern = [
    [18, 46], [22, 54], [16, 41], [20, 49], [14, 34], [9, 21], [0, 0],
    [25, 62], [19, 48], [21, 51], [17, 42], [15, 36], [11, 25], [0, 0],
    [23, 58], [20, 49], [28, 69], [18, 45], [16, 39], [10, 24], [0, 0],
    [21, 53], [24, 59], [19, 46], [17, 41], [14, 33], [8, 19], [0, 0],
    [22, 55], [20, 48], [15, 37],
  ];
  return [7, 8, 9].map((mi) => {
    const dim = new Date(2026, mi + 1, 0).getDate();
    const factor = mi === 9 ? 1.06 : mi === 8 ? 0.96 : 1;
    const days = [];
    for (let d = 1; d <= dim; d++) {
      const dow = (new Date(2026, mi, d).getDay() + 6) % 7;
      if (dow === 6) {
        days.push({ d, dow, pas: 0, pem: 0, buka: false });
      } else {
        const base = samplePattern[(d - 1) % samplePattern.length];
        const pas = Math.max(6, Math.round(base[0] * factor));
        const pem = Math.max(15, Math.round(base[1] * factor));
        days.push({ d, dow, pas, pem, buka: true });
      }
    }
    return { mi, yr: 2026, name: `${MONTHS_FULL[mi]} 2026`, days };
  });
}

export const FALLBACK_DAILY_2026: DailyMonth[] = buildFallbackDaily();

export async function fetchDaily2026(): Promise<{ months: DailyMonth[]; live: boolean }> {
  const TABS = [
    'LAB JAN', 'LAB FEB', 'LAB MAR', 'LAB APR', 'LAB MEI', 'LAB JUN',
    'LAB JUL', 'LAB AGU', 'LAB SEP', 'LAB OKT', 'LAB NOV', 'LAB DES',
  ];
  const res = await Promise.all(
    TABS.map(async (t, mi) => {
      try {
        const r = await fetch(
          `https://docs.google.com/spreadsheets/d/${STOK_SID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
            t
          )}&_=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (!r.ok) return null;
        const txt = await r.text();
        if (/^\s*</.test(txt)) return null;
        const rows = parseCSV(txt);
        const hd = rows.findIndex(
          (rw) =>
            String(rw[0] || '').trim().toLowerCase() === 'kategori' ||
            (String(rw[2] || '').trim() === '1' && String(rw[3] || '').trim() === '2')
        );
        if (hd < 0) return null;
        const col: Record<number, number> = {};
        rows[hd].forEach((x, k) => {
          const s = String(x ?? '').trim();
          if (k >= 2 && /^\d{1,2}$/.test(s)) {
            const n = +s;
            if (n >= 1 && n <= 31 && col[n] == null) col[n] = k;
          }
        });
        const pem: number[] = [];
        const pas: number[] = [];
        rows.forEach((rw) => {
          const a = String(rw[0] || '').trim().toLowerCase();
          const b = String(rw[1] || '').trim().toLowerCase();
          if (a === 'total harian') {
            for (let d = 1; d <= 31; d++) if (col[d] != null) pem[d] = parseIntOnly(rw[col[d]]);
          }
          if (b === 'total pasien') {
            for (let d = 1; d <= 31; d++) if (col[d] != null) pas[d] = parseIntOnly(rw[col[d]]);
          }
        });
        const n = new Date(2026, mi + 1, 0).getDate();
        const days = [];
        for (let d = 1; d <= n; d++) {
          const pm = pem[d] || 0;
          const pt = pas[d] || 0;
          days.push({
            d,
            dow: (new Date(2026, mi, d).getDay() + 6) % 7,
            pas: pt,
            pem: pm,
            buka: pt > 0 || pm > 0,
          });
        }
        return days.some((x) => x.buka)
          ? { mi, yr: 2026, name: `${MONTHS_FULL[mi]} 2026`, days }
          : null;
      } catch {
        return null;
      }
    })
  );
  const valid = res.filter((x): x is DailyMonth => Boolean(x));
  if (!valid.length) throw new Error('Tidak ada data harian');
  return { months: valid, live: true };
}

export const FALLBACK_MONTHLY_2026: Monthly2026Data = (() => {
  const items = [
    { kat: 'Kimia Klinik', n: 'Gula Darah Sewaktu', v: [98, 88, 102, 82, 95, 92, 108, 114, 105, 118, 0, 0] },
    { kat: 'Hematologi', n: 'Darah Lengkap', v: [82, 74, 89, 71, 84, 79, 96, 102, 91, 104, 0, 0] },
    { kat: 'Kimia Klinik', n: 'Kolesterol', v: [76, 68, 81, 64, 73, 71, 88, 92, 84, 96, 0, 0] },
    { kat: 'Hematologi', n: 'Hemoglobin (HB)', v: [54, 49, 61, 47, 56, 52, 64, 68, 59, 71, 0, 0] },
    { kat: 'Imunologi', n: 'HbsAg', v: [42, 38, 45, 36, 44, 41, 49, 51, 47, 53, 0, 0] },
    { kat: 'Imunologi', n: 'Anti HIV', v: [41, 37, 44, 35, 43, 40, 48, 50, 46, 52, 0, 0] },
    { kat: 'Urinalisa', n: '3 Parameter (Urine Rutin)', v: [39, 34, 42, 31, 38, 37, 45, 47, 43, 49, 0, 0] },
    { kat: 'Imunologi', n: 'Napza 3 Parameter', v: [48, 42, 51, 39, 46, 55, 62, 68, 64, 72, 0, 0] },
    { kat: 'Mikrobiologi', n: 'TCM MTB/RIF', v: [32, 29, 36, 28, 35, 38, 41, 46, 42, 44, 0, 0] },
    { kat: 'Kimia Klinik', n: 'Asam Urat', v: [36, 31, 38, 29, 34, 33, 42, 44, 40, 46, 0, 0] },
    { kat: 'Imunologi', n: 'Sifilis (TP)', v: [38, 34, 41, 33, 40, 38, 44, 47, 43, 48, 0, 0] },
    { kat: 'Hematologi', n: 'Golongan Darah', v: [26, 23, 29, 21, 27, 25, 31, 34, 29, 35, 0, 0] },
  ];
  const tot = Array(12).fill(0);
  items.forEach((it) => it.v.forEach((val, idx) => (tot[idx] += val)));
  return { items, tot, live: false };
})();

export async function fetchMonthly2026(): Promise<Monthly2026Data> {
  const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  const urls = [
    `https://docs.google.com/spreadsheets/d/${STOK_SID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
      'REKAP TAHUNAN'
    )}&_=${Date.now()}`,
    `https://docs.google.com/spreadsheets/d/${STOK_SID}/gviz/tq?tqx=out:csv&gid=780669091&_=${Date.now()}`,
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) continue;
      const t = await r.text();
      if (/^\s*</.test(t)) continue;
      const rows = parseCSV(t);
      const hd = rows.findIndex(
        (rw) =>
          String(rw[0] || '').trim().toLowerCase() === 'kategori' &&
          String(rw[2] || '').trim().toUpperCase() === 'JAN'
      );
      if (hd < 0) continue;
      const col: Record<number, number> = {};
      rows[hd].forEach((x, j) => {
        const m = MON.indexOf(String(x || '').trim().toUpperCase());
        if (m >= 0 && col[m] == null) col[m] = j;
      });
      if (Object.keys(col).length < 12) continue;
      const items = [];
      const tot = Array(12).fill(0);
      for (let i = hd + 1; i < rows.length; i++) {
        const kat = String(rows[i][0] || '').trim();
        const jn = String(rows[i][1] || '').trim();
        if (!jn) break;
        const v: number[] = [];
        for (let k = 0; k < 12; k++) {
          v[k] = parseIntOnly(rows[i][col[k]]);
          tot[k] += v[k];
        }
        items.push({ kat: kat || 'Lainnya', n: jn, v });
      }
      if (items.length) return { items, tot, live: true };
    } catch {
      // try next url
    }
  }
  throw new Error('Gagal memuat REKAP TAHUNAN');
}

// ==================== 6. STANDAR DEVIASI QC (LEVEY-JENNINGS) ====================
const QC_SID = '1EjhqFF-AkdaHBIsNeOaozPOoH-36YYgIY3zCEk5oxm4';
export const QC_SHEET_URL = `https://docs.google.com/spreadsheets/d/${QC_SID}/edit`;

function buildQcBlock(
  group: 'hematologi' | 'kimia',
  source: string,
  param: string,
  label: string,
  lot: string,
  values: number[],
  dates?: string[]
): QcBlock {
  const pts = values.map((v, idx) => ({
    d: dates ? dates[idx] : `Hari ${idx + 1}`,
    v,
  }));
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  const sd =
    values.length > 1
      ? Math.sqrt(values.reduce((a, b) => a + (b - m) * (b - m), 0) / (values.length - 1))
      : 0;
  return { group, source, param, label, lot, mean: m, sd, pts };
}

export const FALLBACK_QC: QcBlock[] = [
  buildQcBlock(
    'hematologi',
    'Data Kontrol Hematologi (Cadangan)',
    'HEMOGLOBIN',
    '2026 · TW 3',
    '',
    [13.4, 13.5, 13.2, 13.6, 13.3, 13.7, 13.5, 13.4, 13.9, 13.5, 13.3, 13.1, 13.4, 13.6, 13.5, 13.8, 13.4, 13.2, 14.1, 13.5]
  ),
  buildQcBlock(
    'hematologi',
    'Data Kontrol Hematologi (Cadangan)',
    'LEUKOSIT',
    '2026 · TW 3',
    '',
    [7.2, 7.4, 7.1, 7.3, 7.5, 7.0, 7.2, 7.6, 7.3, 7.1, 7.4, 7.2, 7.9, 7.3, 7.1, 7.2, 7.4, 7.3, 7.0, 7.2]
  ),
  buildQcBlock(
    'hematologi',
    'Data Kontrol Hematologi (Cadangan)',
    'TROMBOSIT',
    '2026 · TW 3',
    '',
    [245, 248, 241, 250, 244, 252, 246, 239, 255, 247, 243, 249, 246, 261, 245, 244, 248, 242, 247, 246]
  ),
  buildQcBlock(
    'hematologi',
    'Data Kontrol Hematologi (Cadangan)',
    'HEMATOKRIT',
    '2026 · TW 3',
    '',
    [40.2, 40.5, 39.9, 40.7, 40.1, 40.8, 40.4, 40.0, 41.1, 40.3, 40.2, 39.8, 40.5, 40.6, 40.3, 40.9, 40.2, 40.1, 40.4, 40.3]
  ),
  buildQcBlock(
    'kimia',
    'Data Kontrol Kimia Klinik (Cadangan)',
    'Gula Darah',
    'Lot GLU-2608',
    'GLU-2608',
    [102, 104, 100, 103, 105, 101, 102, 106, 103, 100, 104, 102, 109, 103, 101, 102, 104, 103]
  ),
  buildQcBlock(
    'kimia',
    'Data Kontrol Kimia Klinik (Cadangan)',
    'Kolesterol',
    'Lot CHOL-2608',
    'CHOL-2608',
    [186, 188, 184, 189, 185, 190, 187, 183, 191, 186, 185, 188, 187, 195, 186, 185, 188, 187]
  ),
  buildQcBlock(
    'kimia',
    'Data Kontrol Kimia Klinik (Cadangan)',
    'Asam Urat',
    'Lot AU-2608',
    'AU-2608',
    [5.4, 5.5, 5.3, 5.6, 5.4, 5.5, 5.3, 5.7, 5.4, 5.2, 5.5, 5.4, 5.6, 5.5, 5.3, 5.4, 5.5, 5.4]
  ),
];

export async function fetchQcData(): Promise<{ blocks: QcBlock[]; live: boolean }> {
  const SRC: { gid: string; group: 'hematologi' | 'kimia'; name: string }[] = [
    { gid: '18484466', group: 'hematologi', name: 'Data Kontrol Hematologi' },
    { gid: '1252703038', group: 'kimia', name: 'Data Kontrol Kimia Klinik' },
  ];
  const normQC = (v: unknown) => String(v ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const numQC = (x: unknown): number | null => {
    if (x == null) return null;
    let s = String(x).trim().replace(/\s/g, '');
    if (!s || !/[0-9]/.test(s)) return null;
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(',', '.');
    const v = parseFloat(s);
    return isFinite(v) ? v : null;
  };
  const H_ALIAS: Record<string, string[]> = {
    LEUKOSIT: ['LEUKOSIT', 'LEUKOSITT', 'LEUKOCYTE', 'LEUKOCYTES', 'WBC', 'LEU'],
    ERITROSIT: ['ERITROSIT', 'ERITROSITT', 'ERYTHROCYTE', 'ERYTHROCYTES', 'RBC', 'ERI'],
    HEMOGLOBIN: ['HEMOGLOBIN', 'HEMOGLOBINE', 'HB', 'HGB'],
    HEMATOKRIT: ['HEMATOKRIT', 'HEMATOCRIT', 'HCT'],
    TROMBOSIT: ['TROMBOSIT', 'TROMBOSITT', 'PLT', 'PLATELET', 'PLATELETS', 'TROMBOCYTE'],
  };
  const hParam = (v: string) => {
    const k = normQC(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const p in H_ALIAS) if (H_ALIAS[p].includes(k)) return p;
    return null;
  };
  const hYr = (t: string) => {
    const m = String(t || '').match(/\b(20\d\d)\b/);
    return m ? Number(m[1]) : null;
  };
  const hTW2 = (s: string) => {
    const t = String(s || '').replace(/\u00a0/g, ' ').toUpperCase();
    const m = t.match(/\b(?:TW|T\.W\.?|TRIWULAN|TRI\s?WULAN)\s*[-:.]?\s*(IV|III|II|I|[1-4])\b/);
    if (!m) return null;
    const rom: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
    return rom[m[1]] || Number(m[1]);
  };
  const addBlk = (
    out: QcBlock[],
    group: 'hematologi' | 'kimia',
    source: string,
    param: string,
    label: string,
    lot: string,
    pts: { d: string; v: number }[]
  ) => {
    if (!pts.length) return;
    const vals = pts.map((p) => p.v);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd =
      vals.length > 1
        ? Math.sqrt(vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (vals.length - 1))
        : 0;
    out.push({ group, source, param, label, lot, mean, sd, pts });
  };

  const parseH = (rows: string[][], src: (typeof SRC)[0]) => {
    const out: QcBlock[] = [];
    const state: Record<number, { y: number | null; t: number | null; last?: number; mk?: boolean }> = {};
    const groups: Record<string, { param: string; label: string; pts: { d: string; v: number }[] }> = {};
    const order: string[] = [];
    const layouts: { row: number; blocks: { no: number; end: number; cols: Record<string, number> }[] }[] = [];
    let maxCols = 0;
    rows.forEach((r) => {
      if (r.length > maxCols) maxCols = r.length;
    });
    rows.forEach((r, ri) => {
      const cells = r.map((x) => normQC(x));
      const occ: { p: string; c: number }[] = [];
      cells.forEach((v, c) => {
        const p = hParam(v);
        if (p) occ.push({ p, c });
      });
      if (new Set(occ.map((o) => o.p)).size < 2) return;
      const blocks: { no: number; end: number; cols: Record<string, number> }[] = [];
      let cur: { no: number; end: number; cols: Record<string, number> } | null = null;
      occ.forEach((o) => {
        if (!cur || cur.cols[o.p] !== undefined) {
          cur = { no: Math.max(0, o.c - 1), end: maxCols, cols: {} };
          blocks.push(cur);
        }
        cur.cols[o.p] = o.c;
      });
      blocks.forEach((b, k) => {
        b.end = k + 1 < blocks.length ? blocks[k + 1].no : maxCols;
        if (!state[b.no]) state[b.no] = { y: null, t: null };
      });
      layouts.push({ row: ri, blocks });
    });
    if (!layouts.length) return out;
    rows.forEach((r, ri) => {
      let lay = layouts[0];
      for (const l of layouts) if (l.row <= ri) lay = l;
      const cells = r.map((x) => normQC(x));
      lay.blocks.forEach((b) => {
        const st = state[b.no];
        for (let c = b.no; c < Math.min(b.end, cells.length); c++) {
          const txt = cells[c] || '';
          const y = hYr(txt);
          if (y) {
            st.y = y;
            st.last = undefined;
          }
          const t = hTW2(txt);
          if (t) {
            st.t = t;
            st.mk = true;
          }
        }
        if (ri <= lay.row) return;
        const dayTxt = cells[b.no] || '';
        if (!/^\d{1,2}(\.0+)?$/.test(dayTxt)) return;
        const day = Number(dayTxt.replace(/\.0+$/, ''));
        if (day < 1 || day > 31) return;
        if (st.last !== undefined && day <= st.last && !st.mk) st.t = (st.t || 1) + 1;
        st.mk = false;
        st.last = day;
        Object.keys(b.cols).forEach((p) => {
          const val = numQC(r[b.cols[p]]);
          if (val == null) return;
          const y = st.y || 0;
          const t = st.t || 1;
          const key = `${b.no}|${y}|${t}|${p}`;
          if (!groups[key]) {
            groups[key] = { param: p, label: `${y || 'Tahun'} · TW ${t}`, pts: [] };
            order.push(key);
          }
          groups[key].pts.push({ d: `Hari ${day}`, v: val });
        });
      });
    });
    order.forEach((k) => {
      const g = groups[k];
      addBlk(out, 'hematologi', src.name, g.param, g.label, '', g.pts);
    });
    return out;
  };

  const dtQC = (x: unknown): Date | null => {
    const s = String(x || '').trim();
    let m = s.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/);
    if (m) return new Date(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const parseK = (rows: string[][], src: (typeof SRC)[0]) => {
    const out: QcBlock[] = [];
    let heads: { p: string; d: number; v: number }[] = [];
    rows.forEach((r, ri) => {
      const cells = r.map((x) => normQC(x).toUpperCase());
      cells.forEach((v, d) => {
        if (!/^TANGGAL$/.test(v)) return;
        let vc = -1;
        for (let c = d + 1; c < Math.min(r.length, d + 4); c++) {
          if (/^NILAI$/.test(cells[c])) {
            vc = c;
            break;
          }
        }
        if (vc < 0 && d + 1 < r.length) vc = d + 1;
        if (vc < 0) return;
        let label = '';
        for (let y = ri - 1; y >= Math.max(0, ri - 3); y--) {
          const cand = normQC(rows[y][d]).toUpperCase();
          if (/KOLESTEROL/.test(cand)) { label = 'Kolesterol'; break; }
          if (/ASAM\s*URAT/.test(cand)) { label = 'Asam Urat'; break; }
          if (/QC\s*GULA|GULA/.test(cand)) { label = 'Gula Darah'; break; }
        }
        if (!label) label = d === 0 ? 'Gula Darah' : d === 4 ? 'Kolesterol' : d === 7 ? 'Asam Urat' : '';
        if (label) heads.push({ p: label, d, v: vc });
      });
    });
    if (!heads.length)
      heads = [
        { p: 'Gula Darah', d: 0, v: 1 },
        { p: 'Kolesterol', d: 4, v: 5 },
        { p: 'Asam Urat', d: 7, v: 8 },
      ];
    heads.forEach((f) => {
      const map: Record<string, { d: Date; v: number }[]> = {};
      const order: string[] = [];
      let lot: string | null = null;
      let needNew = false;
      rows.forEach((r) => {
        const dateRaw = normQC(r[f.d]);
        const raw = normQC(r[f.v]);
        const mark = dateRaw.toLowerCase().replace(/[.:]/g, '').replace(/\s+/g, ' ');
        const lotCell = raw.replace(/^(\d+)\.0+$/, '$1');
        if (/^no\s*lot$/.test(mark) || mark === 'nolot') {
          if (lotCell) {
            lot = lotCell;
            needNew = false;
          } else {
            lot = null;
            needNew = true;
          }
          return;
        }
        if (!dateRaw) {
          if (!raw) {
            needNew = true;
            return;
          }
          if (/\d/.test(lotCell) && /^[A-Za-z0-9][A-Za-z0-9.\-/]*$/.test(lotCell)) {
            lot = lotCell;
            needNew = false;
          }
          return;
        }
        if (!/^\s*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|Date\()/.test(dateRaw)) return;
        const val = numQC(raw);
        if (val == null) return;
        const d = dtQC(dateRaw);
        if (!d) return;
        if (lot == null || needNew) {
          lot = `Lot (${d.toLocaleDateString('id-ID')})`;
          needNew = false;
        }
        if (!map[lot]) {
          map[lot] = [];
          order.push(lot);
        }
        map[lot].push({ d, v: val });
      });
      order.forEach((l) => {
        const pts = map[l]
          .sort((a, b) => a.d.getTime() - b.d.getTime())
          .map((x) => ({ d: x.d.toLocaleDateString('id-ID'), v: x.v }));
        addBlk(out, 'kimia', src.name, f.p, `Lot ${l}`, l, pts);
      });
    });
    return out;
  };

  const parts = await Promise.all(
    SRC.map(async (src) => {
      try {
        const r = await fetch(
          `https://docs.google.com/spreadsheets/d/${QC_SID}/gviz/tq?tqx=out:csv&gid=${src.gid}&_=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (!r.ok) return [];
        const t = await r.text();
        if (/^\s*</.test(t)) return [];
        const rows = parseCSV(t);
        return src.group === 'hematologi' ? parseH(rows, src) : parseK(rows, src);
      } catch {
        return [];
      }
    })
  );
  const all = parts.flat();
  if (!all.length) throw new Error('Data QC tidak terbaca');
  return { blocks: all, live: true };
}

// ==================== 7. PORTAL TAUTAN & PANDUAN ====================
export const PORTAL_LINKS: PortalLink[] = [
  { title: 'LAPORAN TAHUNAN LAB', subtitle: 'Spreadsheet Google Sheets', href: 'https://docs.google.com/spreadsheets/d/1K332LzWdG6W4S7eOYeVjq2rZHHgtEnR9-bqdUOObHHA/edit?gid=1810939200#gid=1810939200', icon: '📑', category: 'laporan' },
  { title: 'LAPORAN LAB DINKES 2025', subtitle: 'Spreadsheet Google Sheets', href: 'https://docs.google.com/spreadsheets/d/1B-t4mJUyoYu9nfMaUtUBodXyAyhjAQt9SM8aZPrp1eo/edit?pli=1&gid=926263035#gid=926263035', icon: '📈', category: 'laporan' },
  { title: 'LAPORAN LAB DINKES 2026', subtitle: 'Spreadsheet Google Sheets', href: 'https://docs.google.com/spreadsheets/d/1PkluZtQhLRpKCHIXZB0O_bZYO1Zu_InMjYQ0mz1mc64/edit?gid=1422117293#gid=1422117293', icon: '📉', category: 'laporan' },
  { title: 'PROFIL LABKESMAS 2025', subtitle: 'Spreadsheet Google Sheets', href: 'https://docs.google.com/spreadsheets/d/1FhQ2jCshZnxTlpWAaSbmGYWH-4pds9_BZakWUj0fPgA/edit?gid=75482110#gid=75482110', icon: '🏥', category: 'laporan' },
  { title: 'LOGBOOK ALAT LAB', subtitle: 'Spreadsheet Google Sheets', href: 'https://docs.google.com/spreadsheets/d/1zCCMZsa4Fcf-pYirrqIpPws3VdZFYW3eo-2VDhH4y0I/edit?gid=1156050446#gid=1156050446', icon: '🏭', category: 'laporan', internal: true },
  { title: 'FORM HASIL LAB PKM SANGA-SANGA', subtitle: 'Spreadsheet Google Sheets', href: 'https://docs.google.com/spreadsheets/d/12CArNFYDd0HzPs9nB-735EVE9pbyY3AatEq6xuG13W4/edit?gid=707316538#gid=707316538', icon: '🛰️', category: 'laporan', internal: true },
  { title: 'PROFIL LAB 2017-2019', subtitle: 'Google Drive Folder', href: 'https://drive.google.com/drive/folders/15PPx5AWBJ66Hf7Cwf3jChfQY-aADDKRw?usp=drive_link', icon: '🏪', category: 'laporan' },
  { title: 'FORM PEMETAAN LAB 2020-2025', subtitle: 'Google Drive Folder', href: 'https://drive.google.com/drive/folders/1LxOXeWpnMWY8SFb89Jv6JrLBKikapMYn?usp=drive_link', icon: '🗺️', category: 'laporan' },

  { title: 'E PUSKESMAS', subtitle: 'Sistem Informasi Puskesmas', href: 'https://kutaikartanegara.epuskesmas.id/laboratorium', icon: '🖥️', category: 'aplikasi' },
  { title: 'INPUT SITB', subtitle: 'Sistem Informasi Tuberkulosis', href: 'https://kalimantan.sitb.id/sitb2024/app', icon: '📋', category: 'aplikasi' },
  { title: 'INPUT SIHA', subtitle: 'Sistem Informasi HIV AIDS', href: 'https://sihapims2.kemkes.go.id/home', icon: '💉', category: 'aplikasi' },
  { title: 'INPUT SIHEPI', subtitle: 'Sistem Hepatitis & PIMS', href: 'https://sihepi.kemkes.go.id/login', icon: '🧪', category: 'aplikasi' },
  { title: 'REGISTER TCM DAN FOLLOW UP', subtitle: 'Spreadsheet Google Sheets', href: 'https://docs.google.com/spreadsheets/d/1trrjzvtV7DNd8Iz-GWLps1plGz1XpPB9u20azQvE8yA/edit?gid=456419856#gid=456419856', icon: '🧫', category: 'aplikasi', internal: true },
  { title: 'ETB 12', subtitle: 'Formulir Pelaporan TB', href: 'http://etb12app.sitb.id/login', icon: '🗂️', category: 'aplikasi' },
  { title: 'REKAP TCM', subtitle: 'Spreadsheet Google Sheets', href: 'https://docs.google.com/spreadsheets/d/1y-YBm1BIy4meDpYETcJHnM1T-uscCVfA/edit?gid=122836114#gid=122836114', icon: '🗂️', category: 'aplikasi', internal: true },
  { title: 'CAPAIAN HIV', subtitle: 'Spreadsheet Google Sheets', href: 'https://docs.google.com/spreadsheets/d/1RO7pH6r_HMorcMkvhyzXf0XaLW0fG208/edit?gid=725900174#gid=725900174', icon: '🗂️', category: 'aplikasi', internal: true },

  { title: 'REKAP STOK, PENERIMAAN DAN PEMERIKSAAN LAB', subtitle: 'Logistik & Reagensia', href: 'https://docs.google.com/spreadsheets/d/1axwil6eYFLv8OPg44DwEL0SHawrB5r_tdzWnhR78clg/edit?gid=131724345#gid=131724345', icon: '📦', category: 'stok', internal: true },
  { title: 'INDIKATOR MUTU LAB', subtitle: 'Kendali Mutu Lab', href: 'https://drive.google.com/drive/folders/1LfaYHpD6A2v3oneXs2HfeRUubindPxFn?usp=drive_link', icon: '🗃️', category: 'stok', internal: true },
  { title: 'PROJECT STANDAR DEVIASI', subtitle: 'Kendali Mutu Lab', href: 'https://docs.google.com/spreadsheets/d/1EjhqFF-AkdaHBIsNeOaozPOoH-36YYgIY3zCEk5oxm4/edit?gid=1160961274#gid=1160961274', icon: '📊', category: 'stok', internal: true },
  { title: 'MEDICAL EQUIPMENT', subtitle: 'Google AppsScript WebApp', href: 'https://script.google.com/macros/s/AKfycbyEiD91ZY6ji3D6DPpAOpQHqSSeXJNOTeuPkqSyiJIRXiS0378mK59qPWVU3zVj1sUo/exec?utm_source=google+appscript&utm_medium=social&utm_campaign=optional', icon: '🩺', category: 'stok', internal: true },

  { title: 'SI PECI', subtitle: 'Kutai Kartanegara', href: 'https://peci.kukarkab.go.id/login', icon: '🔬', category: 'link' },
  { title: 'BANGKOM', subtitle: 'Pengembangan Kompetensi', href: 'https://bangkom.kukarkab.go.id/app/dashboard', icon: '🎓', category: 'link' },
  { title: 'LINK PKM SANGA-SANGA', subtitle: 'Portal Pelaporan Puskesmas', href: 'https://s.id/link_pelaporan99', icon: '🏛️', category: 'link' },
  { title: 'SMART PATELKI', subtitle: 'Organisasi Profesi ATLM', href: 'https://patelki.com/login', icon: '🏥', category: 'link' },
  { title: 'SATU SEHAT SDMK', subtitle: 'SDM Kesehatan', href: 'https://satusehat.kemkes.go.id/sdmk/login', icon: '🏬', category: 'link' },
  { title: 'PRAKTIS', subtitle: 'Absen Praktis', href: 'https://praktis.kukarkab.go.id/auth/login', icon: '🕓', category: 'link' },
  { title: 'Reset Device', subtitle: 'Reset Aplikasi', href: 'https://docs.google.com/forms/d/e/1FAIpQLSd2yN1mApB1X_lkKVJ3ikE6SZlufOr5H5A4Nq57rMVd6EjHTg/viewform', icon: '🆕', category: 'link' },
  { title: 'Panduan Reset Praktis', subtitle: 'Q&A Praktis', href: 'https://docs.google.com/spreadsheets/d/1z5GgDUQt2bkbeXnh4wAoKHW9QtAjob8uxui-lcOG6Iw/edit?gid=531613367#gid=531613367', icon: '⛱️', category: 'link' },

  { title: 'Google Calendar', subtitle: 'Catatan Kalender', href: 'https://calendar.google.com/calendar/u/0/r', icon: '📅', category: 'catatan' },
  { title: 'Google Tasks', subtitle: 'Catatan Harian', href: 'https://tasks.google.com/tasks/', icon: '✅', category: 'catatan' },
];

export const PANDUAN_ITEMS = [
  {
    t: 'Tampilan awal dan Mode Petugas',
    b: 'Tampilan awal menampilkan dashboard analitik modern (Beranda, Stok Reagensia, Ringkasan Laporan Tahunan, Indikator Mutu Lab, Tren per Kelurahan, dan Standar Deviasi QC). Aktifkan Mode Petugas di kanan atas untuk membuka Dashboard Tasks, Kalender Tugas, Backup Data JSON, serta seluruh tautan internal laboratorium.',
  },
  {
    t: 'Interaksi Grafik Modern',
    b: 'Seluruh grafik kini mendukung penyorotan crosshair interaktif, klik batang/titik untuk memilih tahun atau bulan secara langsung, toggle seri legenda untuk mengisolasi kategori tertentu, serta transisi animasi halus saat mengganti filter.',
  },
  {
    t: 'Tren per Kelurahan',
    b: 'Menu Tren per Kelurahan membaca sheet rekap pemeriksaan per kelurahan secara langsung. Tahun bertanda bintang (*) belum genap 12 bulan, gunakan opsi "Rata-rata per bulan" untuk perbandingan yang adil antar tahun.',
  },
  {
    t: 'Standar Deviasi QC (Levey-Jennings)',
    b: 'Grafik Levey-Jennings menampilkan zona ±1 SD, ±2 SD, dan ±3 SD beserta tanda aturan Westgard (1-2s peringatan, 1-3s tolak). Klik titik pada grafik untuk menyorot baris hasil kontrol terkait di tabel bawah.',
  },
  {
    t: 'Penyimpanan Tugas & Backup',
    b: 'Tugas dan daftar favorit tersimpan di browser perangkat Anda. Gunakan fitur Ekspor Data (JSON) di Dashboard Tasks maupun menu Pengaturan secara berkala untuk mencadangkan atau memindahkan data ke perangkat lain.',
  },
];

// ==================== 8. PENGATURAN PORTAL & OVERRIDE DATA TAHUNAN ====================
export const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    kicker: 'Pemberitahuan Layanan',
    title: 'Jadwal Pengambilan Sampel Rutin Pagi',
    desc: 'Loket penerimaan spesimen laboratorium beroperasi pukul 08.00 – 12.00 WITA setiap Senin hingga Sabtu (kecuali hari libur nasional).',
    meta: 'Pelayanan Rawat Jalan & KIA',
  },
  {
    kicker: 'Kendali Mutu Internal',
    title: 'Kalibrasi & Pemantapan Mutu Harian',
    desc: 'Seluruh pemeriksaan hematologi dan kimia klinik melewati uji kontrol harian Levey-Jennings sebelum pelayanan pasien dimulai.',
    meta: 'Hematologi · Kimia Klinik',
  },
  {
    kicker: 'Pembaruan Sistem',
    title: 'Grafik Interaktif & Monitoring Reagensia',
    desc: 'Klik grafik tahunan untuk meninjau rasio kunjungan pasien, stok buffer kritis, serta indikator mutu waktu tunggu pelayanan.',
    meta: 'Portal Analitik 2026',
  },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  portalName: 'PERMATA LAB',
  unitSubtitle: 'PKM Sanga-sanga 2026',
  heroKicker: 'UPTD Puskesmas Sanga-sanga · Laboratorium Klinis',
  heroTitle: 'Portal Analitik & Manajemen Laboratorium 2026',
  heroDesc:
    'Pantau volume pemeriksaan tahunan, ketersediaan stok reagensia, capaian mutu waktu tunggu, sebaran wilayah kelurahan, serta kendali mutu QC Levey-Jennings secara interaktif.',
  autoSync: true,
  mutuTarget: 80,
  announcements: DEFAULT_ANNOUNCEMENTS,
  security: {
    passwordHash: DEFAULT_PORTAL_PASSWORD_HASH,
    recoveryHash: RECOVERY_HASH,
    securityQuestion: DEFAULT_SECURITY_QUESTION,
    securityAnswerHash: SEC_ANSWER_HASH,
  },
};

export interface CustomAnnualYearEntry {
  visits: number;
  exams: Record<string, number>;
}

export interface CustomKelurahanYearEntry {
  monthsCount: number;
  values: Record<string, number[]>;
}

export interface CustomLabOverrides {
  annualByYear: Record<number, CustomAnnualYearEntry>;
  extraExamNames: string[];
  mutuByYear: Record<number, (number | null)[]>;
  kelurahanByYear: Record<number, CustomKelurahanYearEntry>;
  extraKelurahans: string[];
  extraStokMonths: ReagentMonth[];
  extraQcBlocks: QcBlock[];
}

export const EMPTY_CUSTOM_OVERRIDES: CustomLabOverrides = {
  annualByYear: {},
  extraExamNames: [],
  mutuByYear: {},
  kelurahanByYear: {},
  extraKelurahans: [],
  extraStokMonths: [],
  extraQcBlocks: [],
};

export function mergeAnnualReport(
  base: AnnualReportData,
  overrides: CustomLabOverrides
): AnnualReportData {
  const overrideYears = Object.keys(overrides.annualByYear).map(Number);
  const yearSet = new Set<number>([...base.years, ...overrideYears]);
  const years = Array.from(yearSet).sort((a, b) => a - b);

  const baseYearIdxMap = new Map<number, number>();
  base.years.forEach((y, i) => baseYearIdxMap.set(y, i));

  const examNames: string[] = base.exams.map(([n]) => n);
  overrides.extraExamNames.forEach((n) => {
    if (n && !examNames.includes(n)) examNames.push(n);
  });
  Object.values(overrides.annualByYear).forEach((entry) => {
    Object.keys(entry.exams).forEach((n) => {
      if (n && !examNames.includes(n)) examNames.push(n);
    });
  });

  const baseExamMap = new Map<string, number[]>();
  base.exams.forEach(([n, arr]) => baseExamMap.set(n, arr));

  const visits = years.map((y) => {
    if (overrides.annualByYear[y]) return overrides.annualByYear[y].visits;
    const bi = baseYearIdxMap.get(y);
    return bi !== undefined ? base.visits[bi] ?? 0 : 0;
  });

  const exams: [string, number[]][] = examNames.map((name) => {
    const baseArr = baseExamMap.get(name);
    const vals = years.map((y) => {
      const ov = overrides.annualByYear[y]?.exams?.[name];
      if (ov !== undefined) return ov;
      const bi = baseYearIdxMap.get(y);
      return bi !== undefined && baseArr ? baseArr[bi] ?? 0 : 0;
    });
    return [name, vals];
  });

  return {
    years,
    exams,
    visits,
    live: base.live,
  };
}

export function mergeMutuData(
  base: MutuYearMap,
  overrides: CustomLabOverrides
): MutuYearMap {
  const out: MutuYearMap = {};
  Object.keys(base).forEach((k) => {
    const y = Number(k);
    out[y] = [...base[y]];
  });
  Object.keys(overrides.mutuByYear).forEach((k) => {
    const y = Number(k);
    out[y] = [...overrides.mutuByYear[y]];
  });
  return out;
}

export function mergeKelurahanData(
  base: KelurahanData,
  overrides: CustomLabOverrides
): KelurahanData {
  const yearSet = new Set<number>([
    ...base.years,
    ...Object.keys(overrides.kelurahanByYear).map(Number),
  ]);
  const years = Array.from(yearSet).sort((a, b) => a - b);

  const kel = [...base.kel];
  overrides.extraKelurahans.forEach((k) => {
    if (k && !kel.includes(k)) {
      const lainIdx = kel.findIndex((x) => /lainnya/i.test(x));
      if (lainIdx >= 0) kel.splice(lainIdx, 0, k);
      else kel.push(k);
    }
  });

  const months: Record<number, number> = { ...base.months };
  const val: Record<number, Record<string, number[]>> = {};

  years.forEach((y) => {
    const baseYearVals = base.val[y] || {};
    const ov = overrides.kelurahanByYear[y];
    if (ov) months[y] = ov.monthsCount;

    val[y] = {};
    kel.forEach((kName) => {
      if (ov?.values?.[kName]) {
        val[y][kName] = [...ov.values[kName]];
      } else if (baseYearVals[kName]) {
        val[y][kName] = [...baseYearVals[kName]];
      } else {
        val[y][kName] = [0, 0, 0, 0, 0, 0, 0];
      }
    });
  });

  return {
    years,
    kel,
    months,
    val,
    live: base.live,
  };
}

export function mergeStokMonths(
  base: ReagentMonth[],
  overrides: CustomLabOverrides
): ReagentMonth[] {
  const map = new Map<string, ReagentMonth>();
  base.forEach((m) => map.set(`${m.name}-${m.yr ?? ''}`, m));
  overrides.extraStokMonths.forEach((m) => map.set(`${m.name}-${m.yr ?? ''}`, m));
  return Array.from(map.values());
}

export function mergeQcBlocks(
  base: QcBlock[],
  overrides: CustomLabOverrides
): QcBlock[] {
  return [...base, ...overrides.extraQcBlocks];
}

// ==================== 9. SUMBER SPREADSHEET DINAMIS ====================
export const DEFAULT_SPREADSHEET_SOURCES: SpreadsheetSource[] = [
  {
    id: 'primary-annual',
    label: 'Laporan Tahunan Lab (Utama)',
    kind: 'annual',
    sheetId: ANNUAL_SHEET_ID,
    gid: ANNUAL_GID,
    enabled: true,
    isPrimary: true,
  },
  {
    id: 'primary-stok',
    label: 'Stok Opname Reagensia (Utama)',
    kind: 'stok',
    sheetId: STOK_SID,
    gid: STOK_GID,
    enabled: true,
    isPrimary: true,
  },
  {
    id: 'primary-mutu',
    label: 'Indikator Mutu Waktu Tunggu (Utama)',
    kind: 'mutu',
    sheetId: MUTU_SID,
    gid: '0',
    enabled: true,
    isPrimary: true,
  },
  {
    id: 'primary-kelurahan',
    label: 'Rekap Pemeriksaan per Kelurahan (Utama)',
    kind: 'kelurahan',
    sheetId: STOK_SID,
    sheetName: 'REKAP KELURAHAN',
    enabled: true,
    isPrimary: true,
  },
  {
    id: 'primary-monthly',
    label: 'Rekap Bulanan 2026 (REKAP TAHUNAN)',
    kind: 'monthly',
    sheetId: STOK_SID,
    sheetName: 'REKAP TAHUNAN',
    gid: '780669091',
    enabled: true,
    isPrimary: true,
  },
  {
    id: 'primary-qc-hem',
    label: 'Standar Deviasi QC Hematologi (Utama)',
    kind: 'qc_hematologi',
    sheetId: QC_SID,
    gid: '18484466',
    enabled: true,
    isPrimary: true,
  },
  {
    id: 'primary-qc-kim',
    label: 'Standar Deviasi QC Kimia Klinik (Utama)',
    kind: 'qc_kimia',
    sheetId: QC_SID,
    gid: '1252703038',
    enabled: true,
    isPrimary: true,
  },
];

export function extractGoogleSheetInfo(input: string): { sheetId: string; gid?: string } {
  const s = (input || '').trim();
  const idMatch = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(s);
  const gidMatch = /[?&#]gid=(\d+)/.exec(s);
  if (idMatch) {
    return {
      sheetId: idMatch[1],
      gid: gidMatch ? gidMatch[1] : undefined,
    };
  }
  return {
    sheetId: s.replace(/\s+/g, ''),
    gid: gidMatch ? gidMatch[1] : undefined,
  };
}

export function buildSpreadsheetEditUrl(src: SpreadsheetSource): string {
  const base = `https://docs.google.com/spreadsheets/d/${src.sheetId}/edit`;
  return src.gid ? `${base}?gid=${src.gid}#gid=${src.gid}` : base;
}

export function buildSpreadsheetCsvUrl(src: SpreadsheetSource): string {
  const base = `https://docs.google.com/spreadsheets/d/${src.sheetId}/gviz/tq?tqx=out:csv`;
  if (src.sheetName?.trim()) {
    return `${base}&sheet=${encodeURIComponent(src.sheetName.trim())}&_=${Date.now()}`;
  }
  if (src.gid?.trim()) {
    return `${base}&gid=${encodeURIComponent(src.gid.trim())}&_=${Date.now()}`;
  }
  return `${base}&gid=0&_=${Date.now()}`;
}

async function fetchCsvRows(url: string): Promise<string[][]> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (/^\s*</.test(text)) throw new Error('Sheet belum publik / perlu akses publik');
  return parseCSV(text);
}

function parseAnnualFromRows(rows: string[][]): AnnualReportData {
  const h = rows.findIndex((r) => /JENIS PEMERIKSAAN/i.test(r[1] || r[0] || ''));
  if (h < 0) throw new Error('Header JENIS PEMERIKSAAN tidak ditemukan');
  const labelCol = /JENIS PEMERIKSAAN/i.test(rows[h][0] || '') ? 0 : 1;
  const yrs: number[] = [];
  const cols: number[] = [];
  rows[h].forEach((x, k) => {
    const m = /(\d{4})/.exec(x || '');
    if (k > labelCol && m) {
      yrs.push(+m[1]);
      cols.push(k);
    }
  });
  if (!yrs.length) throw new Error('Kolom tahun (4 digit) tidak ditemukan');
  const exams: [string, number[]][] = [];
  for (let i = h + 1; i < rows.length && (rows[i][labelCol] || '').trim(); i++) {
    if (/wilayah|kunjungan/i.test(rows[i][labelCol])) continue;
    exams.push([
      rows[i][labelCol].trim(),
      cols.map((k) => parseIntOnly(rows[i][k])),
    ]);
  }
  const tv = rows.find((r) => /^total kunjungan/i.test((r[labelCol] || '').trim()));
  return {
    years: yrs,
    exams,
    visits: tv ? cols.map((k) => parseIntOnly(tv[k])) : cols.map(() => 0),
    live: true,
  };
}

function parseMutuFromRows(rows: string[][]): MutuYearMap {
  const out: MutuYearMap = {};
  let hi = -1;
  let yc = -1;
  let mc: Record<number, number> = {};
  for (let i = 0; i < rows.length && hi < 0; i++) {
    let t = -1;
    let cnt = 0;
    const map: Record<number, number> = {};
    for (let j = 0; j < rows[i].length; j++) {
      const h = String(rows[i][j] || '').toUpperCase().trim();
      if (h === 'TAHUN') t = j;
      const m = monthIdx(h);
      if (m > -1 && h.length <= 10) {
        map[j] = m;
        cnt++;
      }
    }
    if (t > -1 && cnt >= 6) {
      hi = i;
      yc = t;
      mc = map;
    }
  }
  if (hi > -1) {
    for (let i = hi + 1; i < rows.length; i++) {
      const y = String(rows[i][yc] || '').trim();
      if (!/^(19|20)\d\d$/.test(y)) continue;
      const v: (number | null)[] = Array(12).fill(null);
      let any = false;
      for (const c in mc) {
        const n = numId(rows[i][+c]);
        if (n != null) {
          v[mc[+c]] = n;
          any = true;
        }
      }
      if (any) out[+y] = v;
    }
  }
  if (!Object.keys(out).length) {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      for (let j = 0; j < r.length - 1; j++) {
        const ys = String(r[j] || '').replace(/^(2)[.,](\d{3})$/, '$1$2').trim();
        if (!/^(19|20)\d\d$/.test(ys)) continue;
        const m = monthIdx(r[j + 1]);
        if (m < 0) continue;
        let n: number | null = null;
        for (let k = j + 2; k < r.length && n == null; k++) n = numId(r[k]);
        if (n == null) break;
        if (n > 0 && n <= 1) n = Math.round(n * 1000) / 10;
        if (!out[+ys]) out[+ys] = Array(12).fill(null);
        out[+ys][m] = n;
        break;
      }
    }
  }
  if (!Object.keys(out).length) throw new Error('Data mutu tidak terbaca');
  return out;
}

function parseKelurahanFromRows(rows: string[][]): KelurahanData {
  const LAYOUT: Record<number, number[]> = {
    2021: [0, 2, 1, 3, 4, 5, 5],
    2022: [0, 2, 1, 3, 4, 5, 5],
    2023: [0, 2, 1, 3, 4, 5, 5],
    2024: [0, 2, 1, 3, 4, 5, 5],
    2025: [0, 2, 1, 3, 4, 5, 5],
    2026: [0, 2, 1, 3, 4, 5, 5],
  };
  const catOf = (h: string) => {
    const l = h.toLowerCase();
    if (/kimia/.test(l)) return 0;
    if (/hemato/.test(l)) return 1;
    if (/imuno/.test(l)) return 2;
    if (/urina/.test(l)) return 3;
    if (/napza|toksiko/.test(l)) return 4;
    if (/mikrob|parasit/.test(l)) return 5;
    return l.trim() && !/^(no|nomor|total|jumlah)$/.test(l.trim()) ? 6 : -1;
  };
  const isLain = (k: string) => /lainnya/i.test(k);
  const title = (n: string) =>
    isLain(n)
      ? 'Lainnya (luar wilayah / tidak diisi)'
      : n.toLowerCase().replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase());

  const out: KelurahanData = { years: [], kel: [], months: { 2026: 10 }, val: {}, live: true };
  let lain = false;
  const known = Object.keys(LAYOUT).map(Number).sort((a, b) => a - b);

  for (let i = 0; i < rows.length; i++) {
    const m = /^(?:tahun|riwayat)\s+(\d{4})/i.exec(String(rows[i][0] || '').trim());
    if (!m) continue;
    const y = +m[1];
    let label = '';
    for (let c = 1; c < rows[i].length; c++) label += ' ' + String(rows[i][c] || '');
    const mm = /JANUARI\s*-\s*([A-Z]+)/.exec(label.toUpperCase());
    if (mm && MONTHS_UPPER.indexOf(mm[1]) > -1) out.months[y] = MONTHS_UPPER.indexOf(mm[1]) + 1;
    let h = -1;
    for (let j = i + 1; j <= i + 3 && j < rows.length; j++) {
      if (/^kelurahan$/i.test(String(rows[j][0] || '').trim())) {
        h = j;
        break;
      }
    }
    if (h < 0) continue;
    let map: number[] = [];
    let ok = 0;
    for (let c = 1; c < rows[h].length; c++) {
      const txt = String(rows[h][c] || '').trim();
      if (/^total$/i.test(txt)) break;
      const ci = catOf(txt);
      map.push(ci);
      if (ci > -1) ok++;
    }
    if (ok < 5) {
      let yy = y;
      if (!LAYOUT[yy]) {
        yy = known[known.length - 1];
        for (const k of known) if (k <= y) yy = k;
      }
      map = LAYOUT[yy].slice();
    }
    const vals: Record<string, number[]> = {};
    for (let j = h + 1; j < rows.length; j++) {
      const nm = String(rows[j][0] || '').trim();
      if (!nm || /^total/i.test(nm)) break;
      const v = [0, 0, 0, 0, 0, 0, 0];
      for (let k = 0; k < map.length; k++) {
        if (map[k] > -1) v[map[k]] += parseIntOnly(rows[j][k + 1]);
      }
      const name = title(nm);
      vals[name] = v;
      if (isLain(name)) lain = true;
      else if (!out.kel.includes(name)) out.kel.push(name);
    }
    if (Object.keys(vals).length) {
      if (out.val[y]) {
        Object.keys(vals).forEach((n) => {
          const a = out.val[y][n] || (out.val[y][n] = [0, 0, 0, 0, 0, 0, 0]);
          for (let q = 0; q < 7; q++) a[q] += vals[n][q];
        });
      } else out.val[y] = vals;
      if (!out.years.includes(y)) out.years.push(y);
    }
  }
  if (lain) out.kel.push(title('LAINNYA'));
  out.years.sort((a, b) => a - b);
  if (!out.years.length || !out.kel.length) throw new Error('Data kelurahan tidak terbaca');
  return out;
}

function parseMonthlyFromRows(rows: string[][]): Monthly2026Data {
  const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  const hd = rows.findIndex(
    (rw) =>
      String(rw[0] || '').trim().toLowerCase() === 'kategori' &&
      String(rw[2] || '').trim().toUpperCase() === 'JAN'
  );
  if (hd < 0) throw new Error('Header REKAP TAHUNAN tidak ditemukan');
  const col: Record<number, number> = {};
  rows[hd].forEach((x, j) => {
    const m = MON.indexOf(String(x || '').trim().toUpperCase());
    if (m >= 0 && col[m] == null) col[m] = j;
  });
  if (Object.keys(col).length < 12) throw new Error('Kolom JAN–DES tidak lengkap');
  const items = [];
  const tot = Array(12).fill(0);
  for (let i = hd + 1; i < rows.length; i++) {
    const kat = String(rows[i][0] || '').trim();
    const jn = String(rows[i][1] || '').trim();
    if (!jn) break;
    const v: number[] = [];
    for (let k = 0; k < 12; k++) {
      v[k] = parseIntOnly(rows[i][col[k]]);
      tot[k] += v[k];
    }
    items.push({ kat: kat || 'Lainnya', n: jn, v });
  }
  if (!items.length) throw new Error('Baris pemeriksaan kosong');
  return { items, tot, live: true };
}

function combineAnnualReports(list: AnnualReportData[]): AnnualReportData {
  if (!list.length) return FALLBACK_ANNUAL;
  const yearSet = new Set<number>();
  const examMap = new Map<string, Map<number, number>>();
  const visitMap = new Map<number, number>();
  let anyLive = false;

  list.forEach((rep) => {
    if (rep.live) anyLive = true;
    rep.years.forEach((y, yi) => {
      yearSet.add(y);
      visitMap.set(y, rep.visits[yi] ?? 0);
    });
    rep.exams.forEach(([name, vals]) => {
      if (!examMap.has(name)) examMap.set(name, new Map());
      const ym = examMap.get(name)!;
      rep.years.forEach((y, yi) => ym.set(y, vals[yi] ?? 0));
    });
  });

  const years = Array.from(yearSet).sort((a, b) => a - b);
  const visits = years.map((y) => visitMap.get(y) ?? 0);
  const exams: [string, number[]][] = Array.from(examMap.entries()).map(([name, ym]) => [
    name,
    years.map((y) => ym.get(y) ?? 0),
  ]);

  return { years, exams, visits, live: anyLive };
}

function combineKelurahanReports(list: KelurahanData[]): KelurahanData {
  if (!list.length) return FALLBACK_KELURAHAN;
  const yearSet = new Set<number>();
  const kelSet: string[] = [];
  const months: Record<number, number> = {};
  const val: Record<number, Record<string, number[]>> = {};
  let anyLive = false;

  list.forEach((kd) => {
    if (kd.live) anyLive = true;
    kd.years.forEach((y) => yearSet.add(y));
    kd.kel.forEach((k) => {
      if (!kelSet.includes(k)) kelSet.push(k);
    });
    Object.assign(months, kd.months);
    Object.entries(kd.val).forEach(([yrStr, kelObj]) => {
      const yr = Number(yrStr);
      if (!val[yr]) val[yr] = {};
      Object.entries(kelObj).forEach(([k, arr]) => {
        val[yr][k] = [...arr];
      });
    });
  });

  return {
    years: Array.from(yearSet).sort((a, b) => a - b),
    kel: kelSet,
    months,
    val,
    live: anyLive,
  };
}

export interface MultiSourceSyncResult {
  annual: AnnualReportData;
  stok: { months: ReagentMonth[]; live: boolean };
  mutu: { data: MutuYearMap; live: boolean };
  kelurahan: KelurahanData;
  daily2026: DailyMonth[];
  monthly2026: Monthly2026Data;
  qc: { blocks: QcBlock[]; live: boolean };
  updatedSources: SpreadsheetSource[];
  liveSourceCount: number;
}

export async function syncAllSpreadsheetSources(
  sources: SpreadsheetSource[]
): Promise<MultiSourceSyncResult> {
  const annualParts: AnnualReportData[] = [];
  const stokParts: ReagentMonth[] = [];
  const mutuCombined: MutuYearMap = {};
  const kelParts: KelurahanData[] = [];
  const qcParts: QcBlock[] = [];
  let monthlyResult: Monthly2026Data | null = null;
  let dailyMonths: DailyMonth[] = FALLBACK_DAILY_2026;

  let annualLive = false;
  let stokLive = false;
  let mutuLive = false;
  let kelLive = false;
  let qcLive = false;
  let liveSourceCount = 0;

  const updatedSources: SpreadsheetSource[] = await Promise.all(
    sources.map(async (src) => {
      if (!src.enabled || !src.sheetId.trim()) return src;
      try {
        if (src.kind === 'annual') {
          const rows = await fetchCsvRows(buildSpreadsheetCsvUrl(src));
          const parsed = parseAnnualFromRows(rows);
          annualParts.push(parsed);
          annualLive = true;
          liveSourceCount++;
          return {
            ...src,
            lastStatus: 'ok' as const,
            lastMessage: `${parsed.years.length} tahun · ${parsed.exams.length} tes`,
            lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        if (src.kind === 'mutu') {
          const rows = await fetchCsvRows(buildSpreadsheetCsvUrl(src));
          const parsed = parseMutuFromRows(rows);
          Object.assign(mutuCombined, parsed);
          mutuLive = true;
          liveSourceCount++;
          return {
            ...src,
            lastStatus: 'ok' as const,
            lastMessage: `Tahun ${Object.keys(parsed).join(', ')}`,
            lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        if (src.kind === 'kelurahan') {
          const rows = await fetchCsvRows(buildSpreadsheetCsvUrl(src));
          const parsed = parseKelurahanFromRows(rows);
          kelParts.push(parsed);
          kelLive = true;
          liveSourceCount++;
          return {
            ...src,
            lastStatus: 'ok' as const,
            lastMessage: `${parsed.years.length} tahun · ${parsed.kel.length} kelurahan`,
            lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        if (src.kind === 'stok') {
          const rows = await fetchCsvRows(buildSpreadsheetCsvUrl(src));
          const parsed = parseStokOpname(rows);
          if (!parsed.length) throw new Error('Data stok kosong');
          stokParts.push(...parsed);
          stokLive = true;
          liveSourceCount++;
          return {
            ...src,
            lastStatus: 'ok' as const,
            lastMessage: `${parsed.map((p) => p.name).join(', ')}`,
            lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        if (src.kind === 'monthly') {
          const rows = await fetchCsvRows(buildSpreadsheetCsvUrl(src));
          monthlyResult = parseMonthlyFromRows(rows);
          liveSourceCount++;
          return {
            ...src,
            lastStatus: 'ok' as const,
            lastMessage: `${monthlyResult.items.length} jenis pemeriksaan`,
            lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        if (src.kind === 'qc_hematologi' || src.kind === 'qc_kimia') {
          // Reuse existing multi-parser via temporary fetch
          const rows = await fetchCsvRows(buildSpreadsheetCsvUrl(src));
          const dummy = await fetchQcDataFromSingleRows(rows, src.kind === 'qc_hematologi' ? 'hematologi' : 'kimia', src.label);
          if (!dummy.length) throw new Error('Data QC tidak terbaca');
          qcParts.push(...dummy);
          qcLive = true;
          liveSourceCount++;
          return {
            ...src,
            lastStatus: 'ok' as const,
            lastMessage: `${dummy.length} blok QC`,
            lastSyncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return src;
      } catch (err) {
        return {
          ...src,
          lastStatus: 'error' as const,
          lastMessage: err instanceof Error ? err.message : 'Gagal sinkronisasi',
        };
      }
    })
  );

  // Also fetch daily 2026 tabs from primary stok/rekap sheet
  try {
    const dailyRes = await fetchDaily2026();
    dailyMonths = dailyRes.months;
  } catch {
    // keep fallback
  }

  // Merge stok months deduplicating by name+yr
  const stokMap = new Map<string, ReagentMonth>();
  if (stokParts.length) {
    stokParts.forEach((m) => stokMap.set(`${m.name}-${m.yr ?? ''}`, m));
  } else {
    FALLBACK_STOK.forEach((m) => stokMap.set(`${m.name}-${m.yr ?? ''}`, m));
  }

  return {
    annual: annualParts.length ? combineAnnualReports([FALLBACK_ANNUAL, ...annualParts]) : FALLBACK_ANNUAL,
    stok: { months: Array.from(stokMap.values()), live: stokLive },
    mutu: {
      data: mutuLive ? { ...FALLBACK_MUTU, ...mutuCombined } : FALLBACK_MUTU,
      live: mutuLive,
    },
    kelurahan: kelParts.length
      ? combineKelurahanReports([FALLBACK_KELURAHAN, ...kelParts])
      : FALLBACK_KELURAHAN,
    daily2026: dailyMonths,
    monthly2026: monthlyResult || FALLBACK_MONTHLY_2026,
    qc: { blocks: qcParts.length ? qcParts : FALLBACK_QC, live: qcLive || qcParts.length > 0 },
    updatedSources,
    liveSourceCount,
  };
}

async function fetchQcDataFromSingleRows(
  rows: string[][],
  group: 'hematologi' | 'kimia',
  sourceName: string
): Promise<QcBlock[]> {
  const normQC = (v: unknown) => String(v ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const numQC = (x: unknown): number | null => {
    if (x == null) return null;
    let s = String(x).trim().replace(/\s/g, '');
    if (!s || !/[0-9]/.test(s)) return null;
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(',', '.');
    const v = parseFloat(s);
    return isFinite(v) ? v : null;
  };
  const out: QcBlock[] = [];
  if (group === 'hematologi') {
    const H_ALIAS: Record<string, string[]> = {
      LEUKOSIT: ['LEUKOSIT', 'LEUKOSITT', 'LEUKOCYTE', 'LEUKOCYTES', 'WBC', 'LEU'],
      ERITROSIT: ['ERITROSIT', 'ERITROSITT', 'ERYTHROCYTE', 'ERYTHROCYTES', 'RBC', 'ERI'],
      HEMOGLOBIN: ['HEMOGLOBIN', 'HEMOGLOBINE', 'HB', 'HGB'],
      HEMATOKRIT: ['HEMATOKRIT', 'HEMATOCRIT', 'HCT'],
      TROMBOSIT: ['TROMBOSIT', 'TROMBOSITT', 'PLT', 'PLATELET', 'PLATELETS', 'TROMBOCYTE'],
    };
    const hParam = (v: string) => {
      const k = normQC(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
      for (const p in H_ALIAS) if (H_ALIAS[p].includes(k)) return p;
      return null;
    };
    const hYr = (t: string) => {
      const m = String(t || '').match(/\b(20\d\d)\b/);
      return m ? Number(m[1]) : null;
    };
    const hTW2 = (s: string) => {
      const t = String(s || '').replace(/\u00a0/g, ' ').toUpperCase();
      const m = t.match(/\b(?:TW|T\.W\.?|TRIWULAN|TRI\s?WULAN)\s*[-:.]?\s*(IV|III|II|I|[1-4])\b/);
      if (!m) return null;
      const rom: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
      return rom[m[1]] || Number(m[1]);
    };
    const state: Record<number, { y: number | null; t: number | null; last?: number; mk?: boolean }> = {};
    const groups: Record<string, { param: string; label: string; pts: { d: string; v: number }[] }> = {};
    const order: string[] = [];
    const layouts: { row: number; blocks: { no: number; end: number; cols: Record<string, number> }[] }[] = [];
    let maxCols = 0;
    rows.forEach((r) => { if (r.length > maxCols) maxCols = r.length; });
    rows.forEach((r, ri) => {
      const cells = r.map((x) => normQC(x));
      const occ: { p: string; c: number }[] = [];
      cells.forEach((v, c) => {
        const p = hParam(v);
        if (p) occ.push({ p, c });
      });
      if (new Set(occ.map((o) => o.p)).size < 2) return;
      const blocks: { no: number; end: number; cols: Record<string, number> }[] = [];
      let cur: { no: number; end: number; cols: Record<string, number> } | null = null;
      occ.forEach((o) => {
        if (!cur || cur.cols[o.p] !== undefined) {
          cur = { no: Math.max(0, o.c - 1), end: maxCols, cols: {} };
          blocks.push(cur);
        }
        cur.cols[o.p] = o.c;
      });
      blocks.forEach((b, k) => {
        b.end = k + 1 < blocks.length ? blocks[k + 1].no : maxCols;
        if (!state[b.no]) state[b.no] = { y: null, t: null };
      });
      layouts.push({ row: ri, blocks });
    });
    if (!layouts.length) return out;
    rows.forEach((r, ri) => {
      let lay = layouts[0];
      for (const l of layouts) if (l.row <= ri) lay = l;
      const cells = r.map((x) => normQC(x));
      lay.blocks.forEach((b) => {
        const st = state[b.no];
        for (let c = b.no; c < Math.min(b.end, cells.length); c++) {
          const txt = cells[c] || '';
          const y = hYr(txt);
          if (y) { st.y = y; st.last = undefined; }
          const t = hTW2(txt);
          if (t) { st.t = t; st.mk = true; }
        }
        if (ri <= lay.row) return;
        const dayTxt = cells[b.no] || '';
        if (!/^\d{1,2}(\.0+)?$/.test(dayTxt)) return;
        const day = Number(dayTxt.replace(/\.0+$/, ''));
        if (day < 1 || day > 31) return;
        if (st.last !== undefined && day <= st.last && !st.mk) st.t = (st.t || 1) + 1;
        st.mk = false;
        st.last = day;
        Object.keys(b.cols).forEach((p) => {
          const val = numQC(r[b.cols[p]]);
          if (val == null) return;
          const y = st.y || 0;
          const t = st.t || 1;
          const key = `${b.no}|${y}|${t}|${p}`;
          if (!groups[key]) {
            groups[key] = { param: p, label: `${y || 'Tahun'} · TW ${t}`, pts: [] };
            order.push(key);
          }
          groups[key].pts.push({ d: `Hari ${day}`, v: val });
        });
      });
    });
    order.forEach((k) => {
      const g = groups[k];
      if (!g.pts.length) return;
      const vals = g.pts.map((p) => p.v);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const sd = vals.length > 1 ? Math.sqrt(vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (vals.length - 1)) : 0;
      out.push({ group: 'hematologi', source: sourceName, param: g.param, label: g.label, lot: '', mean, sd, pts: g.pts });
    });
  } else {
    const dtQC = (x: unknown): Date | null => {
      const s = String(x || '').trim();
      let m = s.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/);
      if (m) return new Date(+m[1], +m[2], +m[3]);
      m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
      m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    };
    let heads: { p: string; d: number; v: number }[] = [];
    rows.forEach((r, ri) => {
      const cells = r.map((x) => normQC(x).toUpperCase());
      cells.forEach((v, d) => {
        if (!/^TANGGAL$/.test(v)) return;
        let vc = -1;
        for (let c = d + 1; c < Math.min(r.length, d + 4); c++) {
          if (/^NILAI$/.test(cells[c])) { vc = c; break; }
        }
        if (vc < 0 && d + 1 < r.length) vc = d + 1;
        if (vc < 0) return;
        let label = '';
        for (let y = ri - 1; y >= Math.max(0, ri - 3); y--) {
          const cand = normQC(rows[y][d]).toUpperCase();
          if (/KOLESTEROL/.test(cand)) { label = 'Kolesterol'; break; }
          if (/ASAM\s*URAT/.test(cand)) { label = 'Asam Urat'; break; }
          if (/QC\s*GULA|GULA/.test(cand)) { label = 'Gula Darah'; break; }
        }
        if (!label) label = d === 0 ? 'Gula Darah' : d === 4 ? 'Kolesterol' : d === 7 ? 'Asam Urat' : '';
        if (label) heads.push({ p: label, d, v: vc });
      });
    });
    if (!heads.length)
      heads = [
        { p: 'Gula Darah', d: 0, v: 1 },
        { p: 'Kolesterol', d: 4, v: 5 },
        { p: 'Asam Urat', d: 7, v: 8 },
      ];
    heads.forEach((f) => {
      const map: Record<string, { d: Date; v: number }[]> = {};
      const order: string[] = [];
      let lot: string | null = null;
      let needNew = false;
      rows.forEach((r) => {
        const dateRaw = normQC(r[f.d]);
        const raw = normQC(r[f.v]);
        const mark = dateRaw.toLowerCase().replace(/[.:]/g, '').replace(/\s+/g, ' ');
        const lotCell = raw.replace(/^(\d+)\.0+$/, '$1');
        if (/^no\s*lot$/.test(mark) || mark === 'nolot') {
          if (lotCell) { lot = lotCell; needNew = false; }
          else { lot = null; needNew = true; }
          return;
        }
        if (!dateRaw) {
          if (!raw) { needNew = true; return; }
          if (/\d/.test(lotCell) && /^[A-Za-z0-9][A-Za-z0-9.\-/]*$/.test(lotCell)) { lot = lotCell; needNew = false; }
          return;
        }
        if (!/^\s*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|Date\()/.test(dateRaw)) return;
        const val = numQC(raw);
        if (val == null) return;
        const d = dtQC(dateRaw);
        if (!d) return;
        if (lot == null || needNew) { lot = `Lot (${d.toLocaleDateString('id-ID')})`; needNew = false; }
        if (!map[lot]) { map[lot] = []; order.push(lot); }
        map[lot].push({ d, v: val });
      });
      order.forEach((l) => {
        const pts = map[l].sort((a, b) => a.d.getTime() - b.d.getTime()).map((x) => ({ d: x.d.toLocaleDateString('id-ID'), v: x.v }));
        if (!pts.length) return;
        const vals = pts.map((p) => p.v);
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const sd = vals.length > 1 ? Math.sqrt(vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (vals.length - 1)) : 0;
        out.push({ group: 'kimia', source: sourceName, param: f.p, label: `Lot ${l}`, lot: l, mean, sd, pts });
      });
    });
  }
  return out;
}


