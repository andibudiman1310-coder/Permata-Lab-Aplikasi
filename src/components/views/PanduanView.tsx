import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ChevronDown, Clock, HelpCircle, PhoneCall } from 'lucide-react';
import { PANDUAN_ITEMS } from '../../data/labData';

interface PanduanViewProps {
  section: 'panduan' | 'tentang';
}

export function PanduanView({ section }: PanduanViewProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  if (section === 'tentang') {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink-primary)]">
            Tentang Laboratorium UPTD Puskesmas Sanga-sanga
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Informasi Profil Layanan, Jam Operasional &amp; Dukungan Sistem Portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-2">
            <Building2 className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Identitas Unit</h2>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Unit Pelayanan Teknis Daerah (UPTD) Puskesmas Sanga-sanga, Kabupaten Kutai Kartanegara, Kalimantan Timur. Portal ini menghimpun seluruh rekap analitik, stok reagensia, mutu waktu tunggu, serta kontrol QC harian.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Jam Pelayanan Spesimen</h2>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Senin – Kamis: 08.00 – 12.00 WITA<br />
              Jumat: 08.00 – 11.00 WITA<br />
              Sabtu: 08.00 – 12.00 WITA<br />
              Pelayanan kegawatdaruratan UGD mengikuti jadwal piket berjalan.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 space-y-2">
            <PhoneCall className="w-5 h-5 text-violet-600" />
            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Koordinasi Internal</h2>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Koordinator Laboratorium: <br />
              <span className="font-mono-num text-[var(--ink-primary)] font-semibold">
                labpkmsangasanga@gmail.com
              </span>
              <br />
              Gunakan Mode Petugas untuk mengakses daftar tautan internal, logbook alat, dan manajemen tugas lab.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--ink-primary)]">
          Panduan &amp; FAQ Portal PERMATA LAB
        </h1>
        <p className="text-xs text-[var(--ink-muted)] mt-0.5">
          Petunjuk penggunaan fitur grafik interaktif, mode petugas, dan manajemen data
        </p>
      </div>

      <div className="space-y-2.5">
        {PANDUAN_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={item.t}
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer hover:bg-[var(--surface-muted)]/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-sm font-bold text-[var(--ink-primary)]">{item.t}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--ink-muted)] transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 pt-1 text-xs text-[var(--ink-secondary)] leading-relaxed border-t border-[var(--border-hairline)]">
                      {item.b}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
