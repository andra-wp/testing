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

  // Class for a navigation tab, highlighted when active
  const tabClass = (active: boolean) => `tab ${active ? 'tab-active' : ''}`;

  return (
    <div className="h-screen max-h-screen flex flex-col bg-white overflow-hidden">
      <Header
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-h-0 max-w-page w-full mx-auto px-4 sm:px-8 py-8 flex flex-col justify-start overflow-y-auto">
        {/* JIKA BELUM LOGIN: TAMPILKAN AUTH GATEWAY */}
        {!user ? (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div key={isLoginMode ? 'login-card' : 'register-card'} className="max-w-md w-full mx-auto animate-fade-in">
              <div className="card">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-brand/10 text-brand mx-auto flex items-center justify-center mb-3">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h2 className="card-title">Autentikasi Akun</h2>
                  <p className="card-subtitle">
                    Masuk untuk mengakses sistem pengamanan bukti digital.
                  </p>
                </div>

                {authError && (
                  <div className="alert alert-error mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="alert alert-success mb-4">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {/* Toggle Login vs Register */}
                <div className="flex border-b border-line mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(true);
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`${tabClass(isLoginMode)} flex-1 justify-center`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(false);
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`${tabClass(!isLoginMode)} flex-1 justify-center`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar</span>
                  </button>
                </div>

                <form onSubmit={handleGateSubmit} className="space-y-4">
                  <div>
                    <label className="label">Username</label>
                    <input
                      type="text"
                      required
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="Username akun"
                      className="input"
                    />
                    <p className="hint">
                      Akun <strong className="font-semibold text-ink">admin</strong> memiliki hak akses ke seluruh database bukti.
                    </p>
                  </div>

                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="input"
                    />
                    <p className="hint font-mono">
                      PBKDF2-HMAC-SHA256 • 600.000 iterasi
                    </p>
                  </div>

                  <button type="submit" disabled={authLoading} className="btn-primary w-full">
                    {authLoading ? 'Memproses...' : isLoginMode ? 'Masuk' : 'Daftar Akun'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* JIKA SUDAH LOGIN: TAMPILKAN SELURUH FITUR */
          <div className="w-full flex flex-col animate-fade-in">
            {/* Tab navigation */}
            <nav className="flex border-b border-line mb-8 overflow-x-auto flex-shrink-0">
              <button onClick={() => setActiveTab('encrypt')} className={tabClass(activeTab === 'encrypt')}>
                <Lock className="w-4 h-4" />
                <span>Enkripsi Bukti</span>
              </button>

              <button onClick={() => setActiveTab('decrypt')} className={tabClass(activeTab === 'decrypt')}>
                <Unlock className="w-4 h-4" />
                <span>Dekripsi Bukti</span>
              </button>

              <button onClick={() => setActiveTab('quick-text')} className={tabClass(activeTab === 'quick-text')}>
                <FileText className="w-4 h-4" />
                <span>Teks Bebas</span>
              </button>

              {/* Tab Khusus Admin */}
              {user.role === 'admin' && (
                <button onClick={() => setActiveTab('admin')} className={tabClass(activeTab === 'admin')}>
                  <Database className="w-4 h-4" />
                  <span>Database (Admin)</span>
                </button>
              )}
            </nav>

            {/* Konten Tab Aktif */}
            <div key={activeTab} className="w-full animate-fade-in">
              {activeTab === 'encrypt' && <EvidenceEncryptTab />}
              {activeTab === 'decrypt' && <EvidenceDecryptTab />}
              {activeTab === 'quick-text' && <QuickTextTab />}
              {activeTab === 'admin' && <AdminDashboardTab />}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-line bg-surface py-3 text-xs text-ink-muted flex-shrink-0">
        <div className="max-w-page mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">EvidenceVault</span>
            <span>•</span>
            <span>Pengamanan Bukti Digital Insiden Siber</span>
          </div>
          <span className="font-mono">
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
