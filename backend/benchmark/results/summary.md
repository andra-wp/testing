# Hasil Benchmark AES vs DES vs RC4 — Lapor Siber

Mesin: x86_64 (2 core), akselerasi AES perangkat keras: True, Python 3.13.17, pycryptodome 4.2.0, Linux-6.18.44-fc-v165-x86_64-with-glibc2.39. Waktu: 2026-10-27T17:49:01.

Angka absolut hanya berlaku untuk mesin ini. Yang dibandingkan adalah **rasio antar cipher** dan **apakah selisihnya terasa oleh pengguna**.

## 1. Waktu per jenis data (skema persis seperti di aplikasi)

Per cipher: buat kunci acak → enkripsi per potongan 1 MiB → tag/HMAC → bungkus kunci. Dekripsi: buka kunci → verifikasi tag/HMAC → dekripsi. Median (kuartil 1–3 dalam kurung). Baris *HMAC plaintext* adalah cek keutuhan end-to-end yang dihitung sekali per unggahan dan sekali per unduhan, sama untuk semua cipher.

| Data | Ukuran | Skema | Enkripsi | Dekripsi | MB/s enk | MB/s dek | CV | Overhead simpan |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| NIK (field) | 16 B | AES | 122.0 µs (118.4 µs–132.4 µs) | 121.3 µs | – | – | 18.1% | 88 B |
| NIK (field) | 16 B | DES | 93.8 µs (91.2 µs–101.7 µs) | 98.0 µs | – | – | 8.1% | 116 B |
| NIK (field) | 16 B | RC4 | 91.2 µs (88.6 µs–95.5 µs) | 90.4 µs | – | – | 7.0% | 108 B |
| NIK (field) | 16 B | HMAC plaintext (sekali) | 2.7 µs (2.7 µs–2.8 µs) | (sama) | – | – | 9.8% | 32 B |
| Kronologi laporan | 2 KB | AES | 123.6 µs (122.5 µs–127.3 µs) | 124.9 µs | – | – | 11.3% | 88 B |
| Kronologi laporan | 2 KB | DES | 214.2 µs (195.0 µs–266.9 µs) | 197.4 µs | – | – | 18.7% | 116 B |
| Kronologi laporan | 2 KB | RC4 | 103.6 µs (101.0 µs–107.3 µs) | 103.2 µs | – | – | 14.8% | 108 B |
| Kronologi laporan | 2 KB | HMAC plaintext (sekali) | 8.0 µs (7.8 µs–8.2 µs) | (sama) | – | – | 7.6% | 32 B |
| Scan KTP | 600 KB | AES | 814.6 µs (800.3 µs–898.8 µs) | 886.0 µs | 719 | 661 | 7.9% | 88 B |
| Scan KTP | 600 KB | DES | 32.59 ms (30.28 ms–46.32 ms) | 31.35 ms | 18 | 19 | 24.2% | 116 B |
| Scan KTP | 600 KB | RC4 | 3.85 ms (3.71 ms–3.92 ms) | 3.77 ms | 152 | 155 | 3.9% | 108 B |
| Scan KTP | 600 KB | HMAC plaintext (sekali) | 1.79 ms (1.67 ms–2.29 ms) | (sama) | 328 | – | 18.6% | 32 B |
| Dokumen kantor | 3 MB | AES | 3.82 ms (3.78 ms–4.17 ms) | 3.94 ms | 785 | 761 | 10.0% | 88 B |
| Dokumen kantor | 3 MB | DES | 158.05 ms (152.03 ms–169.44 ms) | 146.48 ms | 19 | 20 | 6.9% | 116 B |
| Dokumen kantor | 3 MB | RC4 | 17.58 ms (17.52 ms–17.86 ms) | 17.63 ms | 171 | 170 | 5.2% | 108 B |
| Dokumen kantor | 3 MB | HMAC plaintext (sekali) | 8.52 ms (8.14 ms–9.39 ms) | (sama) | 352 | – | 9.6% | 32 B |
| Video bukti | 64 MB | AES | 82.73 ms (78.44 ms–88.66 ms) | 87.71 ms | 774 | 730 | 9.6% | 88 B |
| Video bukti | 64 MB | DES | 3.37 s (3.31 s–3.48 s) | 3.26 s | 19 | 20 | 2.6% | 116 B |
| Video bukti | 64 MB | RC4 | 398.76 ms (381.59 ms–413.23 ms) | 378.56 ms | 160 | 169 | 3.9% | 108 B |
| Video bukti | 64 MB | HMAC plaintext (sekali) | 176.53 ms (173.38 ms–189.64 ms) | (sama) | 363 | – | 4.4% | 32 B |

