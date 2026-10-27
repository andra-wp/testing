from Crypto.Cipher import ARC4


def encrypt_rc4(key: bytes, data: bytes) -> bytes:
    return ARC4.new(key).encrypt(data)


def decrypt_rc4(key: bytes, ciphertext: bytes) -> bytes:
    return ARC4.new(key).decrypt(ciphertext)

