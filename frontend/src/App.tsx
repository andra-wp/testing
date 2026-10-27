import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  FileText,
  KeyRound,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle,
  Database,
} from 'lucide-react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { EvidenceEncryptTab } from './components/EvidenceEncryptTab';
import { EvidenceDecryptTab } from './components/EvidenceDecryptTab';
import { QuickTextTab } from './components/QuickTextTab';
import { AdminDashboardTab } from './components/AdminDashboardTab';
import { UserProfile } from './types';
import { api } from './api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt' | 'quick-text' | 'admin'>('encrypt');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Form state for landing auth gate
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Load existing session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('ciphervault_token');
    if (savedToken) {
      setToken(savedToken);
      api
        .getMe(savedToken)
        .then((profile) => setUser(profile))
        .catch(() => {
          localStorage.removeItem('ciphervault_token');
          setToken(null);
          setUser(null);
        });
    }
  }, []);

  const handleAuthSuccess = (newToken: string, profile: UserProfile) => {
    localStorage.setItem('ciphervault_token', newToken);
    setToken(newToken);
    setUser(profile);
  };

  const handleLogout = async () => {
    if (token) {
      await api.logout(token).catch(() => {});
    }
    localStorage.removeItem('ciphervault_token');
    setToken(null);
    setUser(null);
  };

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      if (isLoginMode) {
        const res = await api.login(authUsername, authPassword);
        if (res.token) {
          const profile = await api.getMe(res.token);
          handleAuthSuccess(res.token, profile);
        }
      } else {
        const res = await api.register(authUsername, authPassword);
        setAuthSuccess(res.message || 'Registrasi akun berhasil. Silakan masuk.');
        setIsLoginMode(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Gagal memproses otentikasi.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-[#050508] text-zinc-300 overflow-hidden font-sans">
      <Header
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-h-0 max-w-6xl w-full mx-auto px-4 sm:px-6 py-3 flex flex-col justify-start overflow-y-auto">
        {/* JIKA BELUM LOGIN: TAMPILKAN AUTH GATEWAY */}
        {!user ? (
          <div className="flex-1 min-h-0 flex items-center justify-center py-4">
            <div key={isLoginMode ? 'login-card' : 'register-card'} className="max-w-md w-full mx-auto animate-fade-in">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-6 shadow-2xl shadow-black/60 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                
                <div className="text-center mb-5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/60 mx-auto flex items-center justify-center text-emerald-400 mb-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold tracking-tight text-white uppercase font-mono">
                    Autentikasi Akun
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Masuk untuk mengakses sistem pengamanan bukti digital.
                  </p>
                </div>

                {authError && (
                  <div className="mb-3.5 flex items-start gap-2.5 p-2.5 text-xs rounded-xl border border-red-900/40 bg-red-950/20 text-red-400 backdrop-blur-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="mb-3.5 flex items-start gap-2.5 p-2.5 text-xs rounded-xl border border-emerald-900/40 bg-emerald-950/20 text-emerald-400 backdrop-blur-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {/* Toggle Login vs Register */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950/80 border border-zinc-800/80 rounded-xl mb-4 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(true);
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      isLoginMode ? 'bg-zinc-800 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(false);
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      !isLoginMode ? 'bg-zinc-800 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Daftar</span>
                  </button>
                </div>

                <form onSubmit={handleGateSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="Username akun"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                    />
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Akun <strong className="text-zinc-300">admin</strong> memiliki hak akses ke seluruh database bukti.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                    />
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                      PBKDF2-HMAC-SHA256 • 600.000 iterasi
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 text-xs font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
                  >
                    {authLoading ? 'Memproses...' : isLoginMode ? 'Masuk' : 'Daftar Akun'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* JIKA SUDAH LOGIN: TAMPILKAN SELURUH FITUR DENGAN FIT BENTO COMPACT KE ATAS */
          <div className="w-full flex flex-col animate-fade-in">
            {/* Tab Navigasi Minimalist Pills */}
            <div className="flex p-1 bg-zinc-900/70 border border-zinc-800/80 rounded-xl mb-3 space-x-1 overflow-x-auto backdrop-blur-xl flex-shrink-0 self-start">
              <button
                onClick={() => setActiveTab('encrypt')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === 'encrypt'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enkripsi Bukti</span>
              </button>

              <button
                onClick={() => setActiveTab('decrypt')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === 'decrypt'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Unlock className="w-3.5 h-3.5 text-zinc-300" />
                <span>Dekripsi Bukti</span>
              </button>

              <button
                onClick={() => setActiveTab('quick-text')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === 'quick-text'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>Teks Bebas</span>
              </button>

              {/* Tab Khusus Admin */}
              {user.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeTab === 'admin'
                      ? 'bg-amber-500/10 text-amber-300 shadow-sm border border-amber-500/30 font-semibold'
                      : 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/5'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>Database (Admin)</span>
                </button>
              )}
            </div>

            {/* Konten Tab Aktif Compact */}
            <div key={activeTab} className="w-full animate-fade-in">
              {activeTab === 'encrypt' && <EvidenceEncryptTab />}
              {activeTab === 'decrypt' && <EvidenceDecryptTab />}
              {activeTab === 'quick-text' && <QuickTextTab />}
              {activeTab === 'admin' && <AdminDashboardTab />}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800/80 py-2 bg-black/40 backdrop-blur-xl text-xs text-zinc-500 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-zinc-400">EvidenceVault</span>
            <span>•</span>
            <span>Pengamanan Bukti Digital Insiden Siber</span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">
            AES-256 • DES • RC4 • PBKDF2-HMAC-SHA256
          </span>
        </div>
      </footer>

      {/* Modal Autentikasi Tambahan */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};
