import hashlib
import hmac
import secrets

PBKDF2_ROUNDS = 600_000
SALT_SIZE = 16
HASH_SIZE = 32 


def generate_salt(length: int = SALT_SIZE) -> bytes:
    return secrets.token_bytes(length)


def hash_password(password: str, salt: bytes) -> bytes:
    if not password:
        raise ValueError("Password tidak boleh kosong.")
    if len(salt) != SALT_SIZE:
        raise ValueError("Salt harus sepanjang 16 byte.")

    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ROUNDS,
        dklen=HASH_SIZE,
    )


def verify_password(password: str, salt: bytes, expected_hash: bytes) -> bool:
    if not password or not salt or not expected_hash:
        return False
    computed_hash = hash_password(password, salt)
    return hmac.compare_digest(computed_hash, expected_hash)


def generate_token(nbytes: int = 32) -> str:
    return secrets.token_urlsafe(nbytes)
