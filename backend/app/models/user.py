from __future__ import annotations

import sqlite3
from typing import Any, Optional


def create_user(
    username: str,
    salt: bytes,
    password_hash: bytes,
    role: str = "user",
) -> int:
    """Menyimpan user baru ke dalam database (otomatis admin jika username 'admin')."""
    from . import get_db

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
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,),
        )
        return cursor.fetchone()


def get_user_by_id(user_id: int) -> Optional[sqlite3.Row]:
    """Mencari data pengguna berdasarkan user ID."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        )
        return cursor.fetchone()


def get_all_users() -> list[dict[str, Any]]:
    """Mengambil seluruh daftar pengguna terdaftar."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            "SELECT id, username, role, created_at FROM users ORDER BY id ASC"
        )
        return [dict(row) for row in cursor.fetchall()]


def count_users() -> int:
    """Menghitung total user yang terdaftar."""
    from . import get_db

    with get_db() as conn:
        row = conn.execute("SELECT COUNT(*) FROM users").fetchone()
        return row[0] if row else 0
