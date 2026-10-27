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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
      {/* Enkripsi Teks Bebas */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-3.5 sm:p-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
        <div className="border-b border-zinc-800/80 pb-2 mb-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
            Enkripsi Teks
          </h2>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Amankan pesan atau tautan mencurigakan
          </p>
        </div>

        {encError && (
          <div className="mb-2 p-2 text-xs rounded-xl border border-red-900/40 bg-red-950/20 text-red-400">
            {encError}
          </div>
        )}

        <form onSubmit={handleEncrypt} className="space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-zinc-300 mb-0.5">
                Teks Rahasia
              </label>
              <textarea
                required
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                placeholder="Tempel teks atau tautan di sini..."
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 h-14 resize-none transition-all leading-tight"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-zinc-300 mb-0.5">Algoritma</label>
                <select
                  value={encAlgorithm}
                  onChange={(e) => setEncAlgorithm(e.target.value as CryptoAlgorithm)}
                  className="w-full px-2 py-1 text-xs rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-100 font-mono focus:outline-none focus:border-zinc-500 transition-all"
                >
                  <option value="AES">AES-256</option>
                  <option value="DES">DES</option>
                  <option value="RC4">RC4</option>
                </select>
              </div>

              {encAlgorithm === 'AES' || encAlgorithm === 'DES' ? (
                <div>
                  <label className="block text-[10px] font-medium text-zinc-300 mb-0.5">Mode {encAlgorithm}</label>
                  <select
                    value={encCipherMode}
                    onChange={(e) => setEncCipherMode(e.target.value as BlockCipherMode)}
                    className="w-full px-2 py-1 text-xs rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-100 font-mono focus:outline-none focus:border-zinc-500 transition-all"
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
                <label className="block text-[10px] font-medium text-zinc-300 mb-0.5">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={encPassword}
                  onChange={(e) => setEncPassword(e.target.value)}
                  placeholder="Kunci"
                  className="w-full px-2 py-1 text-xs rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={encLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 text-xs font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{encLoading ? 'Mengenkripsi...' : 'Enkripsi Teks'}</span>
            </button>
          </div>
        </form>

        {encryptedEnvelope && (
          <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono text-[10px]">
                Envelope ({encryptedEnvelope.algorithm}-{encryptedEnvelope.mode || 'CBC'}):
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(encryptedEnvelope, null, 2))}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono text-[10px] transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
              </button>
            </div>
            <pre className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[9.5px] font-mono text-zinc-300 overflow-x-auto max-h-20 leading-tight">
              {JSON.stringify(encryptedEnvelope, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Dekripsi Teks Bebas */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-3.5 sm:p-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
        <div className="border-b border-zinc-800/80 pb-2 mb-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
            Dekripsi Teks
          </h2>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Buka teks terenkripsi dari envelope JSON
          </p>
        </div>

        {decError && (
          <div className="mb-2 p-2 text-xs rounded-xl border border-red-900/40 bg-red-950/20 text-red-400">
            {decError}
          </div>
        )}

        <form onSubmit={handleDecrypt} className="space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-zinc-300 mb-0.5">
                Envelope JSON
              </label>
              <textarea
                required
                value={envelopeInput}
                onChange={(e) => setEnvelopeInput(e.target.value)}
                placeholder='Tempel JSON envelope di sini...'
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 h-14 resize-none transition-all leading-tight"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-zinc-300 mb-0.5">Kata Sandi</label>
              <input
                type="password"
                required
                value={decPassword}
                onChange={(e) => setDecPassword(e.target.value)}
                placeholder="Kata sandi"
                className="w-full px-2 py-1 text-xs rounded-xl border border-zinc-800 bg-zinc-950/70 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={decLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 text-xs font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{decLoading ? 'Mendekripsi...' : 'Dekripsi Teks'}</span>
            </button>
          </div>
        </form>

        {decryptedText && (
          <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1 animate-fade-in">
            <span className="text-zinc-400 font-mono text-[10px]">Teks Asli:</span>
            <div className="p-2 rounded-xl bg-zinc-950/80 border border-emerald-500/40 text-xs font-mono text-zinc-100 whitespace-pre-wrap max-h-20 overflow-y-auto leading-tight">
              {decryptedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
