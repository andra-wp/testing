"""Membuat akun petugas CSIRT (tidak bisa mendaftar lewat web).

    python -m scripts.create_officer --email petugas@csirt.local --name "Petugas Satu"
"""
import argparse
import getpass
import sys

from app.crypto import vault
from app.db import connect, init_db, new_id, now
from app.security import blind_index, hash_password


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--password", help="kosongkan untuk diketik secara tersembunyi")
    a = ap.parse_args()
    password = a.password or getpass.getpass("Kata sandi petugas (min 10 karakter): ")
    if not 10 <= len(password) <= 64:
        sys.exit("Kata sandi harus 10-64 karakter")

    init_db()
    db = connect()
    email = a.email.strip().lower()
    if db.execute("SELECT 1 FROM users WHERE email_bidx=?", (blind_index(email),)).fetchone():
        sys.exit("Email sudah terdaftar")
    uid = new_id()
    db.execute(
        "INSERT INTO users (id, email_bidx, password_hash, role, consent_at, created_at) VALUES (?,?,?,?,?,?)",
        (uid, blind_index(email), hash_password(password), "petugas", None, now()),
    )
    vault.store_text(db, email, owner_id=uid, ref_type="user", ref_id=uid, field="email")
    vault.store_text(db, a.name, owner_id=uid, ref_type="user", ref_id=uid, field="full_name")
    db.commit()
    print(f"Akun petugas {email} dibuat.")


if __name__ == "__main__":
    main()
