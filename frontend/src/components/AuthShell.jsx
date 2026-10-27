import { APP_NAME, OFFICER_UNIT } from '../lib/constants'
import ThemeToggle from './ThemeToggle'
import { ShieldIcon } from './ui'

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen bg-slate-50 text-slate-800 lg:grid-cols-2">
      {/* Huawei background-dark panel with a brand-red accent rule */}
      <aside className="hidden flex-col justify-between border-r border-slate-200 bg-black p-10 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <ShieldIcon className="h-6 w-6 text-brand-solid" /> {APP_NAME}
        </div>
        <div className="space-y-4">
          <div className="h-1 w-12 bg-brand-solid" />
          <h2 className="text-3xl leading-tight font-semibold">
            Laporkan kekerasan di kampus dengan aman.
          </h2>
          <ul className="space-y-2 text-sm text-white/80">
            <li>• Identitas, KTP, dan bukti Anda dienkripsi sebelum disimpan.</li>
            <li>• Hanya Anda yang dapat mengunduh kembali file yang Anda kirim.</li>
            <li>• Petugas {OFFICER_UNIT} melihat identitas Anda dalam bentuk tersamar.</li>
            <li>• Anda yang menentukan bukti mana yang boleh dilihat petugas.</li>
          </ul>
        </div>
        <p className="text-xs text-white/70">
          Data diproses sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
        </p>
      </aside>
      <main className="relative flex items-center justify-center p-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 font-semibold text-brand-700 lg:hidden">
            <ShieldIcon /> {APP_NAME}
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 mb-6 text-sm text-slate-500">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  )
}
