from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import secrets
import sys
from pathlib import Path
from typing import Any

from Crypto.Cipher import AES, ARC4, DES
from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import PBKDF2

VERSION = 1
SALT_SIZE = 16
AES_CTR_NONCE_SIZE = 8
DES_CTR_NONCE_SIZE = 4
PBKDF2_ROUNDS = 600_000
ALGORITHMS = {"AES", "DES", "RC4"}
BLOCK_MODES = {"CTR"}
CIPHERTEXT_DIR = Path(__file__).resolve().parent / "ciphertexts"


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
        nonce = secrets.token_bytes(AES_CTR_NONCE_SIZE)
        ciphertext = AES.new(key, AES.MODE_CTR, nonce=nonce).encrypt(data)
        fields.update(nonce=b64(nonce), iv=b64(nonce), ciphertext=b64(ciphertext))

    elif algorithm == "DES":
        key = derive(password, salt, 8)
        nonce = secrets.token_bytes(DES_CTR_NONCE_SIZE)
        ciphertext = DES.new(key, DES.MODE_CTR, nonce=nonce).encrypt(data)
        fields.update(nonce=b64(nonce), iv=b64(nonce), ciphertext=b64(ciphertext))

    else:
        key = derive(password, salt, 32)
        ciphertext = ARC4.new(key).encrypt(data)
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
            data = AES.new(key, AES.MODE_CTR, nonce=nonce).decrypt(ciphertext)

        elif algorithm == "DES":
            key = derive(password, salt, 8)
            data = DES.new(key, DES.MODE_CTR, nonce=nonce).decrypt(ciphertext)

        else:
            key = derive(password, salt, 32)
            data = ARC4.new(key).decrypt(ciphertext)

    except ValueError as exc:
        raise ValueError("Wrong password or corrupted envelope.") from exc

    return data, str(fields.get("name", "data"))
