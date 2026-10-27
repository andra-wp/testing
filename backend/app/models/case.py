from __future__ import annotations

import sqlite3
from typing import Any, Optional

from .database import get_db

VALID_STATUSES = {"OPEN", "INVESTIGATING", "CLOSED"}


def validate_status(status: str) -> str:
    normalized = status.strip().upper()

    if normalized not in VALID_STATUSES:
        raise ValueError(f"Status tidak valid: {status}")

    return normalized


def create_case(
    title: str,
    created_by: Optional[int] = None,
    description: str = "",
    status: str = "OPEN",
) -> int:
    title = title.strip()

    if len(title) < 3 or len(title) > 120:
        raise ValueError("Judul harus terdiri dari 3-120 karakter.")

    normalized_status = validate_status(status)

    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO cases (title, description, status, created_by)
            VALUES (?, ?, ?, ?)
            """,
            (title, description, normalized_status, created_by),
        )
        return cursor.lastrowid


def get_case_by_id(case_id: int) -> dict[str, Any] | None:
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT c.*, u.username AS creator,
                   (
                       SELECT COUNT(*)
                       FROM evidences e
                       WHERE e.case_id = c.id
                   ) AS evidence_count
            FROM cases c
            LEFT JOIN users u ON c.created_by = u.id
            WHERE c.id = ?
            """,
            (case_id,),
        ).fetchone()

        return dict(row) if row else None


def get_all_cases(
    limit: int = 20,
    offset: int = 0,
) -> list[dict[str, Any]]:
    if not 1 <= limit <= 100:
        raise ValueError("Limit harus antara 1 dan 100.")

    if offset < 0:
        raise ValueError("Offset tidak boleh negatif.")

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT c.*, u.username AS creator,
                   (
                       SELECT COUNT(*)
                       FROM evidences e
                       WHERE e.case_id = c.id
                   ) AS evidence_count
            FROM cases c
            LEFT JOIN users u ON c.created_by = u.id
            ORDER BY c.id DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        ).fetchall()

        return [dict(row) for row in rows]


def update_case_status(case_id: int, status: str) -> bool:
    normalized = validate_status(status)

    with get_db() as conn:
        cursor = conn.execute(
            "UPDATE cases SET status = ? WHERE id = ?",
            (normalized, case_id),
        )
        return cursor.rowcount > 0


def get_evidences_by_case(
    case_id: int,
) -> list[dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT e.id, e.case_id, e.user_id,
                   e.category, e.filename, e.algorithm,
                   e.mode, e.filesize, e.notes, e.created_at,
                   u.username AS reporter
            FROM evidences e
            JOIN users u ON e.user_id = u.id
            WHERE e.case_id = ?
            ORDER BY e.id DESC
            """,
            (case_id,),
        ).fetchall()

        return [dict(row) for row in rows]


def assign_evidence_to_case(
    evidence_id: int,
    case_id: int,
) -> bool:
    with get_db() as conn:
        case_exists = conn.execute(
            "SELECT 1 FROM cases WHERE id = ?",
            (case_id,),
        ).fetchone()

        evidence_exists = conn.execute(
            "SELECT 1 FROM evidences WHERE id = ?",
            (evidence_id,),
        ).fetchone()

        if not case_exists or not evidence_exists:
            return False

        cursor = conn.execute(
            "UPDATE evidences SET case_id = ? WHERE id = ?",
            (case_id, evidence_id),
        )

        return cursor.rowcount > 0
