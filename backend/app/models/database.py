
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

DB_DIR = Path(__file__).resolve().parent.parent.parent / "instances"
DB_PATH = DB_DIR / "ciphervault.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    salt BLOB NOT NULL,
    password_hash BLOB NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
        CHECK (role IN ('admin', 'user', 'investigator', 'supervisor')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'INVESTIGATING', 'CLOSED')),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    filesize INTEGER NOT NULL CHECK (filesize >= 0),
    envelope_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS case_members (
    case_id INTEGER NOT NULL REFERENCES cases(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    permission TEXT NOT NULL DEFAULT 'viewer'
        CHECK (permission IN ('viewer', 'contributor', 'manager')),
    PRIMARY KEY (case_id, user_id)
);
"""


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    DB_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _column_exists(
    conn: sqlite3.Connection,
    table: str,
    column: str,
) -> bool:
    columns = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return any(row["name"] == column for row in columns)


def init_db() -> None:
    with get_db() as conn:
        conn.executescript(SCHEMA)

        # Migrations for databases created with older schemas.
        if not _column_exists(conn, "users", "role"):
            conn.execute(
                "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'"
            )

        if not _column_exists(conn, "evidences", "case_id"):
            conn.execute(
                "ALTER TABLE evidences "
                "ADD COLUMN case_id INTEGER REFERENCES cases(id)"
            )
