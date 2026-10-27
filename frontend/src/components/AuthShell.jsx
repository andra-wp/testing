import { ShieldIcon } from './ui'

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand-800 p-10 text-brand-50 lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <ShieldIcon className="h-6 w-6" /> Lapor Siber
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl leading-tight font-semibold">
            Laporkan phishing dan penipuan online dengan aman.
          </h2>
          <ul className="space-y-2 text-sm text-brand-100">
            <li>• Identitas, KTP, dan bukti Anda dienkripsi sebelum disimpan.</li>
            <li>• Hanya Anda yang dapat mengunduh kembali file yang Anda kirim.</li>
            <li>• Petugas CSIRT melihat identitas Anda dalam bentuk tersamar.</li>
          </ul>
        </div>
        <p className="text-xs text-brand-100/80">
          Data diproses sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
        </p>
      </aside>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 font-semibold text-brand-700 lg:hidden">
            <ShieldIcon /> Lapor Siber
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 mb-6 text-sm text-slate-500">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  )
}
