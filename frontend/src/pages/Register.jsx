import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import AuthShell from '../components/AuthShell'
import { Alert, Field } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const EMPTY = { full_name: '', email: '', nik: '', phone: '', password: '', password2: '', consent: false }

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) return setError('Konfirmasi kata sandi tidak sama')
    if (!/^\d{16}$/.test(form.nik)) return setError('NIK harus 16 digit angka')
    setBusy(true)
    setError('')
    try {
      const { password2, ...body } = form
      await api.post('/auth/register', body)
      await login(form.email, form.password)
      navigate('/pelapor')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Daftar sebagai pelapor" subtitle="Data identitas dibutuhkan agar laporan bisa ditindaklanjuti.">
      <form onSubmit={submit} className="card space-y-4 p-6">
        <Alert>{error}</Alert>
        <Field label="Nama lengkap (sesuai KTP)">
          <input className="input" required value={form.full_name} onChange={set('full_name')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="NIK" hint="16 digit, dienkripsi">
            <input className="input" inputMode="numeric" maxLength={16} required value={form.nik} onChange={set('nik')} />
          </Field>
          <Field label="Nomor HP">
            <input className="input" inputMode="tel" placeholder="08xxxxxxxxxx" required value={form.phone} onChange={set('phone')} />
          </Field>
        </div>
        <Field label="Email">
          <input className="input" type="email" required value={form.email} onChange={set('email')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kata sandi" hint="10–64 karakter">
            <input className="input" type="password" minLength={10} maxLength={64} required autoComplete="new-password" value={form.password} onChange={set('password')} />
          </Field>
          <Field label="Ulangi kata sandi">
            <input className="input" type="password" required autoComplete="new-password" value={form.password2} onChange={set('password2')} />
          </Field>
        </div>
        <label className="flex gap-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <input type="checkbox" className="mt-0.5" checked={form.consent} onChange={set('consent')} required />
          <span>
            Saya menyetujui pemrosesan data pribadi saya (nama, NIK, nomor HP, email, scan KTP, dan bukti laporan) oleh
            CSIRT untuk verifikasi dan penanganan laporan, sesuai UU No. 27 Tahun 2022. Saya dapat mengunduh atau
            menghapus data saya kapan saja.
          </span>
        </label>
        <button className="btn-primary w-full" disabled={busy || !form.consent}>
          {busy ? 'Memproses…' : 'Daftar'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Masuk
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
