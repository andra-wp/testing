from __future__ import annotations

import sqlite3
from typing import Any, Optional


def save_evidence(
    user_id: int,
    category: str,
    filename: str,
    algorithm: str,
    mode: str,
    notes: str,
    filesize: int,
    envelope_json: str,
    case_id: Optional[int] = None,
) -> int:
    """Menyimpan catatan laporan bukti terenkripsi ke database."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO evidences 
               (user_id, case_id, category, filename, algorithm, mode, notes, filesize, envelope_json) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, case_id, category, filename, algorithm, mode, notes, filesize, envelope_json),
        )
        return cursor.lastrowid


def get_all_evidences() -> list[dict[str, Any]]:
    """Mengambil semua daftar bukti yang dilaporkan (khusus admin/investigator)."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            """SELECT e.id, e.user_id, e.case_id, u.username as reporter, e.category, e.filename, 
                      e.algorithm, e.mode, e.notes, e.filesize, e.created_at, e.envelope_json,
                      c.title as case_title
               FROM evidences e
               JOIN users u ON e.user_id = u.id
               LEFT JOIN cases c ON e.case_id = c.id
               ORDER BY e.id DESC"""
        )
        return [dict(row) for row in cursor.fetchall()]


def get_evidence_by_id(evidence_id: int) -> Optional[dict[str, Any]]:
    """Mencari detail satu bukti berdasarkan ID."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            """SELECT e.*, u.username as reporter, c.title as case_title
               FROM evidences e
               JOIN users u ON e.user_id = u.id
               LEFT JOIN cases c ON e.case_id = c.id
               WHERE e.id = ?""",
            (evidence_id,),
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def get_evidences_by_user(user_id: int) -> list[dict[str, Any]]:
    """Mengambil riwayat bukti yang diunggah oleh user tertentu."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            """SELECT e.*, c.title as case_title
               FROM evidences e
               LEFT JOIN cases c ON e.case_id = c.id
               WHERE e.user_id = ?
               ORDER BY e.id DESC""",
            (user_id,),
        )
        return [dict(row) for row in cursor.fetchall()]


def count_evidences() -> int:
    """Menghitung total rekaman bukti tersimpan."""
    from . import get_db

    with get_db() as conn:
        row = conn.execute("SELECT COUNT(*) FROM evidences").fetchone()
        return row[0] if row else 0


def get_evidence_stats() -> dict[str, Any]:
    """Menghitung total laporan dan breakdown per kategori."""
    from . import get_db

    with get_db() as conn:
        total_reports = conn.execute("SELECT COUNT(*) FROM evidences").fetchone()[0]
        categories_rows = conn.execute(
            "SELECT category, COUNT(*) as count FROM evidences GROUP BY category"
        ).fetchall()
        categories = {row["category"] or "other": row["count"] for row in categories_rows}

    return {
        "total_reports": total_reports,
        "categories": categories,
    }