Koefisien variasi (CV) tertinggi 24.2% (Scan KTP, DES); untuk payload besar paling tinggi 9.6%. Derau terbesar ada di payload kecil yang sangat peka gangguan sistem lain. Selisih antar cipher pada data besar berlipat-lipat, jauh di atas derau ini, jadi kesimpulan perbandingan tidak berubah; untuk angka absolut yang lebih stabil, tutup aplikasi lain, jalankan dengan --pin, lalu ulangi.

**Interpretasi:**

- **Data besar (video bukti, 64 MB):** AES tercepat. DES 40.7× lebih lambat dari AES, RC4 4.8× lebih lambat dari AES. AES unggul karena dieksekusi instruksi khusus CPU (AES-NI/ARMv8), sedangkan DES dan RC4 murni perangkat lunak; DES juga lambat secara desain (16 ronde permutasi bit yang mahal di software).
- **Waktu tunggu pelapor.** Video maksimal 200 MB: AES ≈ 0.3 s, DES ≈ 10.5 s, RC4 ≈ 1.2 s, HMAC plaintext ≈ 0.6 s. Aplikasi menyimpan ketiganya, jadi setelah unggahan selesai server butuh ≈ 12.6 s, dan 84% di antaranya karena DES. Kalau hanya AES yang disimpan, angka itu turun ke ≈ 0.8 s.
- **Unduhan** memakai satu cipher. Pemilik yang mengunduh video 200 MB menunggu ≈ AES 0.8 s, DES 10.7 s, RC4 1.7 s (termasuk cek keutuhan). Karena itu AES dijadikan cipher bawaan untuk unduhan.
- **Data kecil (NIK (field), 16 B):** semua paling lama 123 µs; RC4 tercepat dan AES terlambat, urutan yang berbeda dari data besar. Pada ukuran ini kecepatan cipher tidak berperan; yang terukur adalah biaya tetap (lihat bagian 3). Selisih puluhan mikrodetik tidak terasa oleh pengguna, bahkan untuk formulir dengan puluhan field.
- **Overhead simpan** per item kecil dan konstan: IV + tag + kunci terbungkus, ditambah padding 1–8 byte untuk DES. Untuk NIK 16 byte ini terlihat besar (AES 88 B, DES 116 B, RC4 108 B), tetapi untuk file tidak berarti. Yang signifikan adalah keputusan menyimpan **tiga salinan**: disk ≈ 3× ukuran bukti.

## 2. Primitif murni vs HMAC

Payload 16 MB, tanpa integritas, untuk memisahkan biaya cipher dari biaya MAC.

| Primitif | MB/s | CV |
|---|---:|---:|
| AES-256-CTR | 1060 | 3.1% |
| AES-256-GCM (dgn tag) | 881 | 2.9% |
| DES-CBC | 20 | 4.0% |
| RC4-drop3072 | 325 | 4.1% |
| HMAC-SHA256 | 372 | 3.6% |

**Interpretasi:**

- DES murni hanya 20 MB/s, jadi DES sendiri leher botolnya; HMAC (372 MB/s) hanya menambah sedikit (perkiraan DES+HMAC ≈ 19 MB/s).
- RC4 murni 325 MB/s, tetapi begitu ditambah HMAC turun ke ≈ 174 MB/s, sedangkan AES-GCM yang integritasnya sudah termasuk mencapai 881 MB/s. Jadi alasan klasik 'RC4 dipilih karena cepat' tidak berlaku lagi bila integritas wajib dan CPU punya akselerasi AES.
- Selisih AES-CTR (1060) dan AES-GCM (881) adalah biaya GHASH, yaitu harga integritas di GCM.

