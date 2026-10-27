from __future__ import annotations

import base64
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
    fields: dict[str, Any] = {
        "algorithm": algorithm,
        "mode": "CTR" if algorithm in {"AES", "DES"} else "STREAM",
        "name": name,
        "category": category,
        "notes": notes,
        "salt": b64(salt),
    }

    if algorithm == "AES":
        key = derive(password, salt, 32)
        nonce, ciphertext = encrypt_aes(key, data)
        fields.update(nonce=b64(nonce), iv=b64(nonce), ciphertext=b64(ciphertext))

    elif algorithm == "DES":
        key = derive(password, salt, 8)
        nonce, ciphertext = encrypt_des(key, data)
        fields.update(nonce=b64(nonce), iv=b64(nonce), ciphertext=b64(ciphertext))

    else:
        key = derive(password, salt, 32)
        ciphertext = encrypt_rc4(key, data)
        fields.update(ciphertext=b64(ciphertext))

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

    try:
        if algorithm == "AES":
            key = derive(password, salt, 32)
            data = decrypt_aes(key, nonce, ciphertext)

        elif algorithm == "DES":
            key = derive(password, salt, 8)
            data = decrypt_des(key, nonce, ciphertext)

        else:
            key = derive(password, salt, 32)
            data = decrypt_rc4(key, ciphertext)

    except ValueError as exc:
        raise ValueError("Wrong password or corrupted envelope.") from exc

    return data, str(fields.get("name", "data"))
