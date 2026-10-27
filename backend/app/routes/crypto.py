import json
import mimetypes
import urllib.parse
from typing import Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from app.crypto.ciphers import encryptbytes, decryptbytes
from app.models.database import save_evidence
from app.models.schemas import (
    EncryptTextRequest,
    DecryptRequest,
    EncryptResponse,
    DecryptResponse,
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/crypto", tags=["Cryptography"])

MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024


# ==========================================
# 1. TEXT ENCRYPTION & DECRYPTION (JSON BODY)
# ==========================================

@router.post("/encrypt", response_model=EncryptResponse, summary="Encrypt plaintext (Login Required)")
def encrypt_text(
    request: EncryptTextRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    try:
        data_bytes = request.text.encode("utf-8")
        result = encryptbytes(
            data=data_bytes,
            password=request.password,
            algorithm=request.algorithm,
            mode=request.mode,
            name=request.name,
        )
        envelope = json.loads(result) if isinstance(result, str) else result
        return EncryptResponse(success=True, envelope=envelope)

    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Encryption error: {exc}")


@router.post("/decrypt", response_model=DecryptResponse, summary="Decrypt an encrypted envelope (Login Required)")
def decrypt_text(
    request: DecryptRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    try:
        envelope_json = json.dumps(request.envelope)
        decrypted_bytes, original_name = decryptbytes(
            envelope=envelope_json,
            password=request.password,
        )

        try:
            plaintext = decrypted_bytes.decode("utf-8")
        except UnicodeDecodeError:
            plaintext = f"[Binary data: {len(decrypted_bytes)} bytes, not displayable as plain text]"

        return DecryptResponse(
            success=True,
            original_name=original_name,
            plaintext=plaintext,
        )

    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Decryption error: {exc}")


# ==========================================
# 2. FILE ENCRYPTION & DECRYPTION (MULTIPART)
# ==========================================

@router.post("/encrypt-file", summary="Encrypt any file into a JSON envelope (Login Required)")
async def encrypt_file(
    file: UploadFile = File(..., description="File to encrypt"),
    password: str = Form(..., description="Password used to encrypt"),
    algorithm: str = Form("AES", description="Algorithm: AES, DES, or RC4"),
    mode: str = Form("CBC", description="Mode for AES/DES: CBC, CTR, OFB, or CFB"),
    notes: str = Form("", description="Ringkasan kasus atau catatan bukti"),
    category: str = Form("", description="Kategori bukti"),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    try:
        data_bytes = await file.read()
        if len(data_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size ({MAX_FILE_SIZE_BYTES // (1024*1024)} MB).",
            )

        original_filename = file.filename or "file.bin"

        envelope_str = encryptbytes(
            data=data_bytes,
            password=password,
            algorithm=algorithm,
            mode=mode,
            name=original_filename,
            notes=notes,
            category=category,
        )

        # Simpan riwayat bukti terenkripsi ke database
        try:
            save_evidence(
                user_id=current_user["user_id"],
                category=category,
                filename=original_filename,
                algorithm=algorithm,
                mode=mode,
                notes=notes,
                filesize=len(data_bytes),
                envelope_json=envelope_str,
            )
        except Exception:
            pass  # Tetap lanjutkan download jika db logging error

        mode_suffix = f"-{mode.lower()}" if algorithm.upper() in {"AES", "DES"} else ""
        envelope_filename = f"{original_filename}.{algorithm.lower()}{mode_suffix}.json"

        return Response(
            content=envelope_str,
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="{envelope_filename}"',
                "X-Filename": envelope_filename,
            },
        )

    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"File encryption failed: {exc}")


@router.post("/decrypt-file", summary="Decrypt a JSON envelope back into original file (Login Required)")
async def decrypt_file(
    file: UploadFile = File(..., description="The .json envelope file to decrypt"),
    password: str = Form(..., description="Password to decrypt the file"),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    try:
        envelope_bytes = await file.read()

        decrypted_bytes, original_filename = decryptbytes(
            envelope=envelope_bytes,
            password=password,
        )

        # Ekstrak metadata notes dan category dari envelope JSON
        notes_str = ""
        category_str = ""
        try:
            env_json = json.loads(envelope_bytes)
            notes_str = str(env_json.get("notes", ""))
            category_str = str(env_json.get("category", ""))
        except Exception:
            pass

        mime_type, _ = mimetypes.guess_type(original_filename)
        if not mime_type:
            mime_type = "application/octet-stream"

        return Response(
            content=decrypted_bytes,
            media_type=mime_type,
            headers={
                "Content-Disposition": f'attachment; filename="{original_filename}"',
                "X-Filename": original_filename,
                "X-Notes": urllib.parse.quote(notes_str),
                "X-Category": category_str,
            },
        )

    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"File decryption failed: {exc}")
