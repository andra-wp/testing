import sqlite3
from pathlib import Path

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


# Re-export fitur modular
from .user import (
    create_user,
    get_user_by_username,
    get_user_by_id,
    get_all_users,
    count_users,
)

from .case import (
    create_case,
    get_case_by_id,
    get_all_cases,
    update_case_status,
    get_evidences_by_case,
    assign_evidence_to_case,
)

from .evidence import (
    save_evidence,
    get_all_evidences,
    get_evidence_by_id,
    get_evidences_by_user,
    count_evidences,
    get_evidence_stats,
)

from .schemas import (
    EncryptTextRequest,
    DecryptRequest,
    EncryptResponse,
    DecryptResponse,
    UserAuthRequest,
    AuthResponse,
    UserProfileResponse,
    CaseCreateRequest,
    CaseResponse,
)

__all__ = [
    "DB_DIR",
    "DB_PATH",
    "get_db",
    "init_db",
    # user
    "create_user",
    "get_user_by_username",
    "get_user_by_id",
    "get_all_users",
    "count_users",
    # case
    "create_case",
    "get_case_by_id",
    "get_all_cases",
    "update_case_status",
    "get_evidences_by_case",
    "assign_evidence_to_case",
    # evidence
    "save_evidence",
    "get_all_evidences",
    "get_evidence_by_id",
    "get_evidences_by_user",
    "count_evidences",
    "get_evidence_stats",
    # schemas
    "EncryptTextRequest",
    "DecryptRequest",
    "EncryptResponse",
    "DecryptResponse",
    "UserAuthRequest",
    "AuthResponse",
    "UserProfileResponse",
    "CaseCreateRequest",
    "CaseResponse",
]
