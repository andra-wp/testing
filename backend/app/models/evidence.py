from __future__ import annotations

import json
import sqlite3
from typing import Any, Optional

from .database import get_db

SUPPORTED_ALGORITHMS = {"AES", "DES", "RC4"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


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
    # 1. Validasi Ukuran File
    if filesize < 0:
        raise ValueError("Ukuran berkas tidak boleh negatif.")
    if filesize > MAX_FILE_SIZE:
        raise ValueError(f"Ukuran berkas melebihi batas maksimum ({MAX_FILE_SIZE // (1024*1024)} MB).")

    # 2. Validasi Algoritma
    algo_clean = algorithm.strip().upper()
    if algo_clean not in SUPPORTED_ALGORITHMS:
        raise ValueError(f"Algoritma '{algorithm}' tidak didukung. Pilihan: {', '.join(SUPPORTED_ALGORITHMS)}")

    # 3. Validasi Nama File & Kategori
    clean_filename = filename.strip()
    if not clean_filename or len(clean_filename) > 255:
        raise ValueError("Nama file tidak boleh kosong dan maksimal 255 karakter.")

    clean_category = (category or "other").strip().lower()
    clean_mode = mode.strip().upper()

    # 4. Validasi Format Envelope JSON
    if not envelope_json or not envelope_json.strip():
        raise ValueError("Envelope JSON tidak boleh kosong.")

    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO evidences 
               (user_id, case_id, category, filename, algorithm, mode, notes, filesize, envelope_json) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, case_id, clean_category, clean_filename, algo_clean, clean_mode, notes or "", filesize, envelope_json),
        )
        return cursor.lastrowid


def get_all_evidences(
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    category: Optional[str] = None,
    case_id: Optional[int] = None,
) -> list[dict[str, Any]]:
    if not 1 <= limit <= 100:
        raise ValueError("Limit harus antara 1 dan 100.")
    if offset < 0:
        raise ValueError("Offset tidak boleh negatif.")

    query = """
        SELECT
            e.id,
            e.user_id,
            e.case_id,
            u.username AS reporter,
            e.category,
            e.filename,
            e.algorithm,
            e.mode,
            e.notes,
            e.filesize,
            e.created_at,
            c.title AS case_title
        FROM evidences e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN cases c ON e.case_id = c.id
        WHERE 1=1
    """
    params: list[Any] = []

    if category:
        query += " AND e.category = ?"
        params.append(category.strip().lower())

    if case_id is not None:
        query += " AND e.case_id = ?"
        params.append(case_id)

    if search:
        query += " AND (e.filename LIKE ? OR e.notes LIKE ?)"
        keyword = f"%{search.strip()}%"
        params.extend([keyword, keyword])

    query += " ORDER BY e.id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]


def get_evidence_by_id(evidence_id: int) -> Optional[dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT
                e.id,
                e.user_id,
                e.case_id,
                u.username AS reporter,
                e.category,
                e.filename,
                e.algorithm,
                e.mode,
                e.notes,
                e.filesize,
                e.created_at,
                c.title AS case_title
            FROM evidences e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN cases c ON e.case_id = c.id
            WHERE e.id = ?
            """,
            (evidence_id,),
        ).fetchone()

        return dict(row) if row else None


def get_envelope_by_id(evidence_id: int) -> Optional[dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT id, user_id, case_id, filename, algorithm, mode, envelope_json
            FROM evidences
            WHERE id = ?
            """,
            (evidence_id,),
        ).fetchone()

        return dict(row) if row else None


def get_evidences_by_user(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT
                e.id,
                e.user_id,
                e.case_id,
                e.category,
                e.filename,
                e.algorithm,
                e.mode,
                e.notes,
                e.filesize,
                e.created_at,
                c.title AS case_title
            FROM evidences e
            LEFT JOIN cases c ON e.case_id = c.id
            WHERE e.user_id = ?
            ORDER BY e.id DESC
            LIMIT ? OFFSET ?
            """,
            (user_id, limit, offset),
        ).fetchall()
        return [dict(row) for row in rows]


def delete_evidence(evidence_id: int, force: bool = False) -> bool:
    with get_db() as conn:
        evidence = conn.execute("SELECT id, case_id FROM evidences WHERE id = ?", (evidence_id,)).fetchone()
        if not evidence:
            return False

        # Proteksi: Bukti yang sudah dilampirkan ke berkas kasus tidak boleh sembarangan dihapus
        if evidence["case_id"] is not None and not force:
            raise ValueError("Barang bukti telah dilampirkan ke kasus aktif. Lepaskan tautan terlebih dahulu.")

        cursor = conn.execute("DELETE FROM evidences WHERE id = ?", (evidence_id,))
        return cursor.rowcount > 0


def count_evidences() -> int:
    with get_db() as conn:
        row = conn.execute("SELECT COUNT(*) FROM evidences").fetchone()
        return row[0] if row else 0


def get_evidence_stats() -> dict[str, Any]:
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
