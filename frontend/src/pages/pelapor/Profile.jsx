import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, downloadFile } from '../../api/client'
import CipherSelect from '../../components/CipherSelect'
import { Alert, KycBadge, PageHeader, Spinner } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { formatMs } from '../../lib/format'

export default function Profile() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [cipher, setCipher] = useState('AES-256-GCM')
  const [profile, setProfile] = useState(null)
  const [kyc, setKyc] = useState(null)
  const [error, setError] = useState('')
  const [delPass, setDelPass] = useState('')

  useEffect(() => {
    api.get(`/me/profile?cipher=${cipher}`).then(setProfile).catch((e) => setError(e.message))
  }, [cipher])
  useEffect(() => {
    api.get('/me/ktp').then((k) => setKyc(k.verification)).catch((e) => setError(e.message))
  }, [])

  const act = async (fn) => {
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e.message)
    }
  }

  const deleteAccount = () =>
    act(async () => {
      if (!window.confirm('Semua laporan, lampiran, KTP, dan data pribadi Anda akan dihapus permanen. Lanjutkan?')) return
      await api.del('/me', { password: delPass })
      logout()
      navigate('/login')
    })

  return (
    <>
      <PageHeader title="Data Saya" subtitle="Lihat, unduh, atau hapus data pribadi Anda (hak subjek data UU PDP)." />
      <div className="mb-4">
        <Alert>{error}</Alert>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Identitas</h2>
            <CipherSelect value={cipher} onChange={setCipher} />
          </div>
          {!profile ? (
            <Spinner />
          ) : (
            <>
              <dl className="space-y-3 text-sm">
                {[['Nama', 'full_name'], ['NIK', 'nik'], ['Nomor HP', 'phone'], ['Email', 'email']].map(([l, k]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">{l}</dt>
                    <dd className="font-medium">{profile.data[k]}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                Didekripsi dari salinan {profile.cipher} dalam {formatMs(profile.decrypt_ms)}, integritas terverifikasi.
              </p>
            </>
          )}
        </section>

        <section className="card space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Verifikasi KTP</h2>
            {kyc && <KycBadge status={kyc.status} />}
          </div>
          <p className="text-sm text-slate-500">
            Scan KTP, riwayat verifikasi, dan daftar petugas yang pernah membukanya ada di halaman verifikasi.
          </p>
          <Link to="/pelapor/verifikasi" className="btn-secondary btn-sm">Buka halaman verifikasi</Link>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="font-semibold">Unduh semua data saya</h2>
          <p className="text-sm text-slate-500">Profil, status verifikasi, isi laporan, riwayat, dan daftar lampiran dalam satu file JSON.</p>
          <button className="btn-secondary btn-sm" onClick={() => act(() => downloadFile('/me/export', 'data-saya.json'))}>
            Unduh JSON
          </button>
        </section>

        <section className="card space-y-3 border-red-200 p-5">
          <h2 className="font-semibold text-red-700">Hapus akun</h2>
          <p className="text-sm text-slate-500">
            Kunci enkripsi dan semua ciphertext Anda dihapus, sehingga data tidak dapat dipulihkan siapa pun.
          </p>
          <input className="input" type="password" placeholder="Kata sandi untuk konfirmasi" value={delPass} onChange={(e) => setDelPass(e.target.value)} />
          <button className="btn-danger btn-sm" disabled={!delPass} onClick={deleteAccount}>
            Hapus akun permanen
          </button>
        </section>
      </div>
    </>
  )
}
