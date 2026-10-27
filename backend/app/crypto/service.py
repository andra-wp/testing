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

    mac_data = (nonce if (algorithm in {"AES", "DES"} and nonce) else b"") + ciphertext
    mac_tag = hmac.new(mac_key, mac_data, hashlib.sha256).digest()
    fields["mac"] = b64(mac_tag)

    return json.dumps(fields, indent=4)


def decryptbytes(envelope: str | bytes, password: str) -> tuple[bytes, str]:
    try:
        fields = json.loads(envelope)
        algorithm = fields["algorithm"].upper()
        salt = unb64(fields["salt"])
        ciphertext = unb64(fields["ciphertext"])
        nonce = unb64(fields.get("nonce") or fields.get("iv") or "")
    except (UnicodeDecodeError, json.JSONDecodeError, KeyError, TypeError, AttributeError, ValueError) as exc:
        raise ValueError("The encrypted file is not a valid envelope.") from exc

    if algorithm not in ALGORITHMS:
        raise ValueError(f"Unsupported algorithm: {algorithm}")
    if len(salt) != SALT_SIZE:
        raise ValueError("Invalid salt.")

    keys = derive(password, salt, 64)
    mac_key = keys[32:]

    if "mac" in fields:
        mac_data = (nonce if algorithm in {"AES", "DES"} else b"") + ciphertext
        if not hmac.compare_digest(unb64(fields["mac"]), hmac.new(mac_key, mac_data, hashlib.sha256).digest()):
            raise ValueError("Wrong password or corrupted envelope.")

    # 3. Dekripsi Sesuai Algoritma
    if algorithm == "AES":
        data = decrypt_aes(keys[:32], nonce, ciphertext)
    elif algorithm == "DES":
        data = decrypt_des(keys[:8], nonce, ciphertext)
    else:
        data = decrypt_rc4(keys[:32], ciphertext)

    return data, str(fields.get("name", "data"))