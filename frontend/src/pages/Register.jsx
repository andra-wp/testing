import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import AuthShell from '../components/AuthShell'
import { Alert, Field, LengthHint } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { OFFICER_UNIT } from '../lib/constants'

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
          <input className="input" required minLength={3} maxLength={100} value={form.full_name} onChange={set('full_name')} />
          <LengthHint value={form.full_name} min={3} max={100} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="NIK">
            <input
              className="input"
              inputMode="numeric"
              maxLength={16}
              required
              value={form.nik}
              onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, '') })}
            />
            <LengthHint value={form.nik} min={16} max={16} unit="digit" exact />
          </Field>
          <Field label="Nomor HP">
            <input className="input" inputMode="tel" placeholder="08xxxxxxxxxx" maxLength={16} required value={form.phone} onChange={set('phone')} />
            <LengthHint value={form.phone.replace(/[\s-]/g, '').replace(/^\+?62/, '0')} min={10} max={15} unit="digit" />
          </Field>
        </div>
        <Field label="Email">
          <input className="input" type="email" required value={form.email} onChange={set('email')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kata sandi">
            <input className="input" type="password" minLength={10} maxLength={64} required autoComplete="new-password" value={form.password} onChange={set('password')} />
            <LengthHint value={form.password} min={10} max={64} />
          </Field>
          <Field label="Ulangi kata sandi">
            <input className="input" type="password" required autoComplete="new-password" value={form.password2} onChange={set('password2')} />
            {form.password2 && (
              <p className={`mt-1 text-xs ${form.password2 === form.password ? 'text-emerald-700' : 'text-amber-700'}`}>
                {form.password2 === form.password ? 'Kata sandi sama ✓' : 'Belum sama dengan kata sandi'}
              </p>
            )}
          </Field>
        </div>
        <label className="flex gap-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <input type="checkbox" className="mt-0.5" checked={form.consent} onChange={set('consent')} required />
          <span>
            Saya menyetujui pemrosesan data pribadi saya (nama, NIK, nomor HP, email, scan KTP, dan bukti laporan) oleh
            {` ${OFFICER_UNIT} `}kampus untuk verifikasi dan penanganan laporan, sesuai UU No. 27 Tahun 2022. Saya dapat mengunduh atau
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
