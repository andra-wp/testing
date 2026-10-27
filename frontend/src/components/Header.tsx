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
    <header className="sticky top-0 z-10 flex-shrink-0 border-b border-line bg-white">
      <div className="max-w-page mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        {/* Brand logo and title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-btn bg-brand flex items-center justify-center text-white">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-ink-dark">EvidenceVault</span>
              <span className="chip font-mono hidden sm:inline-flex">SEC-OPS</span>
            </div>
            <p className="text-xs text-ink-muted">
              Pengamanan Bukti Digital Insiden Siber
            </p>
          </div>
        </div>

        {/* Session controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-ink">
                <User className="w-4 h-4 text-ink-muted" />
                <span className="font-mono">{user.username}</span>
                {user.role === 'admin' ? (
                  <span className="chip border-brand/30 text-brand font-semibold">ADMIN</span>
                ) : (
                  <span className="chip">USER</span>
                )}
              </div>
              <button onClick={onLogout} className="btn-ghost" title="Keluar dari sesi">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary">
              <User className="w-4 h-4" />
              <span>Masuk / Registrasi</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
