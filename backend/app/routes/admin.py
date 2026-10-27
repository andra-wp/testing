import json
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from app.models.database import get_db
from app.models import (
    get_all_evidences,
    get_evidence_by_id,
    get_envelope_by_id,
    delete_evidence,
    create_case,
    get_all_cases,
    get_case_by_id,
    get_evidences_by_case,
    update_case_status,
    assign_evidence_to_case,
    CaseCreateRequest,
)
from app.dependencies import get_current_user, require_admin, require_role

router = APIRouter(prefix="/api/admin", tags=["Administrator & Investigation"])


@router.get("/reports", summary="Melihat semua berkas bukti yang diunggah pengguna (Khusus Admin)")
def list_reports(
    limit: int = Query(50, ge=1, le=100, description="Jumlah data per halaman"),
    offset: int = Query(0, ge=0, description="Offset data"),
    search: Optional[str] = Query(None, description="Pencarian nama file atau catatan"),
    category: Optional[str] = Query(None, description="Filter kategori kejahatan"),
    case_id: Optional[int] = Query(None, description="Filter berdasarkan ID kasus"),
    admin: dict[str, Any] = Depends(require_admin),
):
    """Mengambil seluruh daftar bukti insiden digital dari database SQLite (LEAST PRIVILEGE)."""
    try:
        evidences = get_all_evidences(
            limit=limit,
            offset=offset,
            search=search,
            category=category,
            case_id=case_id,
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))

    return {"success": True, "count": len(evidences), "reports": evidences}


@router.get("/reports/{report_id}", summary="Melihat metadata detail satu bukti (Khusus Admin)")
def report_detail(report_id: int, admin: dict[str, Any] = Depends(require_admin)):
    """Mengambil metadata satu bukti tanpa memuat envelope_json ciphertext."""
    evidence = get_evidence_by_id(report_id)
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bukti tidak ditemukan.")
    return {"success": True, "evidence": evidence}


@router.get("/reports/{report_id}/envelope", summary="Mengunduh berkas envelope JSON laporan tertentu (Khusus Admin)")
def download_envelope(report_id: int, admin: dict[str, Any] = Depends(require_admin)):
    """Mengambil file JSON envelope bukti dari database berdasarkan ID saat diunduh."""
    envelope_data = get_envelope_by_id(report_id)
    if not envelope_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bukti tidak ditemukan.")

    envelope_json = envelope_data["envelope_json"]
    envelope_filename = f"{envelope_data['filename']}.{envelope_data['algorithm'].lower()}-{envelope_data['mode'].lower()}.json"

    return Response(
        content=envelope_json,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{envelope_filename}"',
            "X-Filename": envelope_filename,
        },
    )


@router.delete("/reports/{report_id}", summary="Menghapus berkas bukti secara terkontrol (Khusus Admin)")
def remove_evidence(
    report_id: int,
    force: bool = Query(False, description="Paksa hapus meskipun sudah ditautkan ke kasus"),
    admin: dict[str, Any] = Depends(require_admin),
):
    """Menghapus barang bukti dengan proteksi Chain of Custody."""
    try:
        success = delete_evidence(report_id, force=force)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bukti tidak ditemukan.")
    return {"success": True, "message": "Barang bukti berhasil dihapus."}


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
def list_cases(
    limit: int = 50,
    offset: int = 0,
    admin: dict[str, Any] = Depends(require_admin),
):
    try:
        cases = get_all_cases(limit=limit, offset=offset)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    return {"success": True, "count": len(cases), "cases": cases}


@router.post("/cases", summary="Membuat Kasus Insiden Baru (Khusus Admin)")
def add_case(request: CaseCreateRequest, admin: dict[str, Any] = Depends(require_admin)):
    try:
        case_id = create_case(
            title=request.title,
            description=request.description or "",
            status=request.status or "OPEN",
            created_by=admin.get("user_id"),
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
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
    try:
        updated = update_case_status(case_id, status_val)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kasus tidak ditemukan.")
    return {"success": True, "message": f"Status kasus berhasil diubah menjadi {status_val.upper()}."}


@router.post("/cases/{case_id}/assign/{evidence_id}", summary="Tautkan Bukti ke Kasus (Khusus Admin)")
def link_evidence_case(case_id: int, evidence_id: int, admin: dict[str, Any] = Depends(require_admin)):
    success = assign_evidence_to_case(evidence_id, case_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bukti atau kasus tidak ditemukan.")
    return {"success": True, "message": "Bukti berhasil ditautkan ke kasus."}
