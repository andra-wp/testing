import sqlite3
from pathlib import Path

# Lokasi penyimpanan database SQLite
DB_DIR = Path(__file__).resolve().parent.parent / "instances"
DB_PATH = DB_DIR / "ciphervault.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    salt BLOB NOT NULL,
    password_hash BLOB NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'OPEN',
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    case_id INTEGER REFERENCES cases(id),
    category TEXT,
    filename TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    mode TEXT NOT NULL,
    notes TEXT,
    filesize INTEGER,
    envelope_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
"""


def get_db() -> sqlite3.Connection:
    """Membuka koneksi ke database SQLite dengan row_factory Row."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Inisialisasi tabel database dan migrasi saat aplikasi dijalankan."""
    with get_db() as conn:
        conn.executescript(SCHEMA)

        # Migrasi kolom role jika tabel users lama belum punya
        try:
            conn.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")
        except sqlite3.OperationalError:
            pass

        # Migrasi kolom case_id jika tabel evidences lama belum punya
        try:
            conn.execute("ALTER TABLE evidences ADD COLUMN case_id INTEGER REFERENCES cases(id)")
        except sqlite3.OperationalError:
            pass
