import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, downloadFile, uploadFile } from '../../api/client'
import CipherSelect from '../../components/CipherSelect'
import EventTimeline from '../../components/EventTimeline'
import FilePicker from '../../components/FilePicker'
import VerifyResult from '../../components/VerifyResult'
import { OwnerAccessPanel, ShareToggle } from '../../components/access'
import { Alert, LengthHint, LockIcon, PageHeader, ProgressBar, Spinner, StatusBadge } from '../../components/ui'
import { STATUS, STATUS_FLOW } from '../../lib/constants'
import { formatBytes, formatDate, formatMs } from '../../lib/format'

function StatusSteps({ status }) {
  if (status === 'ditolak') return <Alert kind="error">Laporan ditolak oleh petugas. Lihat catatan di riwayat.</Alert>
  const idx = STATUS_FLOW.indexOf(status)
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STATUS_FLOW.map((s, i) => (
        <li key={s}>
          <div className={`h-1.5 rounded-full ${i <= idx ? 'bg-brand-600' : 'bg-slate-200'}`} />
          <div className={`mt-1 text-xs ${i <= idx ? 'font-medium text-brand-800' : 'text-slate-400'}`}>{STATUS[s].label}</div>
        </li>
      ))}
    </ol>
  )
}

export default function ReportDetail() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [cipher, setCipher] = useState('AES-256-GCM')
  const [msg, setMsg] = useState('')
  const [verify, setVerify] = useState({})
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')
  const [newDocs, setNewDocs] = useState([])
  const [newVideos, setNewVideos] = useState([])
  const [upProgress, setUpProgress] = useState(null)
  const [shareNew, setShareNew] = useState(true)

  const load = useCallback(() => api.get(`/reports/${id}`).then(setReport).catch((e) => setError(e.message)), [id])
  useEffect(() => {
    load()
  }, [load])

  const download = async (a) => {
    setBusy(a.id)
    setMsg('')
    setError('')
    try {
      const m = await downloadFile(`/attachments/${a.id}/download?cipher=${cipher}`, a.filename)
      setMsg(`${m.name} didekripsi dengan ${m.cipher} dalam ${formatMs(m.decryptMs)}, integritas: ${m.integrity}.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  const runVerify = async (a) => {
    setBusy(`v-${a.id}`)
    try {
      const r = await api.get(`/attachments/${a.id}/verify`)
      setVerify((v) => ({ ...v, [a.id]: r }))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  const sendNote = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/reports/${id}/notes`, { note })
      setNote('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const uploadMore = async () => {
    const queue = [...newDocs.map((f) => ['dokumen', f]), ...newVideos.map((f) => ['video', f])]
    setUpProgress(0)
    try {
      for (let i = 0; i < queue.length; i++) {
        const [kind, file] = queue[i]
        await uploadFile(`/reports/${id}/attachments`, { kind, file, share: String(shareNew) }, (v) => setUpProgress((i + v) / queue.length))
        // Drop each stored file at once, so a later failure cannot make a retry upload it twice
        const drop = kind === 'dokumen' ? setNewDocs : setNewVideos
        drop((list) => list.filter((f) => f !== file))
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setUpProgress(null)
      load() // show what was stored, even after a partial failure
    }
  }

  if (!report) return error ? <Alert>{error}</Alert> : <Spinner />
  const closed = ['selesai', 'ditolak'].includes(report.status)

  return (
    <>
      <Link to="/pelapor" className="text-sm text-brand-700 hover:underline">← Laporan saya</Link>
      <PageHeader
        title={report.title}
        subtitle={`${report.category_label} · dikirim ${formatDate(report.created_at)}`}
        action={<StatusBadge status={report.status} />}
      />
      <div className="space-y-2">
        <Alert>{error}</Alert>
        <Alert kind="success">{msg}</Alert>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <StatusSteps status={report.status} />
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-semibold text-slate-900">Isi laporan</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Tanggal kejadian</dt><dd>{formatDate(report.incident_date, false)}</dd></div>
              <div><dt className="text-slate-500">Tautan / lokasi kejadian</dt><dd className="break-all">{report.incident_url || '–'}</dd></div>
              <div><dt className="text-slate-500">Pelaku</dt><dd>{report.scammer_account || '–'}</dd></div>
            </dl>
            <div>
              <div className="text-sm text-slate-500">Kronologi</div>
              <p className="mt-1 text-sm whitespace-pre-wrap text-slate-800">{report.chronology}</p>
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-slate-900">Lampiran</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                Unduh dari salinan: <CipherSelect value={cipher} onChange={setCipher} />
              </div>
            </div>
            <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
              <LockIcon className="h-3.5 w-3.5" /> Setiap file disimpan tiga kali (AES, DES, RC4). Hanya Anda yang dapat mengunduhnya; petugas hanya bisa melihat file yang Anda izinkan.
            </p>
            {report.attachments.length === 0 && <p className="text-sm text-slate-500">Belum ada lampiran.</p>}
            <ul className="divide-y divide-slate-100">
              {report.attachments.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 capitalize">{a.kind}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{a.filename}</span>
                    <span className="text-xs text-slate-500">{formatBytes(a.size)}</span>
                    <button className="btn-secondary btn-sm" disabled={busy === `v-${a.id}`} onClick={() => runVerify(a)}>
                      {busy === `v-${a.id}` ? 'Memeriksa…' : 'Cek 3 cipher'}
                    </button>
                    <button className="btn-primary btn-sm" disabled={busy === a.id} onClick={() => download(a)}>
                      {busy === a.id ? 'Mendekripsi…' : 'Unduh'}
                    </button>
                  </div>
                  <OwnerAccessPanel attachment={a} closed={closed} onChanged={load} onError={setError} />
                  <VerifyResult result={verify[a.id]} />
                </li>
              ))}
            </ul>
            {!closed && (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-medium">Tambah bukti</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <FilePicker kind="dokumen" files={newDocs} onChange={setNewDocs} onError={setError} />
                  <FilePicker kind="video" files={newVideos} onChange={setNewVideos} onError={setError} />
                </div>
                <ShareToggle checked={shareNew} onChange={setShareNew} />
                {upProgress != null && <ProgressBar value={upProgress} />}
                <button className="btn-primary btn-sm" disabled={upProgress != null || newDocs.length + newVideos.length === 0} onClick={uploadMore}>
                  {upProgress != null ? 'Mengunggah & mengenkripsi…' : 'Unggah'}
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-5">
          <h2 className="font-semibold text-slate-900">Riwayat & pesan</h2>
          <EventTimeline events={report.events} />
          {!closed && (
            <form onSubmit={sendNote} className="space-y-2 border-t border-slate-100 pt-4">
              <textarea className="input min-h-20" placeholder="Balas atau tambahkan informasi untuk petugas…" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
              <LengthHint value={note} min={1} max={2000} />
              <button className="btn-primary btn-sm" disabled={!note.trim()}>Kirim pesan</button>
            </form>
          )}
        </aside>
      </div>
    </>
  )
}
