// App and handling-unit names shown in the UI; change here to rename everywhere
export const APP_NAME = 'Lapor Aman'
export const OFFICER_UNIT = 'Satgas'

// Must match CATEGORIES in backend/app/validators.py (the backend rejects unknown keys)
export const CATEGORIES = [
  { value: 'kekerasan_seksual', label: 'Kekerasan seksual', hint: 'Sentuhan, pemaksaan, atau perbuatan seksual tanpa persetujuan' },
  { value: 'pelecehan_seksual', label: 'Pelecehan seksual verbal/nonfisik', hint: 'Komentar, siulan, gestur, atau pesan bernada seksual' },
  { value: 'kbgo', label: 'Kekerasan berbasis gender online (KBGO)', hint: 'Penyebaran foto/video intim, sextortion, perekaman tanpa izin' },
  { value: 'perundungan', label: 'Perundungan (bullying)', hint: 'Ejekan, pengucilan, atau intimidasi yang berulang' },
  { value: 'perundungan_siber', label: 'Perundungan siber (cyberbullying)', hint: 'Hinaan, doxing, akun palsu, atau konten untuk mempermalukan' },
  { value: 'kekerasan_fisik', label: 'Kekerasan fisik', hint: 'Pemukulan, penganiayaan, atau perusakan barang milik korban' },
  { value: 'kekerasan_psikis', label: 'Kekerasan psikis', hint: 'Ancaman, pemerasan, atau perendahan martabat' },
  { value: 'lainnya', label: 'Lainnya', hint: 'Bentuk kekerasan lain di lingkungan kampus' },
]
export const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label ?? v

export const STATUS = {
  diterima: { label: 'Diterima', cls: 'bg-slate-100 text-slate-700 ring-slate-300' },
  diverifikasi: { label: 'Diverifikasi', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  ditindaklanjuti: { label: 'Ditindaklanjuti', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  selesai: { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  ditolak: { label: 'Ditolak', cls: 'bg-red-50 text-red-700 ring-red-200' },
}
export const STATUS_FLOW = ['diterima', 'diverifikasi', 'ditindaklanjuti', 'selesai']

export const CIPHERS = [
  { value: 'AES-256-GCM', short: 'AES', desc: 'AES-256, mode GCM (bawaan)' },
  { value: 'DES-CBC-HMAC', short: 'DES', desc: 'DES, mode CBC + HMAC-SHA256' },
  { value: 'RC4-HMAC', short: 'RC4', desc: 'RC4 (drop 3072) + HMAC-SHA256' },
]

export const FILE_RULES = {
  ktp: { accept: '.jpg,.jpeg,.png,.pdf', maxMb: 10, label: 'JPG, PNG, atau PDF, maks 10 MB' },
  dokumen: {
    accept: '.jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.txt,.eml',
    maxMb: 25,
    label: 'Gambar (JPG/PNG), PDF, Word, Excel, PowerPoint, TXT, atau EML, maks 25 MB',
  },
  video: { accept: '.mp4,.mov,.webm,.mkv', maxMb: 200, label: 'MP4, MOV, WEBM, atau MKV, maks 200 MB' },
}

export const KYC = {
  belum: { label: 'Belum mengunggah KTP', cls: 'bg-slate-100 text-slate-700 ring-slate-300' },
  menunggu: { label: 'Menunggu verifikasi', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  terverifikasi: { label: 'Terverifikasi', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  ditolak: { label: 'Ditolak', cls: 'bg-red-50 text-red-700 ring-red-200' },
  verifikasi_ulang: { label: 'Perlu verifikasi ulang', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
}
