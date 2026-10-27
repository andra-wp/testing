import React from 'react';
import { Shield, User, LogOut } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenAuth, onLogout }) => {
  return (
    <header className="border-b border-white/[0.08] bg-black/60 backdrop-blur-xl sticky top-0 z-40 transition-all flex-shrink-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
            <Shield className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold tracking-wider uppercase text-zinc-100">
                EVIDENCEVAULT
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-900/80 text-zinc-400 border border-zinc-800">
                SEC-OPS
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">
              Pengamanan Bukti Digital Insiden Siber
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span>{user.username}</span>
                {user.role === 'admin' ? (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold tracking-wider uppercase">
                    ADMIN
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[9px] font-medium uppercase">
                    USER
                  </span>
                )}
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 text-xs text-zinc-400 transition-all duration-200"
                title="Keluar dari sesi"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-all duration-200 shadow-sm active:scale-[0.98]"
            >
              <User className="w-3.5 h-3.5" />
              <span>Masuk / Registrasi</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
