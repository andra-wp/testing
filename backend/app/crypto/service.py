from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from typing import Any

from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import PBKDF2

from .aes import encrypt_aes, decrypt_aes
from .des import encrypt_des, decrypt_des
from .rc4 import encrypt_rc4, decrypt_rc4

SALT_SIZE = 16
PBKDF2_ROUNDS = 600_000
ALGORITHMS = {"AES", "DES", "RC4"}
BLOCK_MODES = {"CTR"}


def b64(value: bytes) -> str:
    return base64.b64encode(value).decode("ascii")


def unb64(value: str) -> bytes:
    return base64.b64decode(value.encode("ascii"), validate=True)


def derive(password: str, salt: bytes, length: int) -> bytes:
    if not password:
        raise ValueError("Password must not be empty.")
    return PBKDF2(password, salt, dkLen=length, count=PBKDF2_ROUNDS, hmac_hash_module=SHA256)


def encryptbytes(
    data: bytes,
    password: str,
    algorithm: str = "AES",
    mode: str = "CTR",
    name: str = "data",
    notes: str = "",
    category: str = "",
) -> str:
    algorithm = algorithm.upper()
    mode = "CTR"

    if "-" in algorithm:
        parts = algorithm.split("-", 1)
        algorithm = parts[0]

    if algorithm not in ALGORITHMS:
        raise ValueError(f"Algorithm must be one of {', '.join(sorted(ALGORITHMS))}")

    salt = secrets.token_bytes(SALT_SIZE)
    master_key = derive(password, salt, 64)
    mac_key = master_key[32:64]

    fields: dict[str, Any] = {
        "algorithm": algorithm,
        "mode": "CTR" if algorithm in {"AES", "DES"} else "STREAM",
        "name": name,
        "category": category,
        "notes": notes,
        "salt": b64(salt),
    }

    nonce = b""
    if algorithm == "AES":
        enc_key = master_key[:32]
        nonce, ciphertext = encrypt_aes(enc_key, data)
        fields.update(nonce=b64(nonce), iv=b64(nonce), ciphertext=b64(ciphertext))

    elif algorithm == "DES":
        enc_key = master_key[:8]
        nonce, ciphertext = encrypt_des(enc_key, data)
        fields.update(nonce=b64(nonce), iv=b64(nonce), ciphertext=b64(ciphertext))

    else:
        enc_key = master_key[:32]
        ciphertext = encrypt_rc4(enc_key, data)
        fields.update(ciphertext=b64(ciphertext))

    # Authenticated Encryption (Encrypt-then-MAC via HMAC-SHA256)
    # Menjamin integritas berkas dan mendeteksi kesalahan password saat dekripsi
    mac_data = (nonce if (algorithm in {"AES", "DES"} and nonce) else b"") + ciphertext
    mac_tag = hmac.new(mac_key, mac_data, hashlib.sha256).digest()
    fields["mac"] = b64(mac_tag)

    return json.dumps(fields, indent=4)


def decryptbytes(envelope: str | bytes, password: str) -> tuple[bytes, str]:
    try:
        fields = json.loads(envelope)
        algorithm = fields["algorithm"].upper()
        mode = fields.get("mode", "CTR").upper()

        if "-" in algorithm:
            parts = algorithm.split("-", 1)
            algorithm = parts[0]

        salt = unb64(fields["salt"])
        ciphertext = unb64(fields["ciphertext"])

        iv = unb64(fields["iv"]) if "iv" in fields and fields["iv"] else b""
        nonce = unb64(fields["nonce"]) if "nonce" in fields and fields["nonce"] else iv
    except (UnicodeDecodeError, json.JSONDecodeError, KeyError, TypeError, AttributeError, ValueError) as exc:
        raise ValueError("The encrypted file is not a valid envelope.") from exc

    if algorithm not in ALGORITHMS:
        raise ValueError(f"Unsupported algorithm: {algorithm}")
    if algorithm in {"AES", "DES"} and mode != "CTR":
        raise ValueError(f"Hanya mode CTR yang didukung untuk {algorithm} (ditemukan mode: {mode}).")
    if len(salt) != SALT_SIZE:
        raise ValueError("Invalid salt.")

    master_key = derive(password, salt, 64)
    mac_key = master_key[32:64]

    # 1. Verifikasi Integritas & Validitas Kunci melalui HMAC Tag jika tersedia
    if "mac" in fields and fields["mac"]:
        try:
            expected_mac = unb64(fields["mac"])
            mac_data = (nonce if (algorithm in {"AES", "DES"} and nonce) else b"") + ciphertext
            actual_mac = hmac.new(mac_key, mac_data, hashlib.sha256).digest()
            if not hmac.compare_digest(expected_mac, actual_mac):
                raise ValueError("Kata sandi salah atau berkas telah dimanipulasi.")
        except (ValueError, TypeError) as exc:
            raise ValueError("Kata sandi salah atau berkas telah dimanipulasi.") from exc

    # 2. Dekripsi Ciphertext
    try:
        if algorithm == "AES":
            enc_key = master_key[:32]
            data = decrypt_aes(enc_key, nonce, ciphertext)

        elif algorithm == "DES":
            enc_key = master_key[:8]
            data = decrypt_des(enc_key, nonce, ciphertext)

        else:
            enc_key = master_key[:32]
            data = decrypt_rc4(enc_key, ciphertext)

    except ValueError as exc:
        raise ValueError("Kata sandi salah atau berkas rusak.") from exc

    # 3. Fallback Heuristik untuk berkas envelope lama yang belum memiliki tag MAC
    if "mac" not in fields or not fields["mac"]:
        filename = str(fields.get("name", "")).lower()
        if filename.endswith((".png", ".jpg", ".jpeg", ".pdf", ".gif", ".zip", ".docx", ".xlsx", ".mp4")):
            is_valid = False
            if filename.endswith(".png") and data.startswith(b"\x89PNG\r\n\x1a\n"):
                is_valid = True
            elif filename.endswith((".jpg", ".jpeg")) and data.startswith(b"\xff\xd8\xff"):
                is_valid = True
            elif filename.endswith(".pdf") and data.startswith(b"%PDF-"):
                is_valid = True
            elif filename.endswith(".gif") and data.startswith((b"GIF87a", b"GIF89a")):
                is_valid = True
            elif filename.endswith((".zip", ".docx", ".xlsx")) and data.startswith(b"PK\x03\x04"):
                is_valid = True
            elif filename.endswith(".mp4") and (b"ftyp" in data[:32] or data.startswith(b"\x00\x00\x00")):
                is_valid = True

            if not is_valid:
                raise ValueError("Kata sandi salah atau berkas rusak.")

    return data, str(fields.get("name", "data"))
