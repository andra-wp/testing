import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadFile, uploadFile, api } from '../../api/client'
import FilePicker from '../../components/FilePicker'
import KycHistory from '../../components/KycHistory'
import VerifyResult from '../../components/VerifyResult'
import { Alert, Field, KycBadge, PageHeader, ProgressBar, Spinner } from '../../components/ui'
import { OFFICER_UNIT } from '../../lib/constants'
import { formatBytes, formatDate } from '../../lib/format'

const EXPLAIN = {
  belum: { kind: 'info', text: 'Unggah scan KTP Anda. Setelah diverifikasi petugas, Anda dapat membuat laporan.' },
  menunggu: { kind: 'info', text: 'KTP Anda sedang menunggu verifikasi petugas. Laporan dapat dibuat setelah terverifikasi.' },
  terverifikasi: { kind: 'success', text: 'Identitas Anda terverifikasi. Anda dapat membuat laporan tanpa mengunggah KTP lagi.' },
  ditolak: { kind: 'error', text: 'Verifikasi ditolak. Perbaiki sesuai catatan petugas lalu unggah ulang KTP.' },
  verifikasi_ulang: {
    kind: 'warn',
    text: 'Petugas menemukan dugaan masalah pada identitas Anda. Pembuatan laporan ditutup sementara sampai Anda mengunggah ulang KTP dan lolos verifikasi.',
  },
}

export default function Verification() {
  const [info, setInfo] = useState(null)
  const [file, setFile] = useState([])
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [check, setCheck] = useState(null)

  const load = useCallback(() => api.get('/me/ktp').then(setInfo).catch((e) => setError(e.message)), [])
  useEffect(() => {
    load()
  }, [load])

  const upload = async () => {
    const st = info.verification.status
    if (st === 'terverifikasi' && !window.confirm('Mengganti KTP akan memulai verifikasi baru. Selama menunggu, Anda tidak dapat membuat laporan. Lanjutkan?')) return
    setError('')
    setMsg('')
    setProgress(0)
    try {
      await uploadFile('/me/ktp', { file: file[0] }, setProgress)
      setFile([])
      setMsg('KTP terenkripsi dan diajukan untuk verifikasi.')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setProgress(null)
    }
  }

  if (!info) return error ? <Alert>{error}</Alert> : <Spinner />
  const v = info.verification
  const ex = EXPLAIN[v.status]
  const needUpload = ['belum', 'ditolak', 'verifikasi_ulang'].includes(v.status)

  return (
    <>
      <PageHeader title="Verifikasi KTP" subtitle="Identitas pelapor diverifikasi sekali sebelum dapat membuat laporan." action={<KycBadge status={v.status} />} />
      <div className="mb-4 space-y-2">
        <Alert>{error}</Alert>
        <Alert kind="success">{msg}</Alert>
        <Alert kind={ex.kind}>
          {ex.text}
          {v.status === 'terverifikasi' && (
            <> <Link to="/pelapor/lapor-baru" className="font-medium underline">Buat laporan</Link></>
          )}
        </Alert>
        {v.officer_note && (
          <Alert kind={v.status === 'ditolak' ? 'error' : 'warn'}>
            <span className="font-medium">Catatan petugas:</span> {v.officer_note}
          </Alert>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5">
          <h2 className="font-semibold">{needUpload ? 'Unggah KTP' : 'KTP Anda'}</h2>
          {info.exists && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{info.filename}</span>
              <span className="text-xs text-slate-500">{formatBytes(info.size)} · {formatDate(info.created_at)}</span>
              <button className="btn-secondary btn-sm" onClick={() => api.get(`/attachments/${info.id}/verify`).then(setCheck).catch((e) => setError(e.message))}>
                Cek 3 cipher
              </button>
              <button className="btn-secondary btn-sm" onClick={() => downloadFile(`/attachments/${info.id}/download`, info.filename).catch((e) => setError(e.message))}>
                Unduh
              </button>
            </div>
          )}
          <VerifyResult result={check} />
          <Field label={needUpload ? 'Scan atau foto KTP' : 'Ganti KTP'} hint="Pastikan seluruh kartu terlihat jelas dan NIK terbaca.">
            <FilePicker kind="ktp" files={file} onChange={setFile} multiple={false} onError={setError} />
          </Field>
          {progress != null && <ProgressBar value={progress} />}
          <button className="btn-primary" disabled={!file.length || progress != null} onClick={upload}>
            {needUpload ? 'Ajukan verifikasi' : 'Ganti & ajukan ulang'}
          </button>
          <p className="text-xs leading-relaxed text-slate-500">
            KTP dienkripsi dan hanya Anda yang dapat mengunduhnya. Petugas {OFFICER_UNIT} hanya dapat melihat pratinjaunya
            selama status <i>menunggu verifikasi</i> untuk mencocokkan nama dan NIK dengan data pendaftaran.
            Setelah diputuskan, akses petugas tertutup.
          </p>
        </section>

        <section className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">Riwayat verifikasi</h2>
            <KycHistory history={info.history} />
          </div>
          <div className="card p-5">
            <h2 className="mb-1 font-semibold">Petugas yang pernah membuka KTP Anda</h2>
            {info.views.length === 0 ? (
              <p className="text-sm text-slate-500">Belum pernah dibuka.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {info.views.map((w, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{w.officer}</span>
                    <span className="text-slate-500">{formatDate(w.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
