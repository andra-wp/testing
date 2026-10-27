from __future__ import annotations

import sqlite3
from typing import Any, Optional


def create_case(
    title: str,
    description: str = "",
    status: str = "OPEN",
    created_by: Optional[int] = None,
) -> int:
    """Membuat rekaman kasus insiden siber baru."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO cases (title, description, status, created_by)
               VALUES (?, ?, ?, ?)""",
            (title, description, status.upper(), created_by),
        )
        return cursor.lastrowid


def get_case_by_id(case_id: int) -> Optional[dict[str, Any]]:
    """Mencari detail kasus insiden berdasarkan ID."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            """SELECT c.*, u.username as creator
               FROM cases c
               LEFT JOIN users u ON c.created_by = u.id
               WHERE c.id = ?""",
            (case_id,),
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def get_all_cases() -> list[dict[str, Any]]:
    """Mengambil semua daftar kasus insiden siber."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            """SELECT c.*, u.username as creator, COUNT(e.id) as evidence_count
               FROM cases c
               LEFT JOIN users u ON c.created_by = u.id
               LEFT JOIN evidences e ON e.case_id = c.id
               GROUP BY c.id
               ORDER BY c.id DESC"""
        )
        return [dict(row) for row in cursor.fetchall()]


def update_case_status(case_id: int, status: str) -> bool:
    """Memperbarui status investigasi kasus (OPEN, INVESTIGATING, CLOSED)."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            "UPDATE cases SET status = ? WHERE id = ?",
            (status.upper(), case_id),
        )
        return cursor.rowcount > 0


def get_evidences_by_case(case_id: int) -> list[dict[str, Any]]:
    """Mengambil semua barang bukti yang terkait dengan kasus tertentu."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            """SELECT e.*, u.username as reporter
               FROM evidences e
               JOIN users u ON e.user_id = u.id
               WHERE e.case_id = ?
               ORDER BY e.id DESC""",
            (case_id,),
        )
        return [dict(row) for row in cursor.fetchall()]


def assign_evidence_to_case(evidence_id: int, case_id: int) -> bool:
    """Menautkan barang bukti ke dalam suatu kasus insiden."""
    from . import get_db

    with get_db() as conn:
        cursor = conn.execute(
            "UPDATE evidences SET case_id = ? WHERE id = ?",
            (case_id, evidence_id),
        )
        return cursor.rowcount > 0

