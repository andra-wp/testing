import secrets
from Crypto.Cipher import DES

DES_CTR_NONCE_SIZE = 4


def encrypt_des(key: bytes, data: bytes) -> tuple[bytes, bytes]:
    nonce = secrets.token_bytes(DES_CTR_NONCE_SIZE)
    ciphertext = DES.new(key, DES.MODE_CTR, nonce=nonce).encrypt(data)
    return nonce, ciphertext


def decrypt_des(key: bytes, nonce: bytes, ciphertext: bytes) -> bytes:
    return DES.new(key, DES.MODE_CTR, nonce=nonce).decrypt(ciphertext)
