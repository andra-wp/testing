import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.database import get_db
from app.models import (
    get_all_evidences,
    get_evidence_by_id,
    create_case,
    get_all_cases,
    get_case_by_id,
    get_evidences_by_case,
    update_case_status,
    assign_evidence_to_case,
    CaseCreateRequest,
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Administrator & Investigation"])


def require_admin(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
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
            "case_id": ev.get("case_id"),
            "case_title": ev.get("case_title"),
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

@router.get("/cases", summary="Daftar Kasus Insiden Siber (Khusus Admin)")
def list_cases(admin: dict[str, Any] = Depends(require_admin)):
    cases = get_all_cases()
    return {"success": True, "count": len(cases), "cases": cases}


@router.post("/cases", summary="Membuat Kasus Insiden Baru (Khusus Admin)")
def add_case(request: CaseCreateRequest, admin: dict[str, Any] = Depends(require_admin)):
    case_id = create_case(
        title=request.title,
        description=request.description or "",
        status=request.status or "OPEN",
        created_by=admin.get("user_id"),
    )
    return {"success": True, "case_id": case_id, "message": "Kasus berhasil dibuat."}


@router.get("/cases/{case_id}", summary="Detail Kasus & Bukti Terkait (Khusus Admin)")
def case_detail(case_id: int, admin: dict[str, Any] = Depends(require_admin)):
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kasus tidak ditemukan.")
    evidences = get_evidences_by_case(case_id)
    return {"success": True, "case": case, "evidences": evidences}


@router.patch("/cases/{case_id}/status", summary="Update Status Kasus (Khusus Admin)")
def change_case_status(case_id: int, status_val: str, admin: dict[str, Any] = Depends(require_admin)):
    updated = update_case_status(case_id, status_val)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kasus tidak ditemukan.")
    return {"success": True, "message": f"Status kasus berhasil diubah menjadi {status_val.upper()}."}


@router.post("/cases/{case_id}/assign/{evidence_id}", summary="Tautkan Bukti ke Kasus (Khusus Admin)")
def link_evidence_case(case_id: int, evidence_id: int, admin: dict[str, Any] = Depends(require_admin)):
    success = assign_evidence_to_case(evidence_id, case_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bukti atau kasus tidak ditemukan.")
    return {"success": True, "message": "Bukti berhasil ditautkan ke kasus."}
