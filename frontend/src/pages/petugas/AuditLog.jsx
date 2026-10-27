import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Alert, PageHeader, Spinner } from '../../components/ui'
import { formatDate } from '../../lib/format'

const ACTION_LABELS = {
  'auth.login': 'Masuk',
  'auth.login_failed': 'Gagal masuk',
  'auth.register': 'Pendaftaran',
  'report.create': 'Laporan dibuat',
  'attachment.upload': 'Lampiran diunggah',
  'attachment.download': 'Lampiran diunduh',
  'attachment.verify': 'Cek integritas',
  'attachment.access_denied': 'Akses lampiran ditolak',
  'officer.view_report': 'Petugas membuka kasus',
  'officer.change_status': 'Status diubah',
  'officer.add_note': 'Catatan petugas',
  'officer.request_access': 'Petugas meminta akses file',
  'officer.view_attachment': 'Petugas melihat file',
  'officer.view_denied': 'Petugas ditolak melihat file',
  'attachment.access_grant': 'Pelapor mengizinkan akses',
  'attachment.access_deny': 'Pelapor menolak akses',
  'attachment.access_revoke': 'Pelapor mencabut akses',
  'officer.open_verification': 'Petugas membuka verifikasi KTP',
  'officer.view_ktp': 'Petugas melihat KTP',
  'officer.view_ktp_denied': 'Akses KTP ditolak',
  'officer.ktp_terverifikasi': 'KTP diverifikasi',
  'officer.ktp_ditolak': 'KTP ditolak',
  'officer.ktp_flag': 'Diminta verifikasi ulang',
  'me.view_profile': 'Pelapor melihat profil',
  'me.upload_ktp': 'KTP diunggah',
  'me.export': 'Ekspor data',
  'me.delete_account': 'Akun dihapus',
}

export default function AuditLog() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.get('/officer/audit?limit=200').then(setRows).catch((e) => setError(e.message))
  }, [])

  return (
    <>
      <PageHeader title="Audit Log" subtitle="Setiap akses ke data tercatat. Log tidak berisi data pribadi." />
      <Alert>{error}</Alert>
      {!rows ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Peran</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
                <th className="px-4 py-3 font-medium">Objek</th>
                <th className="px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-t border-slate-100 ${r.action.includes('denied') || r.action.includes('failed') ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-500">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-2">{r.actor_role ?? '–'}</td>
                  <td className="px-4 py-2">{ACTION_LABELS[r.action] ?? r.action}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">
                    {r.target_type ? `${r.target_type}:${r.target_id?.slice(0, 8)}` : '–'}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">{r.detail ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
