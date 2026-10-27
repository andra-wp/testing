import React, { useState } from 'react';
import { X, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLoginMode) {
        const res = await api.login(username, password);
        if (res.token) {
          const profile = await api.getMe(res.token);
          onAuthSuccess(res.token, profile);
          onClose();
        }
      } else {
        const res = await api.register(username, password);
        setSuccessMsg(res.message || 'Registrasi akun berhasil. Silakan beralih ke form masuk.');
        setIsLoginMode(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan yang tidak terduga.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Inline text-link style: no underline at rest, red + underline on hover
  const linkClass = 'ml-1 font-semibold text-ink hover:text-brand hover:underline transition-colors duration-200 ease-standard';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-sm rounded-card bg-white p-6 shadow-hover animate-fade-in">
        <div className="card-header">
          <div>
            <h2 className="text-xl font-semibold text-ink-dark">
              {isLoginMode ? 'Otentikasi Pelapor' : 'Pendaftaran Akun'}
            </h2>
            <p className="card-subtitle">
              {isLoginMode
                ? 'Masukkan kredensial akun untuk mengakses sistem'
                : 'PBKDF2-HMAC-SHA256 • 600.000 iterasi'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success mb-4">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: mahasiswa_pelapor"
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label">Password Akun</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="input pl-10"
              />
            </div>
            <p className="hint font-mono">
              Salt 16-byte • PBKDF2 hash
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Memproses...' : isLoginMode ? 'Masuk ke Sistem' : 'Buat Akun Pelapor'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-line text-center text-sm text-ink-muted">
          {isLoginMode ? (
            <span>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(false);
                  setError(null);
                }}
                className={linkClass}
              >
                Daftar sekarang
              </button>
            </span>
          ) : (
            <span>
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(true);
                  setError(null);
                }}
                className={linkClass}
              >
                Masuk di sini
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
