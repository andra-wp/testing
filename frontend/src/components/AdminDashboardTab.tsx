import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Download,
  Users,
  Database,
  RefreshCw,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { api } from '../api';
import { EvidenceReport } from '../types';

export const AdminDashboardTab: React.FC = () => {
  const [reports, setReports] = useState<EvidenceReport[]>([]);
  const [stats, setStats] = useState<{
    total_reports: number;
    total_users: number;
    categories: Record<string, number>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsData, statsData] = await Promise.all([
        api.getAdminReports(),
        api.getAdminStats(),
      ]);
      setReports(reportsData.reports);
      setStats(statsData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memuat data database admin.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadEnvelope = async (reportId: number, originalFilename: string) => {
    try {
      const { blob, filename } = await api.downloadAdminEnvelope(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${originalFilename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mengunduh berkas envelope.');
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'screenshot':
        return <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono">📸 Screenshot</span>;
      case 'document':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">📄 Dokumen</span>;
      case 'video':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">🎥 Video</span>;
      case 'identity':
        return <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono">🆔 Identitas</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 text-[10px] font-mono">{cat || 'Bukti'}</span>;
    }
  };

  return (
    <div className="space-y-2.5 animate-fade-in w-full">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-3 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
              Database Investigator
            </h2>
          </div>
          <p className="text-[10px] text-zinc-400">
            Rekaman barang bukti terenkripsi di database SQLite
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800/60 text-xs font-medium text-zinc-200 transition-all duration-200 self-start sm:self-auto shadow-sm active:scale-[0.98]"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {error ? (
        <div className="p-5 rounded-2xl border border-red-900/40 bg-red-950/20 text-center space-y-1.5 backdrop-blur-md">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
          <h3 className="text-xs font-semibold text-red-400 font-mono">Akses Ditolak (403 Forbidden)</h3>
          <p className="text-xs text-zinc-300 max-w-md mx-auto">{error}</p>
          <p className="text-[10px] text-zinc-500">
            Hanya akun dengan peran <code className="text-amber-400 font-mono">admin</code> yang dapat melihat database ini.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-2.5 flex items-center gap-2.5 shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-cyan-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase font-mono tracking-wider block">Total Bukti</span>
                  <span className="text-lg font-bold font-mono text-white leading-tight">{stats.total_reports}</span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-2.5 flex items-center gap-2.5 shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[8.5px] text-zinc-500 uppercase font-mono tracking-wider block">Pengguna</span>
                  <span className="text-lg font-bold font-mono text-white leading-tight">{stats.total_users}</span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-2.5 flex items-center gap-2.5 shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs space-y-0.5">
                  <span className="text-[8.5px] text-zinc-500 uppercase font-mono tracking-wider block">Kategori</span>
                  <div className="flex gap-2 text-[9.5px] text-zinc-300 font-mono">
                    <span>Chat: {stats.categories['screenshot'] || 0}</span>
                    <span>Doc: {stats.categories['document'] || 0}</span>
                    <span>Vid: {stats.categories['video'] || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table List Bukti dengan scroll internal (compact height ~290px) */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl overflow-hidden shadow-xl max-h-[290px] flex flex-col">
            <div className="px-3.5 py-2 border-b border-zinc-800/80 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Rekaman Bukti Terenkripsi
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">
                {reports.length} rekaman
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-6 px-4 text-zinc-500 text-xs">
                Belum ada rekaman bukti tersimpan.
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/90 sticky top-0 z-10 border-b border-zinc-800/80 text-zinc-400 font-mono uppercase text-[9.5px] tracking-wider">
                    <tr>
                      <th className="py-2 px-3">ID</th>
                      <th className="py-2 px-3">Pelapor</th>
                      <th className="py-2 px-3">Kategori</th>
                      <th className="py-2 px-3">Berkas</th>
                      <th className="py-2 px-3">Algoritma</th>
                      <th className="py-2 px-3">Catatan</th>
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-1.5 px-3 font-mono text-zinc-500 text-[11px]">#{rep.id}</td>
                        <td className="py-1.5 px-3 font-medium text-white text-[11px]">{rep.reporter}</td>
                        <td className="py-1.5 px-3">{getCategoryBadge(rep.category)}</td>
                        <td className="py-1.5 px-3 font-mono text-zinc-200 max-w-[130px] truncate text-[11px]" title={rep.filename}>
                          {rep.filename}
                        </td>
                        <td className="py-1.5 px-3 font-mono">
                          <span className="px-1.5 py-0.2 rounded-full bg-zinc-950 border border-zinc-800 text-[9.5px] text-emerald-400">
                            {rep.algorithm}-{rep.mode}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-zinc-400 max-w-[150px] truncate text-[10.5px]" title={rep.notes || 'Tidak ada catatan'}>
                          {rep.notes || '-'}
                        </td>
                        <td className="py-1.5 px-3 font-mono text-[9.5px] text-zinc-500 whitespace-nowrap">
                          {rep.created_at}
                        </td>
                        <td className="py-1.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDownloadEnvelope(rep.id, rep.filename)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[9.5px] font-medium text-zinc-200 transition-all duration-200 shadow-sm active:scale-[0.98]"
                            title="Unduh envelope JSON"
                          >
                            <Download className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Envelope</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
