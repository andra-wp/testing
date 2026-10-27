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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
      {/* Bento Tile 1: Input Berkas Envelope & Password */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-3.5 sm:p-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
        
        {/* Header Tile */}
        <div className="border-b border-zinc-800/80 pb-2 mb-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              <Unlock className="w-3 h-3" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Dekripsi Bukti
              </h2>
              <p className="text-[10px] text-zinc-400">
                Dekripsi berkas envelope dan verifikasi data
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400">
            DEKRIPSI
          </span>
        </div>

        {error && (
          <div className="mb-2 flex items-start gap-1.5 p-2 text-xs rounded-xl border border-red-900/40 bg-red-950/20 text-red-400 flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="text-[11px]">{error}</span>
          </div>
        )}

        <form onSubmit={handleDecryptSubmit} className="space-y-2.5 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Sub-Bento Tile 1: Unggah Envelope */}
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/60 p-2">
              <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                1. Berkas Envelope (.json)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all duration-200 group flex items-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 flex-shrink-0">
                  <Upload className="w-3 h-3" />
                </div>
                <div className="truncate flex-1">
                  <span className="text-xs text-zinc-200 font-medium block truncate">
                    {envelopeFile ? envelopeFile.name : 'Pilih file .json...'}
                  </span>
                </div>
              </div>
              <p className="text-[8.5px] text-zinc-500 mt-1 font-mono">
                File .json hasil enkripsi
              </p>
            </div>

            {/* Sub-Bento Tile 2: Kata Sandi Pembuka */}
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/60 p-2">
              <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                2. Kunci Pembuka
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi pembuka bukti..."
                className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all font-mono"
              />
              <p className="text-[8.5px] text-zinc-500 mt-1 font-mono">
                Gunakan kata sandi saat berkas dienkripsi
              </p>
            </div>
          </div>

          {/* Tombol Aksi Bawah */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || !envelopeFile}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 text-xs font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{loading ? 'Mendekripsi...' : 'Dekripsi Bukti'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bento Tile 2: Pratinjau Bukti Terbuka (Simetris dengan Tile 1) */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-3.5 sm:p-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
        
        {/* Header Tile */}
        <div className="border-b border-zinc-800/80 pb-2 mb-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              <Eye className="w-3 h-3" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Hasil Dekripsi
              </h3>
              <p className="text-[10px] text-zinc-400">
                Pratinjau berkas dan informasi bukti
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400">
            HASIL
          </span>
        </div>

        {decryptedResult ? (
          <div className="space-y-2 animate-fade-in flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 p-2 text-xs rounded-xl border border-emerald-900/40 bg-emerald-950/20 text-emerald-400 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[11px]">Kunci valid. Bukti berhasil dibuka.</span>
            </div>

            {/* Ringkasan Kasus / Kronologi Pelapor */}
            {decryptedResult.notes ? (
              <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px]">Catatan Kasus:</span>
                </div>
                <p className="text-[11px] text-zinc-300 whitespace-pre-wrap leading-tight font-sans pl-4 max-h-12 overflow-y-auto">
                  {decryptedResult.notes}
                </p>
              </div>
            ) : (
              <div className="p-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[10px] text-zinc-500 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-zinc-600" />
                <span>Tidak ada catatan kasus.</span>
              </div>
            )}

            {/* Info Metadata Berkas */}
            <div className="border border-zinc-800/80 rounded-xl bg-zinc-950/70 divide-y divide-zinc-800/60 text-xs font-mono overflow-hidden">
              {decryptedResult.category && (
                <div className="p-1.5 flex justify-between items-center text-[10.5px]">
                  <span className="text-zinc-500 flex items-center gap-1 font-sans">
                    <Tag className="w-3 h-3 text-zinc-500" />
                    Kategori:
                  </span>
                  <span className="text-emerald-400 font-sans font-medium">
                    {getCategoryLabel(decryptedResult.category)}
                  </span>
                </div>
              )}
              <div className="p-1.5 flex justify-between items-center text-[10.5px]">
                <span className="text-zinc-500">Berkas:</span>
                <span className="text-zinc-200 font-semibold truncate max-w-[200px]">{decryptedResult.filename}</span>
              </div>
              <div className="p-1.5 flex justify-between items-center text-[10.5px]">
                <span className="text-zinc-500">Tipe:</span>
                <span className="text-zinc-300">{decryptedResult.contentType}</span>
              </div>
              <div className="p-1.5 flex justify-between items-center text-[10.5px]">
                <span className="text-zinc-500">Ukuran:</span>
                <span className="text-zinc-300">{(decryptedResult.blob.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            {/* Pratinjau Gambar jika ada */}
            {decryptedResult.previewUrl && (
              <div className="border border-zinc-800/80 rounded-xl bg-zinc-950/60 p-1.5 text-center">
                <img
                  src={decryptedResult.previewUrl}
                  alt="Pratinjau Bukti"
                  className="max-h-20 mx-auto rounded border border-zinc-800 object-contain shadow-md"
                />
              </div>
            )}

            {/* Tombol Unduh File Asli */}
            <div className="pt-1">
              <button
                onClick={downloadDecryptedFile}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Berkas Asli</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/40 p-4 text-center my-auto flex flex-col items-center justify-center flex-1">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              <FileCheck className="w-4 h-4 text-cyan-400/60" />
            </div>
            <h4 className="text-xs font-semibold text-zinc-300 font-mono uppercase tracking-wider">
              Menunggu Dekripsi
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
              Unggah file envelope dan masukkan kunci di panel kiri.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
