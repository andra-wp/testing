import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.models.database import get_all_evidences, get_db, get_evidence_by_id
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Administrator & Investigation"])


def require_admin(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Dependency RBAC: Memastikan bahwa pengguna memiliki peran 'admin'."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Hanya administrator / investigator yang berwenang mengakses data ini.",
        )
    return current_user


@router.get("/reports", summary="Melihat semua berkas bukti yang diunggah pengguna (Khusus Admin)")
def list_reports(admin: dict[str, Any] = Depends(require_admin)):
    """Mengambil seluruh daftar bukti insiden digital dari database SQLite."""
    evidences = get_all_evidences()
    # Jangan kirim ciphertext raksasa di list table untuk efisiensi network, kirim metadata saja
    reports = []
    for ev in evidences:
        reports.append({
            "id": ev["id"],
            "reporter": ev["reporter"],
            "category": ev["category"],
            "filename": ev["filename"],
            "algorithm": ev["algorithm"],
            "mode": ev["mode"],
            "notes": ev["notes"],
            "filesize": ev["filesize"],
            "created_at": ev["created_at"],
        })
    return {"success": True, "count": len(reports), "reports": reports}


@router.get("/reports/{report_id}/envelope", summary="Mengunduh berkas envelope JSON laporan tertentu (Khusus Admin)")
def download_envelope(report_id: int, admin: dict[str, Any] = Depends(require_admin)):
    """Mengambil file JSON envelope bukti dari database berdasarkan ID."""
    evidence = get_evidence_by_id(report_id)
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bukti tidak ditemukan.")

    envelope_json = evidence["envelope_json"]
    envelope_filename = f"{evidence['filename']}.{evidence['algorithm'].lower()}-{evidence['mode'].lower()}.json"

    return Response(
        content=envelope_json,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{envelope_filename}"',
            "X-Filename": envelope_filename,
        },
    )


@router.get("/stats", summary="Statistik Ringkasan Bukti Masuk (Khusus Admin)")
def get_stats(admin: dict[str, Any] = Depends(require_admin)):
    """Menghitung total laporan, total pengguna, dan breakdown kategori."""
    with get_db() as conn:
        total_reports = conn.execute("SELECT COUNT(*) FROM evidences").fetchone()[0]
        total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        categories_rows = conn.execute("SELECT category, COUNT(*) as count FROM evidences GROUP BY category").fetchall()
        categories = {row["category"] or "other": row["count"] for row in categories_rows}

    return {
        "success": True,
        "total_reports": total_reports,
        "total_users": total_users,
        "categories": categories,
    }

