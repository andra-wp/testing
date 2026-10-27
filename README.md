# Lapor Siber — Portal Pelaporan Phishing & Insiden Siber

Portal untuk **CSIRT sebuah instansi/kampus**. Korban atau saksi phishing, penipuan online, dan peretasan
akun mengirim laporan beserta bukti. Petugas CSIRT memverifikasi dan menindaklanjuti laporan tersebut.

Bukti laporan hampir selalu memuat data korban: mutasi rekening, foto KTP yang sudah dikirim ke penipu,
rekaman layar percakapan. Jika bocor, data ini bisa dipakai untuk penipuan lanjutan. Karena itu semua data
pengguna dienkripsi sebelum disimpan, dan hanya pemiliknya yang bisa mengambilnya kembali secara utuh.

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** FastAPI + Uvicorn, pycryptodome
- **Database:** SQLite (modul `sqlite3` bawaan Python)
- Dijalankan secara lokal

---

## Menjalankan

Prasyarat: Python 3.11+ dan Node.js 20+.

**1. Backend** (terminal pertama)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt

python -m scripts.init_env                     # buat .env (kunci acak) + database
python -m scripts.create_officer --email petugas@csirt.local --name "Petugas Satu"
uvicorn app.main:app --reload --port 8000
```

Dokumentasi API otomatis: http://localhost:8000/docs

**2. Frontend** (terminal kedua)

```bash
cd frontend
npm install
npm run dev
```

Buka http://localhost:5173. Daftar sebagai pelapor lewat halaman *Daftar*. Akun petugas hanya dibuat
lewat skrip di atas, tidak bisa mendaftar dari web.

> `.env` berisi MASTER_KEY. Jika file ini hilang, semua data terenkripsi tidak bisa dibuka lagi.
> Jangan di-commit (sudah ada di `.gitignore`).

**3. Tes & benchmark**

```bash
cd backend
python -m pytest -q                        # 59 tes: kripto, kontrol akses, izin petugas, verifikasi KTP, integritas
python -m benchmark.run_benchmark --pin    # ±3 menit, hasil di benchmark/results/
python -m benchmark.run_benchmark --quick  # versi cepat
```

---

## Struktur proyek

```
lapor-siber/
├── backend/
│   ├── app/
│   │   ├── main.py              # aplikasi FastAPI, CORS, error handler integritas
│   │   ├── config.py            # baca .env (kunci, path)
│   │   ├── db.py, schema.sql    # SQLite: hanya metadata + tabel encrypted_items
│   │   ├── security.py          # bcrypt, JWT, blind index email, cek peran
│   │   ├── validators.py        # NIK, HP, kategori, aturan file + magic bytes, masking
│   │   ├── audit.py             # audit log akses data
│   │   ├── crypto/
│   │   │   ├── suites.py        # AES-256-GCM, DES-CBC-HMAC, RC4-HMAC (streaming)
│   │   │   ├── keywrap.py       # envelope encryption dengan MASTER_KEY
│   │   │   └── vault.py         # simpan 3 salinan, dekripsi + verifikasi, crypto-shredding
│   │   ├── services/            # lampiran, laporan, izin akses (access.py), pratinjau (preview.py), verifikasi KTP (kyc.py)
│   │   └── routers/
│   │       ├── auth.py          # daftar, masuk, /me
│   │       ├── me.py            # profil, KTP, ekspor data, hapus akun
│   │       ├── reports.py       # laporan milik pelapor
│   │       ├── attachments.py   # unduh (pemilik saja), cek 3 cipher, kelola izin petugas
│   │       ├── officer.py       # antrian, kasus, status, minta akses, pratinjau, statistik, audit
│   │       └── verifications.py # verifikasi KTP oleh petugas
│   ├── scripts/                 # init_env, create_officer
│   ├── benchmark/
│   │   ├── run_benchmark.py     # evaluasi AES vs DES vs RC4
│   │   └── results/             # summary.md (dengan interpretasi), CSV, JSON, grafik
│   └── tests/
└── frontend/
    ├── vite.config.js           # proxy /api → localhost:8000
    └── src/
        ├── api/client.js        # fetch + token, unggah dengan progres, unduh blob
        ├── context/            # AuthContext, ThemeContext (Terang/Gelap/Ikuti sistem)
        ├── components/          # Layout, FilePicker, SecureViewer, ThemeToggle, access.jsx (izin), ui.jsx (LengthHint), dll.
        └── pages/
            ├── Login.jsx, Register.jsx
            ├── pelapor/         # Dashboard, NewReport (wizard), ReportDetail, Verification, Profile
            └── petugas/         # Queue, CaseDetail, VerifyQueue, VerifyDetail, Stats, AuditLog
