import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, uploadFile } from '../../api/client'
import FilePicker from '../../components/FilePicker'
import { ShareToggle } from '../../components/access'
import { Alert, Field, KycBadge, LengthHint, PageHeader, ProgressBar, Spinner } from '../../components/ui'
import { CATEGORIES, OFFICER_UNIT, categoryLabel } from '../../lib/constants'

const STEPS = ['Jenis kejadian', 'Kronologi', 'Bukti', 'Kirim']

// Local date as YYYY-MM-DD (toISOString() is UTC, which is still "yesterday" before 07:00 WIB)
function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function NewReport() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    category: '', incident_date: '', title: '', chronology: '', incident_url: '', scammer_account: '', consent: false,
  })
  const [docs, setDocs] = useState([])
  const [videos, setVideos] = useState([])
  const [notShared, setNotShared] = useState(() => new Set()) // file yang TIDAK diizinkan untuk petugas
  const [kyc, setKyc] = useState(null) // status verifikasi KTP
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(null) // [{name, value, status}]
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const shareExtra = (f) => (
    <ShareToggle
      checked={!notShared.has(f)}
      onChange={(on) =>
        setNotShared((prev) => {
          const next = new Set(prev)
          on ? next.delete(f) : next.add(f)
          return next
        })
      }
    />
  )
  const evidence = [...docs, ...videos]
  const sharedCount = evidence.filter((f) => !notShared.has(f)).length

  useEffect(() => {
    api.get('/me/ktp').then((k) => setKyc(k.verification)).catch((e) => setError(e.message))
  }, [])

  const canNext = [
    () => form.category,
    () => form.title.trim().length >= 5 && form.chronology.trim().length >= 20,
    () => true,
    () => form.consent,
  ][step]()

  const submit = async () => {
    setError('')
    const queue = [
      ...docs.map((f) => ({ f, kind: 'dokumen' })),
      ...videos.map((f) => ({ f, kind: 'video' })),
    ]
    setProgress(queue.map(({ f, kind }) => ({ name: f.name, kind, value: 0, status: 'menunggu' })))
    const update = (i, patch) => setProgress((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)))

    let reportId
    try {
      const body = { ...form, incident_date: form.incident_date || null, incident_url: form.incident_url || null, scammer_account: form.scammer_account || null }
      reportId = (await api.post('/reports', body)).id
    } catch (e) {
      setProgress(null)
      return setError(e.message)
    }
    let failed = 0
    for (let i = 0; i < queue.length; i++) {
      const { f, kind } = queue[i]
      update(i, { status: 'mengunggah' })
      try {
        await uploadFile(`/reports/${reportId}/attachments`, { kind, file: f, share: String(!notShared.has(f)) }, (v) => update(i, { value: v, status: v >= 1 ? 'mengenkripsi' : 'mengunggah' }))
        update(i, { value: 1, status: 'tersimpan' })
      } catch (e) {
        failed++
        update(i, { status: `gagal: ${e.message}` })
      }
    }
    if (failed === 0) navigate(`/pelapor/laporan/${reportId}`)
    else setError(`Laporan terkirim, tetapi ${failed} file gagal diunggah. Anda bisa menambahkannya dari halaman laporan.`)
    setForm((f) => ({ ...f, _doneId: reportId }))
  }

  if (!kyc) return error ? <Alert>{error}</Alert> : <Spinner />
  if (!kyc.can_create_report) {
    return (
      <>
        <PageHeader title="Buat Laporan" />
        <div className="card mx-auto max-w-xl space-y-4 p-8 text-center">
          <KycBadge status={kyc.status} />
          <h2 className="text-lg font-semibold text-slate-900">
            {kyc.status === 'verifikasi_ulang' ? 'Pembuatan laporan ditutup sementara' : 'Verifikasi KTP diperlukan'}
          </h2>
          <p className="text-sm text-slate-600">
            {{
              belum: 'Sebelum membuat laporan, unggah KTP Anda untuk diverifikasi petugas. Cukup sekali; laporan berikutnya tidak perlu KTP lagi.',
              menunggu: 'KTP Anda sedang diverifikasi petugas. Anda dapat membuat laporan setelah terverifikasi.',
              ditolak: 'Verifikasi KTP ditolak. Unggah ulang KTP sesuai catatan petugas.',
              verifikasi_ulang: 'Petugas meminta verifikasi ulang identitas Anda. Unggah ulang KTP untuk membuka kembali pembuatan laporan.',
            }[kyc.status]}
          </p>
          {kyc.officer_note && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Catatan petugas: {kyc.officer_note}</p>}
          <Link to="/pelapor/verifikasi" className="btn-primary">
            {kyc.status === 'menunggu' ? 'Lihat status verifikasi' : 'Ke halaman verifikasi KTP'}
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Buat Laporan" subtitle="Isi selengkap mungkin. Semua data dienkripsi sebelum disimpan." />
      <ol className="mb-6 flex flex-wrap gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`rounded-full px-3 py-1 font-medium ${
              i === step ? 'bg-brand-solid text-white' : i < step ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="card space-y-5 p-6">
        <Alert>{error}</Alert>

        {step === 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((c) => (
                <label
                  key={c.value}
                  className={`cursor-pointer rounded-lg border p-3 ${
                    form.category === c.value ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" name="category" value={c.value} className="sr-only" checked={form.category === c.value} onChange={set('category')} />
                  <div className="text-sm font-medium text-slate-800">{c.label}</div>
                  <div className="text-xs text-slate-500">{c.hint}</div>
                </label>
              ))}
            </div>
            <Field label="Tanggal kejadian (opsional)">
              <input type="date" className="input max-w-xs" max={localToday()} value={form.incident_date} onChange={set('incident_date')} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Alert kind="info">
              Tulis sebatas yang Anda nyaman. Anda tidak wajib menceritakan detail yang membuat Anda tidak nyaman, dan
              informasi bisa ditambahkan nanti lewat pesan kepada petugas.
            </Alert>
            <Field label="Judul singkat">
              <input className="input" maxLength={120} placeholder="Contoh: Pesan bernada seksual dari senior di grup kelas" value={form.title} onChange={set('title')} />
              <LengthHint value={form.title} min={5} max={120} />
            </Field>
            <Field label="Kronologi">
              <textarea className="input min-h-40" maxLength={5000} placeholder="Apa yang terjadi, kapan, di mana, dan siapa yang terlibat." value={form.chronology} onChange={set('chronology')} />
              <LengthHint value={form.chronology} min={20} max={5000} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tautan unggahan / lokasi kejadian (opsional)">
                <input className="input" maxLength={2048} placeholder="https://instagram.com/p/… atau Gedung C lt. 2" value={form.incident_url} onChange={set('incident_url')} />
                <LengthHint value={form.incident_url} max={2048} />
              </Field>
              <Field label="Pelaku (opsional)">
                <input className="input" maxLength={200} placeholder="Nama, NIM, atau akun media sosial" value={form.scammer_account} onChange={set('scammer_account')} />
                <LengthHint value={form.scammer_account} max={200} />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Dokumen bukti" hint="Tangkapan layar percakapan, kronologi tertulis, surat keterangan medis/visum, dll.">
              <FilePicker kind="dokumen" files={docs} onChange={setDocs} onError={setError} extra={shareExtra} />
            </Field>
            <Field label="Video bukti" hint="Rekaman kejadian, atau rekaman layar percakapan/unggahan.">
              <FilePicker kind="video" files={videos} onChange={setVideos} onError={setError} extra={shareExtra} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Jenis</dt><dd className="font-medium">{categoryLabel(form.category)}</dd></div>
              <div><dt className="text-slate-500">Judul</dt><dd className="font-medium">{form.title}</dd></div>
              <div><dt className="text-slate-500">Dokumen</dt><dd>{docs.length} file</dd></div>
              <div><dt className="text-slate-500">Video</dt><dd>{videos.length} file</dd></div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Akses petugas ke bukti</dt>
                <dd>
                  {evidence.length === 0
                    ? 'Tidak ada bukti'
                    : `${sharedCount} dari ${evidence.length} file boleh dilihat petugas` +
                      (sharedCount < evidence.length ? '; sisanya hanya bisa dilihat bila Anda menyetujui permintaan petugas.' : '.')}
                  {' '}Scan KTP tidak ikut dibagikan.
                </dd>
              </div>
            </dl>
            <label className="flex gap-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              <input type="checkbox" className="mt-0.5" checked={form.consent} onChange={set('consent')} />
              <span>
                Saya menyetujui isi laporan (kronologi, tautan/lokasi, dan identitas pelaku) dibaca petugas {OFFICER_UNIT} untuk penanganan.
                Identitas saya ditampilkan tersamar kepada petugas. File yang saya izinkan dapat dilihat petugas
                (tanpa diunduh) sampai laporan ditutup, dan izin itu dapat saya cabut kapan saja.
              </span>
            </label>
            {progress && (
              <ul className="space-y-3">
                {progress.map((p, i) => (
                  <li key={i} className="text-sm">
                    <div className="mb-1 flex justify-between gap-2">
                      <span className="truncate">{p.name}</span>
                      <span className={`shrink-0 text-xs ${p.status.startsWith('gagal') ? 'text-red-600' : 'text-slate-500'}`}>{p.status}</span>
                    </div>
                    <ProgressBar value={p.value} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="flex justify-between border-t border-slate-100 pt-4">
          <button className="btn-secondary" disabled={step === 0 || progress} onClick={() => setStep(step - 1)}>
            Kembali
          </button>
          {form._doneId ? (
            <Link className="btn-primary" to={`/pelapor/laporan/${form._doneId}`}>Lihat laporan</Link>
          ) : step < STEPS.length - 1 ? (
            <button className="btn-primary" disabled={!canNext} onClick={() => { setError(''); setStep(step + 1) }}>
              Lanjut
            </button>
          ) : (
            <button className="btn-primary" disabled={!canNext || progress} onClick={submit}>
              {progress ? 'Mengirim…' : 'Kirim laporan'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
