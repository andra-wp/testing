import React, { useState, useRef } from 'react';
import {
  Unlock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  FileCheck,
  Eye,
  FileText,
  Tag,
} from 'lucide-react';
import { api } from '../api';

export const EvidenceDecryptTab: React.FC = () => {
  const [envelopeFile, setEnvelopeFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [decryptedResult, setDecryptedResult] = useState<{
    blob: Blob;
    filename: string;
    contentType: string;
    notes?: string;
    category?: string;
    previewUrl?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEnvelopeFile(e.target.files[0]);
      setError(null);
      setDecryptedResult(null);
    }
  };

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'screenshot':
        return '📸 Screenshot Chat / Web Phishing';
      case 'document':
        return '📄 Dokumen / Email Header';
      case 'video':
        return '🎥 Rekaman Layar Insiden';
      case 'identity':
        return '🆔 Identitas Terlindungi';
      default:
        return cat || 'Barang Bukti';
    }
  };

  const handleDecryptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDecryptedResult(null);

    if (!envelopeFile) {
      setError('Silakan pilih berkas envelope bukti (.json) terlebih dahulu.');
      return;
    }

    if (!password) {
      setError('Masukkan kata sandi pembuka bukti.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.decryptFile(envelopeFile, password);
      let previewUrl: string | undefined = undefined;

      // Buat URL pratinjau jika tipe berkas adalah gambar
      if (res.contentType.startsWith('image/')) {
        previewUrl = URL.createObjectURL(res.blob);
      }

      setDecryptedResult({
        blob: res.blob,
        filename: res.filename,
        contentType: res.contentType,
        notes: res.notes,
        category: res.category,
        previewUrl,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal mendekripsi berkas bukti.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadDecryptedFile = () => {
    if (!decryptedResult) return;
    const url = URL.createObjectURL(decryptedResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = decryptedResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Card 1: Input Berkas Envelope & Password */}
      <div className="card flex flex-col">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="icon-box">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="card-title">Dekripsi Bukti</h2>
              <p className="card-subtitle">Dekripsi berkas envelope dan verifikasi data</p>
            </div>
          </div>
          <span className="chip font-mono">DEKRIPSI</span>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleDecryptSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Unggah Envelope */}
            <div>
              <label className="label">1. Berkas Envelope (.json)</label>
              <div onClick={() => fileInputRef.current?.click()} className="dropzone group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="w-4 h-4 text-ink-muted group-hover:text-brand flex-shrink-0" />
                <span className="flex-1 truncate text-sm text-ink">
                  {envelopeFile ? envelopeFile.name : 'Pilih file .json...'}
                </span>
              </div>
              <p className="hint font-mono">File .json hasil enkripsi</p>
            </div>

            {/* Kata Sandi Pembuka */}
            <div>
              <label className="label">2. Kunci Pembuka</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi pembuka bukti..."
                className="input font-mono"
              />
              <p className="hint">Gunakan kata sandi saat berkas dienkripsi</p>
            </div>
          </div>

          {/* Tombol Aksi Bawah */}
          <button type="submit" disabled={loading || !envelopeFile} className="btn-primary w-full">
            <Unlock className="w-4 h-4" />
            <span>{loading ? 'Mendekripsi...' : 'Dekripsi Bukti'}</span>
          </button>
        </form>
      </div>

      {/* Card 2: Pratinjau Bukti Terbuka */}
      <div className="card flex flex-col">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="icon-box">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="card-title">Hasil Dekripsi</h3>
              <p className="card-subtitle">Pratinjau berkas dan informasi bukti</p>
            </div>
          </div>
          <span className="chip font-mono">HASIL</span>
        </div>

        {decryptedResult ? (
          <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="alert alert-success">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Kunci valid. Bukti berhasil dibuka.</span>
              </div>

              {/* Ringkasan Kasus / Kronologi Pelapor */}
              {decryptedResult.notes ? (
                <div className="panel p-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink-dark">
                    <FileText className="w-4 h-4 text-brand" />
                    <span>Catatan Kasus</span>
                  </div>
                  <p className="text-sm text-ink whitespace-pre-wrap pl-6 max-h-24 overflow-y-auto">
                    {decryptedResult.notes}
                  </p>
                </div>
              ) : (
                <div className="panel px-4 py-3 text-sm text-ink-muted flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Tidak ada catatan kasus.</span>
                </div>
              )}

              {/* Info Metadata Berkas */}
              <div className="panel divide-y divide-line text-sm overflow-hidden">
                {decryptedResult.category && (
                  <div className="px-4 py-3 flex justify-between items-center gap-4">
                    <span className="text-ink-muted flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Kategori
                    </span>
                    <span className="text-brand font-semibold">
                      {getCategoryLabel(decryptedResult.category)}
                    </span>
                  </div>
                )}
                <div className="px-4 py-3 flex justify-between items-center gap-4">
                  <span className="text-ink-muted">Berkas</span>
                  <span className="font-mono text-[13px] text-ink-dark font-semibold truncate max-w-[200px]">{decryptedResult.filename}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center gap-4">
                  <span className="text-ink-muted">Tipe</span>
                  <span className="font-mono text-[13px] text-ink">{decryptedResult.contentType}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center gap-4">
                  <span className="text-ink-muted">Ukuran</span>
                  <span className="font-mono text-[13px] text-ink">{(decryptedResult.blob.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              {/* Pratinjau Gambar jika ada */}
              {decryptedResult.previewUrl && (
                <div className="panel p-3 text-center">
                  <img
                    src={decryptedResult.previewUrl}
                    alt="Pratinjau Bukti"
                    className="max-h-40 mx-auto rounded-input object-contain"
                  />
                </div>
              )}
            </div>

            {/* Tombol Unduh File Asli */}
            <button onClick={downloadDecryptedFile} className="btn-primary w-full">
              <Download className="w-4 h-4" />
              <span>Unduh Berkas Asli</span>
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-ink-muted mb-3">
              <FileCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base">Menunggu Dekripsi</h4>
            <p className="text-sm text-ink-muted mt-1 max-w-xs">
              Unggah file envelope dan masukkan kunci di panel kiri.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