```

---

## Data yang disimpan dan klasifikasinya

Dasar: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) dan GDPR.

| Data | Contoh | Kategori | Perlakuan |
|---|---|---|---|
| Nama, NIK, nomor HP, email | identitas pelapor | Data pribadi umum (UU PDP Pasal 4 ayat 3; GDPR Pasal 4(1)) | Dienkripsi. Petugas melihat versi tersamar |
| Scan KTP | foto, NIK, alamat, tanggal lahir | Data pribadi umum yang sangat mudah disalahgunakan | Dienkripsi, hanya pemilik yang bisa mengunduh. Dipakai untuk verifikasi identitas pelapor |
| Dokumen kantor | mutasi rekening, invoice palsu, email (.eml) | Sering memuat **data keuangan pribadi = data pribadi spesifik** (Pasal 4 ayat 2) | Dienkripsi, hanya pemilik yang bisa mengunduh |
| Video | rekaman layar chat, video call penipu | Wajah dan suara korban (data pribadi) | Dienkripsi, hanya pemilik yang bisa mengunduh |
| Judul, kronologi, URL, akun pelaku | isi laporan | Dapat memuat data pribadi korban | Dienkripsi; dibaca petugas atas persetujuan pelapor, setiap akses tercatat |
| Nama file lampiran, catatan/pesan | `mutasi-budi.pdf` | Dapat memuat data pribadi | Dienkripsi |
| ID, status, kategori, waktu, ukuran file | metadata sistem | Bukan data pribadi | Teks biasa (dibutuhkan untuk antrian & statistik) |

Prinsip UU PDP yang diterapkan:

- **Persetujuan** (Pasal 20): dicatat saat daftar dan saat mengirim laporan.
- **Minimisasi & pembatasan tujuan**: petugas hanya melihat yang dibutuhkan untuk menangani kasus; identitas tersamar, file tidak bisa dibuka.
- **Hak akses & portabilitas**: halaman *Data Saya* → unduh semua data dalam JSON.
- **Hak penghapusan**: hapus akun menghapus kunci dan ciphertext (*crypto-shredding*).
- **Keamanan pemrosesan** (Pasal 35) & akuntabilitas: enkripsi, kontrol akses, audit log tanpa data pribadi.

---

## Desain kriptografi

Setiap data disimpan **tiga kali**, masing-masing dengan cipher berbeda:

| Skema | Cipher | Mode / konstruksi | Integritas | Alasan |
|---|---|---|---|---|
| `AES-256-GCM` | AES, kunci 256 bit | GCM, nonce acak 96 bit | tag GCM 128 bit | AEAD: kerahasiaan + integritas sekaligus, dipercepat AES-NI |
| `DES-CBC-HMAC` | DES, kunci 56 bit | CBC, IV acak, padding PKCS#7 | HMAC-SHA256 (Encrypt-then-MAC) | CBC tidak menjamin integritas, jadi ditambah MAC |
| `RC4-HMAC` | RC4, kunci 128 bit | stream, buang 3072 byte awal keystream | HMAC-SHA256 (Encrypt-then-MAC) | RC4 *malleable* dan awal keystream-nya bias |

**ECB tidak dipakai**: blok plaintext yang sama menghasilkan blok ciphertext yang sama, sehingga pola data
(misalnya struktur file) terlihat. Tes `test_same_plaintext_different_ciphertext` membuktikan hal ini tidak terjadi.

**Manajemen kunci (envelope encryption).** Setiap item × cipher mendapat kunci acak baru. Kunci itu dibungkus
`MASTER_KEY` dengan AES-256-GCM dan disimpan di samping ciphertext. Dengan begitu, nonce/IV/kunci RC4 tidak
pernah dipakai ulang, risiko Sweet32 pada DES hilang, dan penghapusan akun cukup dengan menghapus kunci terbungkus.

**Pengikatan konteks.** Pemilik, jenis objek, ID, nama field, dan cipher dipakai sebagai AAD/isi MAC.
Ciphertext atau kunci yang dipindahkan ke baris/pengguna lain akan gagal diverifikasi.

**Data kembali utuh.** Saat disimpan, HMAC dari plaintext asli (dengan `INTEGRITY_KEY`) dicatat. Saat diambil:
buka kunci → verifikasi tag/HMAC ciphertext → dekripsi → bandingkan HMAC plaintext. File hanya dikirim jika
semuanya cocok; kalau tidak, server menjawab error dan tidak mengirim apa pun. Tombol **Cek 3 cipher** di
halaman laporan mendekripsi ketiga salinan dan menunjukkan bahwa semuanya identik dengan aslinya.

**Lain-lain.** Kata sandi di-hash bcrypt. Email disimpan sebagai *blind index* (HMAC) untuk login, dan email
aslinya dienkripsi. File besar dienkripsi per potongan 1 MiB sehingga video 200 MB tidak dimuat utuh ke memori.
Jenis file dicek dari *magic bytes*, bukan hanya ekstensinya.

## Siapa boleh melihat apa

| | Pelapor (pemilik) | Pelapor lain | Petugas | Tanpa login |
|---|---|---|---|---|
| Profil lengkap (nama, NIK, HP, email) | ✓ | – | tersamar | – |
| Isi laporan (kronologi, URL, akun pelaku) | ✓ | – | ✓ (tercatat di audit) | – |
| Unduh berkas asli (KTP, dokumen, video) | ✓ | – | – | – |
| Lihat dokumen & video bukti | ✓ | – | hanya pratinjau, **jika diizinkan pelapor** | – |
| Scan KTP | ✓ | – | pratinjau **hanya saat menunggu verifikasi** | – |
| Ubah status kasus | – | – | ✓ | – |

Lampiran milik orang lain menghasilkan 404, sehingga keberadaan file tidak terungkap.

### Verifikasi KTP

Pelapor wajib lolos verifikasi KTP **sekali** sebelum dapat membuat laporan. Tujuannya mencegah laporan
palsu (misalnya melaporkan rekening orang lain) dan memastikan pelapor adalah korban, karena bank dan
kepolisian umumnya mensyaratkan identitas korban yang jelas. Setelah terverifikasi, laporan berikutnya
tidak perlu KTP lagi.

| Status | Arti | Bisa membuat laporan? | Petugas bisa membuka KTP? |
|---|---|---|---|
| `belum` | belum mengunggah KTP | tidak | tidak |
| `menunggu` | KTP diunggah atau diunggah ulang | tidak | **ya, hanya di status ini** |
| `terverifikasi` | cocok dengan data pendaftaran | ya | tidak (akses tertutup) |
| `ditolak` | buram atau tidak cocok; catatan wajib | tidak | tidak, sampai pelapor mengunggah ulang |
| `verifikasi_ulang` | petugas menemukan dugaan masalah; alasan wajib | **tidak (ditutup sementara)** | tidak, sampai pelapor mengunggah ulang |

- Verifikasi dilakukan oleh petugas biasa (halaman *Verifikasi KTP*). Selama `menunggu`, petugas melihat
  pratinjau KTP (viewer bertanda air, tanpa unduh) dan nama serta NIK pendaftaran yang utuh untuk dicocokkan.
  Setelah keputusan, keduanya tertutup otomatis.
- Dugaan masalah bisa dilaporkan dari halaman verifikasi atau dari tautan di halaman kasus. Pelapor harus
  mengunggah ulang KTP. Akses petugas terbuka lagi hanya untuk KTP baru itu. Laporan lama tetap berjalan.
- Setiap keputusan diikat ke versi file lewat HMAC plaintext. Mengganti KTP, termasuk KTP yang sudah
  terverifikasi, selalu memulai verifikasi baru.
- Pelapor melihat status, catatan petugas, riwayat keputusan, dan daftar petugas yang pernah membuka KTP-nya.
- Endpoint: `/api/me/ktp` (pelapor), `/api/officer/verifications` (antrian),
  `/api/officer/verifications/{user_id}` (detail), `.../ktp` (pratinjau), `.../decision`, `.../flag`.
  Tabel: `ktp_verifications` (status terkini) dan `ktp_events` (riwayat, catatan terenkripsi).

### Izin akses lampiran untuk petugas

Secara bawaan hanya pemilik yang bisa mengambil datanya. Petugas mendapat akses hanya lewat
**pendelegasian dari pemilik** yang spesifik, per file, dan bisa dicabut.

1. **Saat mengirim laporan**, setiap dokumen dan video punya pilihan *"Izinkan petugas melihat file ini"*
   (aktif secara bawaan, bisa dimatikan). Teks persetujuan menyebut siapa yang melihat, untuk apa,
   sampai kapan, dan bahwa izin bisa dicabut. Scan KTP tidak punya pilihan ini.
2. **Ruang lingkup:** izin berlaku untuk **semua petugas**, hanya selama laporan belum ditutup
   (status *selesai* atau *ditolak* menutup akses otomatis).
3. **Pelapor tetap memegang kendali:** di halaman laporan, setiap file punya panel *Akses petugas*
   untuk mengizinkan atau mencabut izin, beserta riwayat siapa yang membuka file dan kapan.
4. **Permintaan akses:** untuk file yang belum diizinkan, petugas menekan *Minta akses* dengan alasan
   wajib diisi (minimal 10 karakter). Pelapor melihat nama petugas dan alasannya, lalu memilih *Setujui*
   atau *Tolak*. Permintaan dan keputusan juga masuk ke riwayat laporan.
5. **Cara petugas melihat:** viewer di browser, tanpa tombol unduh, dengan tanda air nama petugas dan
   waktu. PDF, gambar, teks, dan video ditampilkan langsung. Dokumen .docx/.xlsx/.pptx/.odt ditampilkan
   sebagai teks hasil ekstraksi di server, sehingga berkas aslinya tidak pernah keluar. Format lama
   (.doc/.xls/.ppt) tidak bisa dipratinjau; petugas diminta meminta versi PDF.
6. Server tetap mendekripsi dari salinan AES dengan verifikasi integritas penuh, dan setiap pembukaan
   (serta penolakan) tercatat di audit log.

Viewer tanpa tombol unduh bukan perlindungan mutlak, karena layar tetap bisa difoto. Perlindungan yang
sebenarnya adalah izin per file, batas waktu, dan jejak audit yang terlihat oleh pelapor.

Endpoint terkait: `PUT /api/attachments/{id}/access` (pelapor: `grant`/`deny`/`revoke`),
`POST /api/officer/attachments/{id}/request-access`, `GET /api/officer/attachments/{id}/preview`.
Tabel: `access_grants` (satu baris per lampiran, status terkini).

---

## Evaluasi AES vs DES vs RC4

Lihat **`backend/benchmark/results/summary.md`** untuk tabel lengkap beserta interpretasinya. Ringkasan dari mesin uji:

| | AES-256-GCM | DES-CBC-HMAC | RC4-HMAC |
|---|---|---|---|
| Throughput video 64 MB | ±770 MB/s | ±19 MB/s | ±160 MB/s |
| Video 200 MB (enkripsi) | ±0,3 s | ±10,5 s | ±1,2 s |
| NIK 16 byte | ±120 µs | ±90 µs | ±90 µs |
| Manipulasi bit terdeteksi | 100% | 100% | 100% (tanpa HMAC: 0%) |
| Kelemahan terukur | – | kunci 56 bit, blok 64 bit | bias keystream (drop=0: 1,9× peluang acak) |

Apa yang diukur dan mengapa:

1. **Waktu per jenis data dalam skenario** (NIK, kronologi, scan KTP, dokumen, video) memakai skema yang persis sama dengan aplikasi → berapa lama pengguna menunggu.
2. **Primitif murni vs HMAC** → memisahkan biaya cipher dari biaya integritas.
3. **Biaya tetap per item** → menjelaskan mengapa urutan cipher berbeda untuk data kecil.
4. **Uji manipulasi**: bit-flip acak dan serangan terarah (mengubah nominal kerugian), dengan dan tanpa MAC.
5. **Kelemahan nyata**: bias RC4 (uji statistik), laju brute-force DES, batas birthday blok 64 bit.

Agar hasilnya dapat dipercaya: data acak, potongan disiapkan di luar pengukuran, pemanasan, GC dimatikan,
pengulangan agar tiap sampel ≥ 20 ms, banyak sampel, dilaporkan median + kuartil + CV, dan opsi `--pin` ke 1 core.
Halaman **Statistik** petugas juga menampilkan throughput dari unggahan sungguhan sebagai pembanding.

**Kesimpulan untuk skenario ini:** AES-256-GCM dipakai sebagai salinan utama untuk semua akses. DES dan RC4
disimpan untuk memenuhi tugas dan sebagai pembanding. Konsekuensinya perlu dicatat: tiga salinan berarti
disk 3×, waktu proses unggahan menjadi jumlah ketiganya (didominasi DES), dan kerahasiaan data hanya sekuat
salinan terlemah (DES 56 bit). Di sistem nyata hanya AES yang seharusnya disimpan.

## Tampilan

- **Mode gelap:** tombol di kanan atas (Terang / Gelap / Ikuti sistem), tersimpan di browser dan dipasang
  sebelum halaman dirender agar tidak berkedip. Implementasinya memetakan ulang variabel warna Tailwind v4
  di `src/index.css` (class `.dark` pada `<html>`), sehingga komponen tidak perlu ditulis dua kali.
- **Info panjang input:** setiap isian yang punya batas menampilkan minimal/maksimal dan jumlah karakter
  secara langsung (komponen `LengthHint`). Batasnya sama dengan validasi backend, misalnya judul 5–120,
  kronologi 20–5000, kata sandi 10–64, NIK tepat 16 digit, dan alasan permintaan akses minimal 10.

## Batasan (proyek lokal)

- MASTER_KEY ada di `.env`. Di produksi seharusnya disimpan di KMS/HSM.
- Belum ada rate limiting login, HTTPS, atau antivirus untuk file yang diunggah.
- Pendaftaran membalas "email sudah terdaftar", yang memungkinkan enumerasi email.
