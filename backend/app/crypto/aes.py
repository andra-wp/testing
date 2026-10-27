import secrets
from Crypto.Cipher import AES

AES_CTR_NONCE_SIZE = 8


def encrypt_aes(key: bytes, data: bytes) -> tuple[bytes, bytes]:
    nonce = secrets.token_bytes(AES_CTR_NONCE_SIZE)
    ciphertext = AES.new(key, AES.MODE_CTR, nonce=nonce).encrypt(data)
    return nonce, ciphertext


def decrypt_aes(key: bytes, nonce: bytes, ciphertext: bytes) -> bytes:
    return AES.new(key, AES.MODE_CTR, nonce=nonce).decrypt(ciphertext)
