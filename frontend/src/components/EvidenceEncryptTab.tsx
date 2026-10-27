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
  const cipherMode: BlockCipherMode = 'CTR';
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Card 1: Form Input Bukti & Parameter Kripto */}
      <div className="card flex flex-col">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="icon-box">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="card-title">Enkripsi Bukti</h2>
              <p className="card-subtitle">Enkripsi berkas bukti dan hashing kunci</p>
            </div>
          </div>
          <span className="chip font-mono">ENKRIPSI</span>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEncryptSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Kategori & Berkas Bukti */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">1. Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EvidenceCategory)}
                  className="input cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <p className="hint truncate" title={categories.find((c) => c.id === category)?.hint}>
                  {categories.find((c) => c.id === category)?.hint}
                </p>
              </div>

              <div>
                <label className="label">2. Berkas Bukti</label>
                <div onClick={() => fileInputRef.current?.click()} className="dropzone group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Upload className="w-4 h-4 text-ink-muted group-hover:text-brand flex-shrink-0" />
                  <span className="flex-1 truncate text-sm text-ink">
                    {file ? file.name : 'Pilih file...'}
                  </span>
                  {file && (
                    <span className="chip font-mono flex-shrink-0">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </div>
                <p className="hint font-mono">Maksimal 100 MB</p>
              </div>
            </div>

            {/* Ringkasan Kasus */}
            <div>
              <label className="label">3. Catatan Kasus (Opsional)</label>
              <textarea
                value={incidentNotes}
                onChange={(e) => setIncidentNotes(e.target.value)}
                placeholder="Catatan insiden atau tautan mencurigakan..."
                className="input font-mono h-20 resize-none"
              />
            </div>

            {/* Konfigurasi Kripto */}
            <div>
              <span className="label">4. Konfigurasi Kripto</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="hint block mt-0 mb-1">Algoritma</label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as CryptoAlgorithm)}
                    className="input font-mono cursor-pointer"
                  >
                    <option value="AES">AES-256</option>
                    <option value="DES">DES</option>
                    <option value="RC4">RC4</option>
                  </select>
                </div>

                <div>
                  <label className="hint block mt-0 mb-1">Mode</label>
                  {algorithm === 'AES' || algorithm === 'DES' ? (
                    <div className="input font-mono bg-surface flex items-center justify-between">
                      <span className="text-brand font-semibold">CTR</span>
                      <span className="text-xs text-ink-muted font-sans">Counter</span>
                    </div>
                  ) : (
                    <div className="input font-mono bg-surface text-ink-disabled">Stream</div>
                  )}
                </div>

                <div>
                  <label className="hint block mt-0 mb-1">Kunci</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata sandi"
                    className="input"
                  />
                </div>

                <div>
                  <label className="hint block mt-0 mb-1">Ulangi Kunci</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi"
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Aksi Bawah */}
          <button type="submit" disabled={loading || !file} className="btn-primary w-full">
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Mengenkripsi...' : 'Enkripsi Bukti'}</span>
          </button>
        </form>
      </div>

      {/* Card 2: Status Envelope */}
      <div className="card flex flex-col">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="icon-box">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="card-title">Hasil Enkripsi</h3>
              <p className="card-subtitle">Envelope kriptografi dan metadata</p>
            </div>
          </div>
          <span className="chip font-mono">ENVELOPE</span>
        </div>

        {envelopeResult ? (
          <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="alert alert-success">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Bukti berhasil diamankan dalam envelope.</span>
              </div>

              {/* Tabel Metadata */}
              <div className="panel divide-y divide-line text-sm overflow-hidden">
                <div className="px-4 py-3 flex justify-between items-center gap-4">
                  <span className="text-ink-muted">Berkas</span>
                  <span className="font-mono text-[13px] text-ink-dark font-semibold truncate max-w-[200px]">{envelopeResult.envelope.name}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center gap-4">
                  <span className="text-ink-muted">Algoritma</span>
                  <span className="font-mono text-[13px] text-brand font-semibold">
                    {envelopeResult.envelope.algorithm}
                    {envelopeResult.envelope.mode ? `-${envelopeResult.envelope.mode}` : ''}
                  </span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center gap-4">
                  <span className="text-ink-muted">Salt (16B)</span>
                  <span className="font-mono text-[13px] text-ink truncate max-w-[170px]">{envelopeResult.envelope.salt}</span>
                </div>
                {envelopeResult.envelope.nonce && (
                  <div className="px-4 py-3 flex justify-between items-center gap-4">
                    <span className="text-ink-muted">Nonce</span>
                    <span className="font-mono text-[13px] text-ink truncate max-w-[170px]">{envelopeResult.envelope.nonce}</span>
                  </div>
                )}
                {envelopeResult.envelope.iv && !envelopeResult.envelope.nonce && (
                  <div className="px-4 py-3 flex justify-between items-center gap-4">
                    <span className="text-ink-muted">IV</span>
                    <span className="font-mono text-[13px] text-ink truncate max-w-[170px]">{envelopeResult.envelope.iv}</span>
                  </div>
                )}
                {envelopeResult.envelope.mac && (
                  <div className="px-4 py-3 flex justify-between items-center gap-4">
                    <span className="text-ink-muted">Integritas (MAC)</span>
                    <span className="font-mono text-[13px] text-brand truncate max-w-[170px]" title={envelopeResult.envelope.mac}>
                      {envelopeResult.envelope.mac.slice(0, 16)}...
                    </span>
                  </div>
                )}
                <div className="px-4 py-3 flex justify-between items-center gap-4">
                  <span className="text-ink-muted">Ciphertext</span>
                  <span className="font-mono text-[13px] text-ink">{envelopeResult.envelope.ciphertext.length} char</span>
                </div>
              </div>
            </div>

            {/* Tombol Unduh */}
            <button onClick={downloadEnvelope} className="btn-primary w-full">
              <Download className="w-4 h-4" />
              <span>Unduh Envelope (.json)</span>
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-ink-muted mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h4 className="text-base">Menunggu Enkripsi</h4>
            <p className="text-sm text-ink-muted mt-1 max-w-xs">
              Pilih berkas bukti dan tentukan kunci di panel kiri.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
