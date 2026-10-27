export const CATEGORIES = [
  { value: 'phishing_email', label: 'Phishing lewat email', hint: 'Email palsu yang meminta login, data, atau pembayaran' },
  { value: 'phishing_sms', label: 'Phishing lewat SMS/WhatsApp', hint: 'Pesan berisi tautan, file APK, atau permintaan OTP' },
  { value: 'phishing_web', label: 'Situs palsu', hint: 'Situs yang meniru bank, marketplace, atau instansi' },
  { value: 'penipuan_online', label: 'Penipuan transaksi online', hint: 'Barang tidak dikirim, investasi bodong, dll.' },
  { value: 'peretasan_akun', label: 'Peretasan akun', hint: 'Akun email, media sosial, atau bank diambil alih' },
  { value: 'malware', label: 'Malware / ransomware', hint: 'Perangkat terinfeksi atau file dikunci' },
  { value: 'lainnya', label: 'Lainnya', hint: 'Insiden siber lain' },
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
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.txt,.eml',
    maxMb: 25,
    label: 'PDF, Word, Excel, PowerPoint, TXT, atau EML, maks 25 MB',
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
