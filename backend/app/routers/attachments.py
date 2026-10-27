"""Lampiran milik pelapor: unduh (HANYA pemilik, setelah lolos verifikasi integritas) dan kelola izin petugas."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.background import BackgroundTask

from .. import audit
from ..crypto import vault
from ..db import get_db
from ..security import get_current_user, require_pelapor
from ..services import access
from ..services import reports as svc
from .common import cipher_query

router = APIRouter(prefix="/api/attachments", tags=["lampiran"])


def _owned(db, att_id: str, user: dict):
    row = db.execute("SELECT * FROM attachments WHERE id=?", (att_id,)).fetchone()
    if row is None or row["owner_id"] != user["id"]:
        if row is not None:
            audit.log(db, user, "attachment.access_denied", "attachment", att_id)
            db.commit()
        # 404 juga untuk milik orang lain: tidak membocorkan keberadaan file
        raise HTTPException(404, "Lampiran tidak ditemukan")
    return row


@router.get("/{att_id}/download")
def download(att_id: str, cipher: str = Depends(cipher_query), user=Depends(get_current_user), db=Depends(get_db)):
    row = _owned(db, att_id, user)
    filename = vault.read_text(db, "attachment", att_id, "filename", cipher) or f"lampiran-{att_id[:8]}"
    path, ms = vault.decrypt_to_tempfile(db, "attachment", att_id, "content", cipher)
    audit.log(db, user, "attachment.download", "attachment", att_id, f"cipher={cipher}")
    db.commit()
    return FileResponse(
        path, media_type=row["mime"], filename=filename,
        headers={"X-Cipher": cipher, "X-Integrity": "verified", "X-Decrypt-Ms": f"{ms:.3f}",
                 "Cache-Control": "no-store"},
        background=BackgroundTask(path.unlink, missing_ok=True),
    )


@router.get("/{att_id}/verify")
def verify(att_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Dekripsi ketiga versi (AES, DES, RC4) dan bandingkan dengan HMAC plaintext asli."""
    _owned(db, att_id, user)
    results = vault.verify_all(db, "attachment", att_id, "content")
    audit.log(db, user, "attachment.verify", "attachment", att_id)
    db.commit()
    return {"all_ok": all(r["ok"] for r in results), "results": results}


class AccessIn(BaseModel):
    action: Literal["grant", "deny", "revoke"]


_ACTION_TEXT = {
    "grant": "Pelapor mengizinkan petugas melihat lampiran {no} ({kind}).",
    "deny": "Pelapor menolak permintaan akses ke lampiran {no} ({kind}).",
    "revoke": "Pelapor mencabut izin petugas untuk lampiran {no} ({kind}).",
}


@router.put("/{att_id}/access")
def set_access(att_id: str, body: AccessIn, user=Depends(require_pelapor), db=Depends(get_db)):
    """Pelapor memberi, menolak, atau mencabut izin petugas untuk satu file."""
    att = _owned(db, att_id, user)
    if att["kind"] == "ktp" or att["report_id"] is None:
        raise HTTPException(400, "Scan KTP tidak dapat dibagikan ke petugas")
    report = svc.get_report_row(db, att["report_id"], owner_id=user["id"])
    if report["status"] in access.CLOSED and body.action == "grant":
        raise HTTPException(409, "Laporan sudah ditutup")
    current = access.status_of(db, att_id)
    if body.action == "grant":
        if current == "granted":
            raise HTTPException(409, "File ini sudah diizinkan")
        access.set_grant(db, att, "granted", source="request" if current == "requested" else "owner")
    elif body.action == "deny":
        if current != "requested":
            raise HTTPException(409, "Tidak ada permintaan akses yang menunggu")
        access.set_grant(db, att, "denied", source="request")
    else:
        if current != "granted":
            raise HTTPException(409, "File ini belum diizinkan")
        access.set_grant(db, att, "revoked", source="owner")
    no = svc.attachment_no(db, att)
    svc.add_event(db, report, user, type_="note", note=_ACTION_TEXT[body.action].format(no=no, kind=att["kind"]))
    audit.log(db, user, f"attachment.access_{body.action}", "attachment", att_id)
    db.commit()
    return {"status": access.status_of(db, att_id)}
