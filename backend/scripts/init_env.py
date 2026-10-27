"""Membuat .env berisi kunci acak lalu menyiapkan database.

    python -m scripts.init_env
"""
import base64
import os
import secrets
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV = ROOT / ".env"


def main() -> None:
    if ENV.exists():
        print(f".env sudah ada di {ENV}, tidak ditimpa (kunci lama dibutuhkan untuk membuka data lama).")
    else:
        k = lambda: base64.b64encode(os.urandom(32)).decode()
        ENV.write_text(
            f"MASTER_KEY={k()}\nINTEGRITY_KEY={k()}\nBLIND_INDEX_KEY={k()}\n"
            f"JWT_SECRET={secrets.token_urlsafe(48)}\nJWT_EXP_MINUTES=120\n"
            "DB_PATH=data/lapor.db\nSTORAGE_DIR=storage\nMAX_UPLOAD_MB=200\n"
            "CORS_ORIGINS=http://localhost:5173\n"
        )
        try:
            os.chmod(ENV, 0o600)
        except OSError:
            pass
        print(f"Kunci baru dibuat di {ENV}. JANGAN dibagikan atau di-commit.")

    sys.path.insert(0, str(ROOT))
    from app.db import init_db
    init_db()
    print("Database siap.")


if __name__ == "__main__":
    main()
