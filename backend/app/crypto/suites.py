"""Tiga skema enkripsi yang dipakai aplikasi.

| Skema         | Cipher            | Mode / konstruksi                     | Integritas            |
|---------------|-------------------|---------------------------------------|-----------------------|
| AES-256-GCM   | AES, kunci 256 bit| GCM (CTR + GHASH), nonce acak 96 bit  | tag GCM 128 bit       |
| DES-CBC-HMAC  | DES, kunci 56 bit | CBC, IV acak 64 bit, padding PKCS#7   | HMAC-SHA256 (EtM)     |
| RC4-HMAC      | RC4, kunci 128 bit| stream, buang 3072 byte awal keystream| HMAC-SHA256 (EtM)     |

ECB tidak dipakai: pola plaintext yang sama menghasilkan blok ciphertext yang sama.
CBC dan RC4 sendiri tidak menjamin integritas (ciphertext bisa diubah tanpa ketahuan),
sehingga keduanya dibungkus Encrypt-then-MAC. Setiap item memakai kunci acak baru,
jadi nonce/IV/kunci RC4 tidak pernah dipakai ulang.

Semua skema mendukung streaming per potongan (chunk) agar video besar tidak perlu
dimuat utuh ke memori.
"""
import hashlib
import hmac
import os
from typing import BinaryIO, Iterator

from Crypto.Cipher import AES, ARC4, DES
from Crypto.Util.Padding import pad, unpad

CHUNK_SIZE = 1024 * 1024  # 1 MiB, kelipatan blok 8 dan 16


class IntegrityError(Exception):
    """Ciphertext, IV, tag, atau konteks tidak cocok: data rusak atau dimodifikasi."""


def read_chunks(src: BinaryIO) -> Iterator[bytes]:
    while chunk := src.read(CHUNK_SIZE):
        yield chunk


# ---------------------------------------------------------------- AES-GCM
class _GCMEncryptor:
    def __init__(self, key: bytes, aad: bytes):
        self.iv = os.urandom(12)
        self._c = AES.new(key, AES.MODE_GCM, nonce=self.iv, mac_len=16)
        self._c.update(aad)

    def update(self, data: bytes) -> bytes:
        return self._c.encrypt(data)

    def finalize(self) -> tuple[bytes, bytes]:
        return b"", self._c.digest()


class AESGCMSuite:
    name = "AES-256-GCM"
    key_len = 32

    def new_key(self) -> bytes:
        return os.urandom(self.key_len)

    def encryptor(self, key: bytes, aad: bytes) -> _GCMEncryptor:
        return _GCMEncryptor(key, aad)

    def decrypt_stream(self, key, aad, iv, tag, src: BinaryIO, dst) -> None:
        c = AES.new(key, AES.MODE_GCM, nonce=iv, mac_len=16)
        c.update(aad)
        for chunk in read_chunks(src):
            dst.write(c.decrypt(chunk))
        try:
            c.verify(tag)
        except ValueError as exc:
            raise IntegrityError("Tag AES-GCM tidak cocok") from exc


# ------------------------------------------------- Encrypt-then-MAC (DES, RC4)
def _new_mac(mac_key: bytes, aad: bytes, iv: bytes):
    m = hmac.new(mac_key, digestmod=hashlib.sha256)
    m.update(len(aad).to_bytes(8, "big") + aad + iv)
    return m


class _EtMSuite:
    enc_key_len = 0
    mac_key_len = 32

    @property
    def key_len(self) -> int:
        return self.enc_key_len + self.mac_key_len

    def new_key(self) -> bytes:
        return os.urandom(self.key_len)

    def _split(self, key: bytes) -> tuple[bytes, bytes]:
        return key[: self.enc_key_len], key[self.enc_key_len :]

    def _verify_mac(self, mac_key, aad, iv, tag, src: BinaryIO) -> None:
        """MAC diverifikasi DULU atas seluruh ciphertext, baru didekripsi."""
        m = _new_mac(mac_key, aad, iv)
        for chunk in read_chunks(src):
            m.update(chunk)
        if not hmac.compare_digest(m.digest(), tag):
            raise IntegrityError(f"HMAC {self.name} tidak cocok")
        src.seek(0)


class _CBCEncryptor:
    def __init__(self, cipher, mac, iv: bytes, block: int):
        self.iv = iv
        self._c, self._mac, self._bs = cipher, mac, block
        self._buf = b""

    def update(self, data: bytes) -> bytes:
        if not self._buf and len(data) % self._bs == 0:
            buf, self._buf = data, b""
        else:
            buf = self._buf + data
            cut = len(buf) - len(buf) % self._bs
            buf, self._buf = buf[:cut], buf[cut:]
        out = self._c.encrypt(buf) if buf else b""
        self._mac.update(out)
        return out

    def finalize(self) -> tuple[bytes, bytes]:
        out = self._c.encrypt(pad(self._buf, self._bs))
        self._mac.update(out)
        return out, self._mac.digest()


class DESCBCHMACSuite(_EtMSuite):
    name = "DES-CBC-HMAC"
    enc_key_len = 8  # 56 bit efektif (8 bit paritas diabaikan)
    block = 8

    def encryptor(self, key: bytes, aad: bytes) -> _CBCEncryptor:
        ek, mk = self._split(key)
        iv = os.urandom(self.block)
        return _CBCEncryptor(DES.new(ek, DES.MODE_CBC, iv=iv), _new_mac(mk, aad, iv), iv, self.block)

    def decrypt_stream(self, key, aad, iv, tag, src: BinaryIO, dst) -> None:
        ek, mk = self._split(key)
        self._verify_mac(mk, aad, iv, tag, src)
        c = DES.new(ek, DES.MODE_CBC, iv=iv)
        held = b""  # blok terakhir ditahan sampai akhir untuk membuang padding
        for chunk in read_chunks(src):
            if len(chunk) % self.block:
                raise IntegrityError("Panjang ciphertext DES tidak valid")
            pt = held + c.decrypt(chunk)
            dst.write(pt[: -self.block])
            held = pt[-self.block :]
        if not held:
            raise IntegrityError("Ciphertext DES kosong")
        try:
            dst.write(unpad(held, self.block))
        except ValueError as exc:
            raise IntegrityError("Padding DES tidak valid") from exc


class _StreamEncryptor:
    def __init__(self, cipher, mac):
        self.iv = b""
        self._c, self._mac = cipher, mac

    def update(self, data: bytes) -> bytes:
        out = self._c.encrypt(data)
        self._mac.update(out)
        return out

    def finalize(self) -> tuple[bytes, bytes]:
        return b"", self._mac.digest()


class RC4HMACSuite(_EtMSuite):
    name = "RC4-HMAC"
    enc_key_len = 16  # 128 bit
    DROP = 3072       # buang awal keystream yang bias (RC4-drop[3072])

    def encryptor(self, key: bytes, aad: bytes) -> _StreamEncryptor:
        ek, mk = self._split(key)
        return _StreamEncryptor(ARC4.new(ek, drop=self.DROP), _new_mac(mk, aad, b""))

    def decrypt_stream(self, key, aad, iv, tag, src: BinaryIO, dst) -> None:
        ek, mk = self._split(key)
        self._verify_mac(mk, aad, b"", tag, src)
        c = ARC4.new(ek, drop=self.DROP)
        for chunk in read_chunks(src):
            dst.write(c.decrypt(chunk))


SUITES = {s.name: s for s in (AESGCMSuite(), DESCBCHMACSuite(), RC4HMACSuite())}
