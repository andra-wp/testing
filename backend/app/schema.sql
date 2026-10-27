-- Tabel di sini hanya menyimpan metadata sistem (id, status, kategori, waktu, ukuran).
-- Semua data yang diisi/diunggah pengguna disimpan terenkripsi di encrypted_items.

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email_bidx    TEXT NOT NULL UNIQUE,   -- HMAC(email) untuk login; email asli terenkripsi
    password_hash TEXT NOT NULL,          -- bcrypt
    role          TEXT NOT NULL CHECK (role IN ('pelapor', 'petugas')),
    consent_at    TEXT,                   -- waktu persetujuan pemrosesan data (UU PDP)
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
    id            TEXT PRIMARY KEY,
    owner_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category      TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'diterima',
    incident_date TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_owner  ON reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS attachments (
    id         TEXT PRIMARY KEY,
    owner_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id  TEXT REFERENCES reports(id) ON DELETE CASCADE,  -- NULL untuk scan KTP
    kind       TEXT NOT NULL CHECK (kind IN ('ktp', 'dokumen', 'video')),
    mime       TEXT NOT NULL,
    size       INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attachments_report ON attachments(report_id);

CREATE TABLE IF NOT EXISTS report_events (
    id          TEXT PRIMARY KEY,
    report_id   TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    actor_id    TEXT,
    actor_role  TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('status', 'note')),
    from_status TEXT,
    to_status   TEXT,
    has_note    INTEGER NOT NULL DEFAULT 0,  -- isi catatan ada di encrypted_items
    created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_report ON report_events(report_id);

-- Satu baris per (objek, field, cipher): setiap data disimpan 3x (AES, DES, RC4).
CREATE TABLE IF NOT EXISTS encrypted_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id    TEXT NOT NULL,
    ref_type    TEXT NOT NULL,    -- user | report | attachment | event
    ref_id      TEXT NOT NULL,
    field       TEXT NOT NULL,    -- mis. nik, chronology, content
    cipher      TEXT NOT NULL,    -- AES-256-GCM | DES-CBC-HMAC | RC4-HMAC
    iv          BLOB NOT NULL,    -- nonce/IV (kosong untuk RC4)
    tag         BLOB NOT NULL,    -- tag GCM atau HMAC-SHA256
    wrapped_key BLOB NOT NULL,    -- kunci data acak, dibungkus MASTER_KEY
    ciphertext  BLOB,             -- untuk field kecil
    path        TEXT,             -- untuk file (relatif ke STORAGE_DIR)
    plain_hmac  BLOB NOT NULL,    -- HMAC plaintext: bukti data kembali utuh
    plain_size  INTEGER NOT NULL,
    cipher_size INTEGER NOT NULL,
    enc_ms      REAL NOT NULL,
    created_at  TEXT NOT NULL,
    UNIQUE (ref_type, ref_id, field, cipher)
);
CREATE INDEX IF NOT EXISTS idx_items_owner ON encrypted_items(owner_id);

-- Izin pelapor agar petugas boleh melihat lampiran (bukan KTP). Satu baris per lampiran = status terkini.
-- Akses aktif hanya bila status='granted' DAN laporan belum ditutup. Alasan permintaan terenkripsi (ref_type='grant').
CREATE TABLE IF NOT EXISTS access_grants (
    attachment_id TEXT PRIMARY KEY REFERENCES attachments(id) ON DELETE CASCADE,
    status        TEXT NOT NULL CHECK (status IN ('granted', 'requested', 'denied', 'revoked')),
    source        TEXT NOT NULL CHECK (source IN ('submission', 'owner', 'request')),
    requested_by  TEXT,
    requested_at  TEXT,
    decided_at    TEXT,
    updated_at    TEXT NOT NULL
);

-- Verifikasi KTP: status terkini per pelapor. Pelapor hanya bisa membuat laporan bila 'terverifikasi'.
-- Petugas hanya bisa membuka KTP saat status 'menunggu' (akses tertutup setelah keputusan).
CREATE TABLE IF NOT EXISTS ktp_verifications (
    user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status        TEXT NOT NULL CHECK (status IN ('menunggu', 'terverifikasi', 'ditolak', 'verifikasi_ulang')),
    attachment_id TEXT,              -- versi KTP yang sedang/terakhir diverifikasi
    file_hmac     TEXT,              -- HMAC plaintext versi itu (mengikat keputusan ke file)
    decided_by    TEXT,
    decided_at    TEXT,
    updated_at    TEXT NOT NULL
);

-- Riwayat verifikasi (diajukan, diverifikasi, ditolak, ditandai bermasalah). Catatan terenkripsi (ref_type='ktp_event').
CREATE TABLE IF NOT EXISTS ktp_events (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attachment_id TEXT,
    action        TEXT NOT NULL CHECK (action IN ('diajukan', 'terverifikasi', 'ditolak', 'verifikasi_ulang')),
    actor_id      TEXT,
    actor_role    TEXT NOT NULL,
    file_hmac     TEXT,
    has_note      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ktp_events_user ON ktp_events(user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id    TEXT,
    actor_role  TEXT,
    action      TEXT NOT NULL,
    target_type TEXT,
    target_id   TEXT,
    detail      TEXT,
    created_at  TEXT NOT NULL
);