## 3. Biaya tetap per item (menjelaskan hasil data kecil)

| Komponen | Waktu |
|---|---:|
| Total skema AES (0 byte) | 119.2 µs |
| Total skema DES (0 byte) | 87.7 µs |
| Total skema RC4 (0 byte) | 88.0 µs |
| AES-GCM: inisialisasi + tag | 44.3 µs |
| DES-CBC: inisialisasi | 6.2 µs |
| RC4: inisialisasi tanpa drop | 3.2 µs |
| RC4: inisialisasi + drop 3072 | 15.0 µs |
| HMAC-SHA256: init + digest | 2.4 µs |
| Key wrap AES-GCM (dipakai semua skema) | 62.0 µs |
| Kunci acak os.urandom(48) | 617 ns |

**Interpretasi:**

- Key wrap (62.0 µs) adalah porsi terbesar dan sama untuk ketiga skema, karena envelope encryption memakai AES-GCM untuk membungkus kunci data apa pun cipher-nya.
- AES-GCM juga punya inisialisasi relatif mahal (44.3 µs): pycryptodome menyiapkan tabel GHASH untuk setiap kunci baru. Karena aplikasi memakai kunci baru per item, biaya ini dibayar setiap kali; itu sebabnya AES bisa kalah di data sangat kecil.
- Membuang 3072 byte awal RC4 menaikkan inisialisasi dari 3.2 µs ke 15.0 µs. Harga ini kecil dibanding manfaatnya (bagian 5).

## 4. Uji manipulasi ciphertext

Satu bit acak dibalik pada ciphertext dokumen 4 KB, lalu didekripsi.

| Skema | Percobaan | Terdeteksi | Lolos diam-diam | Rata-rata bit plaintext berubah (yang lolos) |
|---|---:|---:|---:|---:|
| AES-256-GCM | 2000 | 2000 | 0 | 0.0 |
| DES-CBC-HMAC | 2000 | 2000 | 0 | 0.0 |
| RC4-HMAC | 2000 | 2000 | 0 | 0.0 |
| AES-256-CTR (tanpa MAC) | 2000 | 0 | 2000 | 1.0 |
| DES-CBC (tanpa MAC) | 2000 | 5 | 1995 | 33.1 |
| RC4 (tanpa MAC) | 2000 | 0 | 2000 | 1.0 |

Serangan terarah: penyerang tanpa kunci mengubah nominal kerugian di kronologi dari 1 juta menjadi 9 juta.

- **original**: `Kerugian: Rp 1.000.000 ke rek BCA 1234567890 a.n. pelaku`
- **RC4 tanpa MAC**: `Kerugian: Rp 9.000.000 ke rek BCA 1234567890 a.n. pelaku`
- **DES-CBC tanpa MAC**: `#@"�2k�: Rp 9.000.000 ke rek BCA 1234567890 a.n. pelaku`
- **AES-256-GCM**: `DITOLAK: integritas gagal`
- **DES-CBC-HMAC**: `DITOLAK: integritas gagal`
- **RC4-HMAC**: `DITOLAK: integritas gagal`

**Interpretasi:**

- Tanpa MAC, CTR dan RC4 *malleable*: membalik 1 bit ciphertext membalik tepat 1 bit plaintext. Penyerang yang tahu posisi nominal bisa mengubahnya dengan presisi, dan dekripsi tetap 'berhasil'.
- CBC tanpa MAC merusak satu blok penuh plus 1 bit di blok berikutnya (rata-rata 33 bit berubah), tetapi padding hanya menangkap 5 dari 2000 percobaan. Serangan terarah tetap berhasil dengan mengorbankan blok sebelumnya (atau tanpa jejak sama sekali bila target di blok pertama, lewat IV).
- Dengan GCM dan Encrypt-then-MAC, **semua** manipulasi ditolak sebelum plaintext dikirim. Laporan dipakai sebagai bukti, jadi tanpa integritas syarat 'data kembali utuh' tidak terpenuhi.

