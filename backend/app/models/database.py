import sqlite3
from pathlib import Path
from typing import Any, Optional

# Lokasi penyimpanan database SQLite
DB_DIR = Path(__file__).resolve().parent.parent.parent / "instances"
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

CREATE TABLE IF NOT EXISTS evidences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
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
    """Membuka koneksi ke database SQLite dengan row_factory Row (bisa diakses via nama kolom)."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Inisialisasi tabel database saat aplikasi dijalankan."""
    with get_db() as conn:
        conn.executescript(SCHEMA)
        # Migrasi kolom role jika tabel users lama belum punya
        try:
            conn.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")
        except sqlite3.OperationalError:
            pass  # Kolom role sudah ada


def create_user(username: str, salt: bytes, password_hash: bytes, role: str = "user") -> int:
    """Menyimpan user baru ke dalam database (otomatis admin jika username 'admin')."""
    if username.strip().lower() == "admin":
        role = "admin"
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO users (username, salt, password_hash, role) VALUES (?, ?, ?, ?)",
            (username, salt, password_hash, role),
        )
        return cursor.lastrowid


def get_user_by_username(username: str) -> Optional[sqlite3.Row]:
    """Mencari data pengguna berdasarkan username."""
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,),
        )
        return cursor.fetchone()


def save_evidence(
    user_id: int,
    category: str,
    filename: str,
    algorithm: str,
    mode: str,
    notes: str,
    filesize: int,
    envelope_json: str,
) -> int:
    """Menyimpan catatan laporan bukti terenkripsi ke database."""
    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO evidences 
               (user_id, category, filename, algorithm, mode, notes, filesize, envelope_json) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, category, filename, algorithm, mode, notes, filesize, envelope_json),
        )
        return cursor.lastrowid


def get_all_evidences() -> list[dict[str, Any]]:
    """Mengambil semua daftar bukti yang dilaporkan (khusus admin/investigator)."""
    with get_db() as conn:
        cursor = conn.execute(
            """SELECT e.id, e.user_id, u.username as reporter, e.category, e.filename, 
                      e.algorithm, e.mode, e.notes, e.filesize, e.created_at, e.envelope_json
               FROM evidences e
               JOIN users u ON e.user_id = u.id
               ORDER BY e.id DESC"""
        )
        return [dict(row) for row in cursor.fetchall()]


def get_evidence_by_id(evidence_id: int) -> Optional[dict[str, Any]]:
    """Mencari detail satu bukti berdasarkan ID."""
    with get_db() as conn:
        cursor = conn.execute(
            """SELECT e.*, u.username as reporter 
               FROM evidences e
               JOIN users u ON e.user_id = u.id
               WHERE e.id = ?""",
            (evidence_id,),
        )
        row = cursor.fetchone()
        return dict(row) if row else None

def save_evidence(
    user_id: int,
    category: str,
    filename: str,
    algorithm: str,
    mode: str,
    notes: str,
    filesize: int,
    envelope_json: str,
) -> int:
    """Menyimpan catatan laporan bukti terenkripsi ke database."""
    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO evidences 
               (user_id, category, filename, algorithm, mode, notes, filesize, envelope_json) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, category, filename, algorithm, mode, notes, filesize, envelope_json),
        )
        return cursor.lastrowid


def get_all_evidences() -> list[dict[str, Any]]:
    """Mengambil semua daftar bukti yang dilaporkan (khusus admin/investigator)."""
    with get_db() as conn:
        cursor = conn.execute(
            """SELECT e.id, e.user_id, u.username as reporter, e.category, e.filename, 
                      e.algorithm, e.mode, e.notes, e.filesize, e.created_at, e.envelope_json
               FROM evidences e
               JOIN users u ON e.user_id = u.id
               ORDER BY e.id DESC"""
        )
        return [dict(row) for row in cursor.fetchall()]


def get_evidence_by_id(evidence_id: int) -> Optional[dict[str, Any]]:
    """Mencari detail satu bukti berdasarkan ID."""
    with get_db() as conn:
        cursor = conn.execute(
            """SELECT e.*, u.username as reporter 
               FROM evidences e
               JOIN users u ON e.user_id = u.id
               WHERE e.id = ?""",
            (evidence_id,),
        )
        row = cursor.fetchone()
        return dict(row) if row else None

