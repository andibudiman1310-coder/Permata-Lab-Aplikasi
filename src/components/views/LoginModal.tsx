import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, X } from 'lucide-react';
import {
  ADMIN_EMAIL,
  ALT_SEC_ANSWER_HASH,
  DEFAULT_SECURITY_QUESTION,
  RECOVERY_HASH,
  SEC_ANSWER_HASH,
  sha256,
} from '../../data/labData';
import { PortalSecuritySettings } from '../../types/lab';

interface LoginModalProps {
  open: boolean;
  lockedMode: boolean;
  security: PortalSecuritySettings;
  onUnlock: (asStaff?: boolean) => void;
  onClose?: () => void;
}

export function LoginModal({
  open,
  lockedMode,
  security,
  onUnlock,
  onClose,
}: LoginModalProps) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [secAnswer, setSecAnswer] = useState('');
  const [recCode, setRecCode] = useState('');
  const [briefcaseOpen, setBriefcaseOpen] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const h = sha256(password.trim());
    if (h === security.passwordHash) {
      setError('');
      setBriefcaseOpen(true);
      window.setTimeout(() => {
        setBriefcaseOpen(false);
        setPassword('');
        onUnlock(true);
      }, 420);
    } else {
      setError('Kata sandi petugas tidak cocok. Silakan periksa kembali.');
    }
  };

  const handleRecovery = (e: FormEvent) => {
    e.preventDefault();
    const ansClean = secAnswer.trim().toLowerCase();
    const aHash = ansClean ? sha256(ansClean) : '';
    const cClean = recCode.trim();
    const cHash = cClean ? sha256(cClean) : '';
    const cUpperHash = cClean ? sha256(cClean.toUpperCase()) : '';

    const answerMatch =
      Boolean(aHash) &&
      (aHash === security.securityAnswerHash ||
        (security.securityAnswerHash === SEC_ANSWER_HASH && aHash === ALT_SEC_ANSWER_HASH));

    const codeMatch =
      Boolean(cHash) &&
      (cHash === security.recoveryHash ||
        (security.recoveryHash === RECOVERY_HASH && cUpperHash === RECOVERY_HASH));

    if (answerMatch || codeMatch) {
      setError('');
      setSecAnswer('');
      setRecCode('');
      setRecoveryOpen(false);
      onUnlock(true);
    } else {
      setError(`Verifikasi gagal. Hubungi koordinator (${ADMIN_EMAIL}).`);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
            className="relative w-full max-w-md rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 shadow-2xl"
          >
            {!lockedMode && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup dialog"
                className="absolute right-4 top-4 p-1.5 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Animated Courier & Opening Briefcase Illustration */}
            <div className="flex flex-col items-center text-center mb-5">
              <motion.svg
                viewBox="0 0 120 84"
                className="w-28 h-20 mb-2"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <rect x="18" y="34" width="84" height="40" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2.2" />
                <motion.path
                  d="M 45 34 L 45 24 Q 45 19 50 19 L 70 19 Q 75 19 75 24 L 75 34"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  animate={briefcaseOpen ? { y: -4 } : { y: 0 }}
                />
                <motion.rect
                  x="16"
                  y="32"
                  width="88"
                  height="15"
                  rx="6"
                  fill="var(--accent)"
                  animate={briefcaseOpen ? { rotate: -14, y: -6 } : { rotate: 0, y: 0 }}
                  style={{ transformOrigin: '18px 34px' }}
                />
                {/* Medical cross */}
                <rect x="56" y="48" width="8" height="20" rx="2" fill="var(--accent)" />
                <rect x="50" y="54" width="20" height="8" rx="2" fill="var(--accent)" />
              </motion.svg>

              <h2 className="text-lg font-bold text-[var(--ink-primary)]">
                {lockedMode ? 'Portal Terkunci — Verifikasi Petugas' : 'Verifikasi Mode Petugas'}
              </h2>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                UPTD Puskesmas Sanga-sanga · Laboratorium Klinis
              </p>
            </div>

            {!recoveryOpen ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi petugas"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] pl-9 pr-10 py-2.5 text-xs text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label="Tampilkan sandi"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--ink-muted)] cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Masuk sebagai Petugas</span>
                </button>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryOpen(true);
                      setError('');
                    }}
                    className="text-[var(--accent)] font-semibold hover:underline cursor-pointer"
                  >
                    Lupa kata sandi?
                  </button>
                  {!lockedMode && onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                    >
                      Lanjut Pratinjau Publik
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleRecovery} className="space-y-3">
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)]/70 p-3 text-xs space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                    Pertanyaan Keamanan
                  </p>
                  <p className="font-semibold text-[var(--ink-primary)]">
                    {security.securityQuestion || DEFAULT_SECURITY_QUESTION}
                  </p>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={secAnswer}
                    onChange={(e) => setSecAnswer(e.target.value)}
                    placeholder="Jawaban keamanan"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] pl-9 pr-3 py-2 text-xs text-[var(--ink-primary)]"
                  />
                </div>
                <input
                  type="password"
                  value={recCode}
                  onChange={(e) => setRecCode(e.target.value)}
                  placeholder="Atau kode pemulihan darurat"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink-primary)]"
                />
                {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryOpen(false);
                      setError('');
                    }}
                    className="flex-1 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-semibold text-[var(--ink-secondary)] cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold cursor-pointer"
                  >
                    Pulihkan Akses
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