## 5. Kelemahan kriptografis yang terukur

**Bias RC4.** Peluang byte keystream ke-2 bernilai 0 (seharusnya 1/256 = 0,391%):

- drop=0: 0.739% (CI95 0.706–0.772%), z = 28.6, n = 262,144
- drop=3072: 0.373% (CI95 0.350–0.397%), z = -1.4, n = 262,144

Tanpa drop, peluangnya 1.89× nilai acak (z = 29, jauh di atas 1,96), sesuai temuan Mantin–Shamir. Dengan drop 3072, z = -1.4, tidak bisa dibedakan dari acak pada sampel ini. Bias semacam ini yang dipakai untuk memecahkan WEP dan RC4 di TLS, sehingga RFC 7465 melarang RC4 di TLS. Drop menghilangkan bias awal, tetapi bias jangka panjang RC4 tetap ada.

**Brute force kunci** (1 core, Python + pycryptodome — jauh lebih lambat dari perangkat penyerang):

- DES (56 bit): 109,767 kunci/s → rata-rata 10,400.9 tahun (1 core), 5,200.5 tahun (2 core)
- AES-128 (128 bit): 112,784 kunci/s → rata-rata 4.8e+25 tahun (1 core), 2.4e+25 tahun (2 core)

Angka DES di atas tidak boleh dibaca sebagai 'aman ribuan tahun'. Implementasi bitslice di GPU/FPGA jutaan kali lebih cepat dari Python, dan mesin Deep Crack milik EFF sudah membongkar DES dalam sekitar 56 jam pada 1998. Yang tidak berubah adalah selisih ruang kunci: AES-128 punya 2^72 kali lebih banyak kunci daripada DES (AES-256 yang dipakai di sini 2^200 kali), jadi percepatan perangkat sebesar apa pun tidak menutup jarak itu.

**Blok 64 bit DES (Sweet32).** Tabrakan blok CBC mulai mungkin setelah ≈ 32 GiB di bawah satu kunci. Karena aplikasi memakai kunci baru per file (video maks 200 MB), peluangnya ≈ 1.9e-05. Kalau satu kunci DES dipakai untuk 100 GB bukti, peluangnya ≈ 1.00 (praktis pasti). AES dengan blok 128 bit pada 100 GB: 6.6e-20. Kunci per item menghilangkan risiko ini di aplikasi; kelemahan DES yang tersisa adalah kunci 56 bit.

## 6. Kesimpulan untuk skenario Lapor Siber

- **AES-256-GCM dijadikan salinan utama** untuk semua akses (unduhan pemilik, tampilan profil, tampilan kasus petugas): tercepat untuk bukti berukuran file (774 MB/s vs DES 19 dan RC4 160), integritas sudah termasuk, kunci 256 bit, blok 128 bit.
- **DES-CBC-HMAC** tidak bisa dimanipulasi berkat HMAC, tetapi kerahasiaannya bergantung pada kunci 56 bit yang sudah bisa di-brute-force. Untuk scan KTP dan data keuangan (data pribadi spesifik menurut UU PDP), ini tidak memenuhi kewajiban pengendali untuk menerapkan pengamanan yang layak. DES juga penyebab terbesar waktu tunggu unggahan.
- **RC4-HMAC** tidak bisa dimanipulasi dan bias awalnya dihilangkan dengan drop 3072, tetapi RC4 sudah dilarang di protokol modern dan keunggulan kecepatannya hilang setelah HMAC ditambahkan.
- **Konsekuensi menyimpan tiga salinan:** disk 3×, waktu proses unggahan = jumlah ketiganya, dan yang paling penting, kerahasiaan data hanya sekuat salinan **terlemah**. Penyerang yang mencuri database cukup menyerang versi DES. Di sistem produksi, hanya salinan AES yang seharusnya disimpan; versi DES dan RC4 ada di proyek ini untuk keperluan perbandingan.