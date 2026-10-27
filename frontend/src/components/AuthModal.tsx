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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800/80 bg-zinc-900/90 backdrop-blur-xl p-6 shadow-2xl shadow-black/80 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">
              {isLoginMode ? 'Otentikasi Pelapor' : 'Pendaftaran Akun'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isLoginMode
                ? 'Masukkan kredensial akun untuk mengakses sistem'
                : 'PBKDF2-HMAC-SHA256 • 600.000 iterasi'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3 text-xs rounded-xl border border-red-900/40 bg-red-950/20 text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 p-3 text-xs rounded-xl border border-emerald-900/40 bg-emerald-950/20 text-emerald-400">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: mahasiswa_pelapor"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password Akun
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">
              Salt 16-byte • PBKDF2 hash
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 text-xs font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            {loading ? 'Memproses...' : isLoginMode ? 'Masuk ke Sistem' : 'Buat Akun Pelapor'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
          {isLoginMode ? (
            <span>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(false);
                  setError(null);
                }}
                className="text-white underline hover:text-emerald-400 font-medium ml-1"
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
                className="text-white underline hover:text-emerald-400 font-medium ml-1"
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

