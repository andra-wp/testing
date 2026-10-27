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

// Display labels for evidence categories
const categoryLabels: Record<string, string> = {
  screenshot: '📸 Screenshot',
  document: '📄 Dokumen',
  video: '🎥 Video',
  identity: '🆔 Identitas',
};

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

  const getCategoryBadge = (cat: string) => (
    <span className="chip">{categoryLabels[cat] || cat || 'Bukti'}</span>
  );

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Top Header Card */}
      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="icon-box">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="card-title">Database Investigator</h2>
            <p className="card-subtitle">Rekaman barang bukti terenkripsi di database SQLite</p>
          </div>
        </div>

        <button onClick={fetchData} disabled={loading} className="btn-secondary self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {error ? (
        <div className="rounded-card border border-brand/20 bg-brand/5 p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-brand mx-auto" />
          <h3 className="text-base text-brand">Akses Ditolak (403 Forbidden)</h3>
          <p className="text-sm text-ink max-w-md mx-auto">{error}</p>
          <p className="text-xs text-ink-muted">
            Hanya akun dengan peran <code className="font-mono text-brand">admin</code> yang dapat melihat database ini.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="card flex items-center gap-4">
                <div className="icon-box">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-ink-muted block">Total Bukti</span>
                  <span className="text-3xl font-semibold text-ink-dark">{stats.total_reports}</span>
                </div>
              </div>

              <div className="card flex items-center gap-4">
                <div className="icon-box">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-ink-muted block">Pengguna</span>
                  <span className="text-3xl font-semibold text-ink-dark">{stats.total_users}</span>
                </div>
              </div>

              <div className="card flex items-center gap-4">
                <div className="icon-box">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-ink-muted block">Kategori</span>
                  <div className="flex flex-wrap gap-x-3 text-sm text-ink font-mono">
                    <span>Chat: {stats.categories['screenshot'] || 0}</span>
                    <span>Doc: {stats.categories['document'] || 0}</span>
                    <span>Vid: {stats.categories['video'] || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table List Bukti dengan scroll internal */}
          <div className="card p-0 overflow-hidden max-h-[480px] flex flex-col">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl">Rekaman Bukti Terenkripsi</h3>
              <span className="text-sm text-ink-muted">{reports.length} rekaman</span>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 px-4 text-ink-muted text-sm">
                Belum ada rekaman bukti tersimpan.
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white sticky top-0 z-10 border-b border-line text-ink-muted text-xs">
                    <tr>
                      <th className="py-3 px-4 font-semibold">ID</th>
                      <th className="py-3 px-4 font-semibold">Pelapor</th>
                      <th className="py-3 px-4 font-semibold">Kategori</th>
                      <th className="py-3 px-4 font-semibold">Berkas</th>
                      <th className="py-3 px-4 font-semibold">Algoritma</th>
                      <th className="py-3 px-4 font-semibold">Catatan</th>
                      <th className="py-3 px-4 font-semibold">Waktu</th>
                      <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-ink-dark/5 transition-colors duration-200 ease-standard">
                        <td className="py-3 px-4 font-mono text-[13px] text-ink-muted">#{rep.id}</td>
                        <td className="py-3 px-4 font-semibold text-ink-dark">{rep.reporter}</td>
                        <td className="py-3 px-4">{getCategoryBadge(rep.category)}</td>
                        <td className="py-3 px-4 font-mono text-[13px] max-w-[160px] truncate" title={rep.filename}>
                          {rep.filename}
                        </td>
                        <td className="py-3 px-4">
                          <span className="chip font-mono text-brand">
                            {rep.algorithm}-{rep.mode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-ink-muted max-w-[180px] truncate" title={rep.notes || 'Tidak ada catatan'}>
                          {rep.notes || '-'}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-ink-muted whitespace-nowrap">
                          {rep.created_at}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDownloadEnvelope(rep.id, rep.filename)}
                            className="btn-ghost"
                            title="Unduh envelope JSON"
                          >
                            <Download className="w-4 h-4" />
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
