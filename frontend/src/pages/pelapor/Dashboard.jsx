import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Alert, PageHeader, Spinner, StatusBadge } from '../../components/ui'
import { formatDate } from '../../lib/format'

export default function Dashboard() {
  const [reports, setReports] = useState(null)
  const [ktp, setKtp] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/reports'), api.get('/me/ktp')])
      .then(([r, k]) => {
        setReports(r)
        setKtp(k)
      })
      .catch((e) => setError(e.message))
  }, [])

  return (
    <>
      <PageHeader
        title="Laporan Saya"
        subtitle="Pantau status laporan dan balas pertanyaan petugas."
        action={
          <Link to="/pelapor/lapor-baru" className="btn-primary">
            + Buat laporan
          </Link>
        }
      />
      <Alert>{error}</Alert>
      {ktp && ktp.verification.status !== 'terverifikasi' && (
        <div className="mb-4">
          <Alert kind={ktp.verification.status === 'menunggu' ? 'info' : 'warn'}>
            {{
              belum: 'Verifikasi KTP diperlukan sebelum Anda dapat membuat laporan.',
              menunggu: 'KTP Anda sedang diverifikasi petugas. Laporan dapat dibuat setelah terverifikasi.',
              ditolak: 'Verifikasi KTP ditolak. Unggah ulang KTP untuk dapat membuat laporan.',
              verifikasi_ulang: 'Petugas meminta verifikasi ulang KTP. Pembuatan laporan ditutup sementara.',
            }[ktp.verification.status]}{' '}
            <Link to="/pelapor/verifikasi" className="font-medium underline">
              Buka verifikasi KTP
            </Link>
          </Alert>
        </div>
      )}
      {!reports ? (
        <Spinner />
      ) : reports.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-medium text-slate-700">Belum ada laporan.</p>
          <p className="mt-1 text-sm text-slate-500">Mengalami atau menyaksikan kekerasan di kampus? Laporkan di sini dengan aman.</p>
          <Link to="/pelapor/lapor-baru" className="btn-primary mt-4">
            Buat laporan pertama
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => (
            <Link key={r.id} to={`/pelapor/laporan/${r.id}`} className="card flex flex-wrap items-center gap-4 p-4 hover:border-brand-600">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-900">{r.title}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {r.category_label} · dikirim {formatDate(r.created_at)} · {r.attachment_count} lampiran
                </div>
              </div>
              <StatusBadge status={r.status} />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
