import React, { useState } from 'react';
import { Lock, Unlock, Copy, Check } from 'lucide-react';
import { api } from '../api';
import { BlockCipherMode, CryptoAlgorithm, CryptoEnvelope } from '../types';

export const QuickTextTab: React.FC = () => {
  // Encrypt state
  const [plainText, setPlainText] = useState('');
  const [encPassword, setEncPassword] = useState('');
  const [encAlgorithm, setEncAlgorithm] = useState<CryptoAlgorithm>('AES');
  const [encCipherMode, setEncCipherMode] = useState<BlockCipherMode>('CBC');
  const [encryptedEnvelope, setEncryptedEnvelope] = useState<CryptoEnvelope | null>(null);
  const [encLoading, setEncLoading] = useState(false);
  const [encError, setEncError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Decrypt state
  const [envelopeInput, setEnvelopeInput] = useState('');
  const [decPassword, setDecPassword] = useState('');
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decLoading, setDecLoading] = useState(false);
  const [decError, setDecError] = useState<string | null>(null);

  const handleEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setEncError(null);
    setEncryptedEnvelope(null);
    setEncLoading(true);

    try {
      const res = await api.encryptText(plainText, encPassword, encAlgorithm, encCipherMode, 'text_notes.txt');
      setEncryptedEnvelope(res.envelope);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEncError(err.message);
      } else {
        setEncError('Gagal mengenkripsi teks.');
      }
    } finally {
      setEncLoading(false);
    }
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecError(null);
    setDecryptedText(null);
    setDecLoading(true);

    try {
      const parsedEnvelope = JSON.parse(envelopeInput);
      const res = await api.decryptText(parsedEnvelope, decPassword);
      setDecryptedText(res.plaintext);
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        setDecError('Format envelope bukan JSON yang valid.');
      } else if (err instanceof Error) {
        setDecError(err.message);
      } else {
        setDecError('Gagal mendekripsi teks.');
      }
    } finally {
      setDecLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Enkripsi Teks Bebas */}
      <div className="card flex flex-col">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="icon-box">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="card-title">Enkripsi Teks</h2>
              <p className="card-subtitle">Amankan pesan atau tautan mencurigakan</p>
            </div>
          </div>
        </div>

        {encError && <div className="alert alert-error mb-4">{encError}</div>}

        <form onSubmit={handleEncrypt} className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="label">Teks Rahasia</label>
              <textarea
                required
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                placeholder="Tempel teks atau tautan di sini..."
                className="input font-mono h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Algoritma</label>
                <select
                  value={encAlgorithm}
                  onChange={(e) => setEncAlgorithm(e.target.value as CryptoAlgorithm)}
                  className="input font-mono cursor-pointer"
                >
                  <option value="AES">AES-256</option>
                  <option value="DES">DES</option>
                  <option value="RC4">RC4</option>
                </select>
              </div>

              {encAlgorithm === 'AES' || encAlgorithm === 'DES' ? (
                <div>
                  <label className="label">Mode {encAlgorithm}</label>
                  <select
                    value={encCipherMode}
                    onChange={(e) => setEncCipherMode(e.target.value as BlockCipherMode)}
                    className="input font-mono cursor-pointer"
                  >
                    <option value="CBC">CBC</option>
                    <option value="CTR">CTR</option>
                    <option value="OFB">OFB</option>
                    <option value="CFB">CFB</option>
                  </select>
                </div>
              ) : (
                <div className="hidden sm:block"></div>
              )}

              <div>
                <label className="label">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={encPassword}
                  onChange={(e) => setEncPassword(e.target.value)}
                  placeholder="Kunci"
                  className="input"
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={encLoading} className="btn-primary w-full">
            <Lock className="w-4 h-4" />
            <span>{encLoading ? 'Mengenkripsi...' : 'Enkripsi Teks'}</span>
          </button>
        </form>

        {encryptedEnvelope && (
          <div className="mt-6 pt-4 border-t border-line space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-muted font-mono">
                Envelope ({encryptedEnvelope.algorithm}-{encryptedEnvelope.mode || 'CBC'}):
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(encryptedEnvelope, null, 2))}
                className="btn-ghost"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
              </button>
            </div>
            <pre className="panel p-3 text-[13px] font-mono text-ink overflow-x-auto max-h-40">
              {JSON.stringify(encryptedEnvelope, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Dekripsi Teks Bebas */}
      <div className="card flex flex-col">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="icon-box">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="card-title">Dekripsi Teks</h2>
              <p className="card-subtitle">Buka teks terenkripsi dari envelope JSON</p>
            </div>
          </div>
        </div>

        {decError && <div className="alert alert-error mb-4">{decError}</div>}

        <form onSubmit={handleDecrypt} className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="label">Envelope JSON</label>
              <textarea
                required
                value={envelopeInput}
                onChange={(e) => setEnvelopeInput(e.target.value)}
                placeholder='Tempel JSON envelope di sini...'
                className="input font-mono h-24 resize-none"
              />
            </div>

            <div>
              <label className="label">Kata Sandi</label>
              <input
                type="password"
                required
                value={decPassword}
                onChange={(e) => setDecPassword(e.target.value)}
                placeholder="Kata sandi"
                className="input"
              />
            </div>
          </div>

          <button type="submit" disabled={decLoading} className="btn-primary w-full">
            <Unlock className="w-4 h-4" />
            <span>{decLoading ? 'Mendekripsi...' : 'Dekripsi Teks'}</span>
          </button>
        </form>

        {decryptedText && (
          <div className="mt-6 pt-4 border-t border-line space-y-2 animate-fade-in">
            <span className="text-sm text-ink-muted font-mono">Teks Asli:</span>
            <div className="panel p-3 text-[13px] font-mono text-ink-dark whitespace-pre-wrap max-h-40 overflow-y-auto">
              {decryptedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
