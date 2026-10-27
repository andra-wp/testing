import React, { useState, useRef } from 'react';
import {
  Upload,
  Lock,
  CheckCircle2,
  AlertCircle,
  Download,
  KeyRound,
  FileCode,
} from 'lucide-react';
import { api } from '../api';
import { BlockCipherMode, CryptoAlgorithm, CryptoEnvelope, EvidenceCategory } from '../types';

export const EvidenceEncryptTab: React.FC = () => {
  const [category, setCategory] = useState<EvidenceCategory>('screenshot');
  const [file, setFile] = useState<File | null>(null);
  const [incidentNotes, setIncidentNotes] = useState('');
  const [algorithm, setAlgorithm] = useState<CryptoAlgorithm>('AES');
  const [cipherMode, setCipherMode] = useState<BlockCipherMode>('CBC');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [envelopeResult, setEnvelopeResult] = useState<{
    blob: Blob;
    filename: string;
    envelope: CryptoEnvelope;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: { id: EvidenceCategory; label: string; hint: string }[] = [
    {
      id: 'screenshot',
      label: 'Screenshot Chat / Web Phishing',
      hint: 'Tangkapan layar chat atau web phishing (JPG, PNG)',
    },
    {
      id: 'document',
      label: 'Dokumen / Email Header',
      hint: 'File dokumen atau header email (PDF, TXT, DOCX)',
    },
    {
      id: 'video',
      label: 'Rekaman Layar Insiden',
      hint: 'Video bukti rekaman layar (MP4, MKV)',
    },
    {
      id: 'identity',
      label: 'Identitas Terlindungi',
      hint: 'Dokumen identitas terenkripsi (KTM, KTP)',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setEnvelopeResult(null);
    }
  };

  const handleEncryptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnvelopeResult(null);

    if (!file) {
      setError('Silakan pilih berkas bukti terlebih dahulu.');
      return;
    }

    if (!password) {
      setError('Kata sandi pembuka bukti tidak boleh kosong.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.encryptFile(file, password, algorithm, cipherMode, incidentNotes, category);
      setEnvelopeResult({
        blob: res.blob,
        filename: res.envelopeFilename,
        envelope: res.envelopeJson,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal mengenkripsi berkas bukti.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadEnvelope = () => {
    if (!envelopeResult) return;
    const url = URL.createObjectURL(envelopeResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = envelopeResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
      {/* Bento Tile 1: Form Input Bukti & Parameter Kripto */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-3.5 sm:p-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
        
        {/* Header Tile */}
        <div className="border-b border-zinc-800/80 pb-2 mb-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              <Lock className="w-3 h-3" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Enkripsi Bukti
              </h2>
              <p className="text-[10px] text-zinc-400">
                Enkripsi berkas bukti dan hashing kunci
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400">
            ENKRIPSI
          </span>
        </div>

        {error && (
          <div className="mb-2 flex items-start gap-1.5 p-2 text-xs rounded-xl border border-red-900/40 bg-red-950/20 text-red-400 flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="text-[11px]">{error}</span>
          </div>
        )}

        <form onSubmit={handleEncryptSubmit} className="space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Sub-Bento Grid: Kategori & Berkas Bukti (Simetris 50/50) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/60 p-2">
                <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  1. Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EvidenceCategory)}
                  className="w-full px-2 py-1 text-xs rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-100 focus:outline-none focus:border-zinc-500 transition-all font-sans cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-zinc-900 text-zinc-200">
                      {cat.label}
                    </option>
                  ))}
                </select>
                <p className="text-[8.5px] text-zinc-500 mt-1 truncate" title={categories.find((c) => c.id === category)?.hint}>
                  {categories.find((c) => c.id === category)?.hint}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/60 p-2 flex flex-col justify-between">
                <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  2. Berkas Bukti
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 rounded-lg px-2 py-1 cursor-pointer transition-all duration-200 group flex items-center gap-1.5"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 flex-shrink-0">
                    <Upload className="w-3 h-3" />
                  </div>
                  <div className="truncate flex-1">
                    <span className="text-[11px] text-zinc-200 font-medium block truncate">
                      {file ? file.name : 'Pilih file...'}
                    </span>
                  </div>
                  {file && (
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-[8.5px] font-mono text-emerald-400 flex-shrink-0">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </div>
                <p className="text-[8.5px] text-zinc-500 mt-1 font-mono">
                  Maksimal 100 MB
                </p>
              </div>
            </div>

            {/* Sub-Bento Tile: Ringkasan Kasus */}
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/60 p-2">
              <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5">
                3. Catatan Kasus (Opsional)
              </label>
              <textarea
                value={incidentNotes}
                onChange={(e) => setIncidentNotes(e.target.value)}
                placeholder="Catatan insiden atau tautan mencurigakan..."
                className="w-full px-2 py-1 text-xs rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-zinc-500 h-10 resize-none transition-all leading-tight"
              />
            </div>

            {/* Sub-Bento Tile: Konfigurasi Kripto (4 Kolom Sempurna) */}
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/60 p-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-0.5">
                    Algoritma
                  </label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as CryptoAlgorithm)}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
                  >
                    <option value="AES">AES-256</option>
                    <option value="DES">DES</option>
                    <option value="RC4">RC4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-0.5">
                    Mode
                  </label>
                  {algorithm === 'AES' || algorithm === 'DES' ? (
                    <select
                      value={cipherMode}
                      onChange={(e) => setCipherMode(e.target.value as BlockCipherMode)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
                    >
                      <option value="CBC">CBC</option>
                      <option value="CTR">CTR</option>
                      <option value="OFB">OFB</option>
                      <option value="CFB">CFB</option>
                    </select>
                  ) : (
                    <div className="px-2 py-1 text-xs rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-500 font-mono">
                      Stream
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-0.5">
                    Kunci
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata sandi"
                    className="w-full px-2 py-1 text-xs rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-0.5">
                    Ulangi Kunci
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi"
                    className="w-full px-2 py-1 text-xs rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Aksi Bawah */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 text-xs font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? 'Mengenkripsi...' : 'Enkripsi Bukti'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bento Tile 2: Status Brankas Envelope (Simetris Sempurna dengan Tile 1) */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-3.5 sm:p-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
        
        {/* Header Tile Symmetrical with Tile 1 */}
        <div className="border-b border-zinc-800/80 pb-2 mb-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              <FileCode className="w-3 h-3" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Hasil Enkripsi
              </h3>
              <p className="text-[10px] text-zinc-400">
                Envelope kriptografi dan metadata
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400">
            ENVELOPE
          </span>
        </div>

        {envelopeResult ? (
          <div className="space-y-2 animate-fade-in flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 p-2 text-xs rounded-xl border border-emerald-900/40 bg-emerald-950/20 text-emerald-400 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[11px]">Bukti berhasil diamankan dalam envelope.</span>
            </div>

            {/* Tabel Metadata Bento Box */}
            <div className="border border-zinc-800/80 rounded-xl bg-zinc-950/70 divide-y divide-zinc-800/60 text-xs font-mono overflow-hidden">
              <div className="p-2 flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Berkas:</span>
                <span className="text-zinc-200 font-semibold truncate max-w-[200px]">{envelopeResult.envelope.name}</span>
              </div>
              <div className="p-2 flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Algoritma:</span>
                <span className="text-emerald-400 font-semibold">
                  {envelopeResult.envelope.algorithm}
                  {envelopeResult.envelope.mode ? `-${envelopeResult.envelope.mode}` : ''}
                </span>
              </div>
              <div className="p-2 flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Salt (16B):</span>
                <span className="text-zinc-400 truncate max-w-[170px]">{envelopeResult.envelope.salt}</span>
              </div>
              {envelopeResult.envelope.nonce && (
                <div className="p-2 flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Nonce:</span>
                  <span className="text-zinc-400 truncate max-w-[170px]">{envelopeResult.envelope.nonce}</span>
                </div>
              )}
              {envelopeResult.envelope.iv && !envelopeResult.envelope.nonce && (
                <div className="p-2 flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">IV:</span>
                  <span className="text-zinc-400 truncate max-w-[170px]">{envelopeResult.envelope.iv}</span>
                </div>
              )}
              <div className="p-2 flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Ciphertext:</span>
                <span className="text-zinc-400">{envelopeResult.envelope.ciphertext.length} char</span>
              </div>
            </div>

            {/* Tombol Unduh */}
            <div className="pt-1">
              <button
                onClick={downloadEnvelope}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Envelope (.json)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/40 p-4 text-center my-auto flex flex-col items-center justify-center flex-1">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              <KeyRound className="w-4 h-4 text-emerald-400/60" />
            </div>
            <h4 className="text-xs font-semibold text-zinc-300 font-mono uppercase tracking-wider">
              Menunggu Enkripsi
            </h4>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
              Pilih berkas bukti dan tentukan kunci di panel kiri.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
