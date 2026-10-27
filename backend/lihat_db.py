"""
Skrip Pembantu Demo Ujian / Forensik:
Melihat langsung isi database SQLite `ciphervault.db` untuk membuktikan bahwa:
1. Password pengguna TIDAK disimpan polos, melainkan berupa Salt + PBKDF2 hash.
2. Berkas bukti TIDAK disimpan polos, melainkan berupa Ciphertext (AES/DES/RC4).
"""
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "instances" / "ciphervault.db"

if not DB_PATH.exists():
    print(f"Database belum dibuat di: {DB_PATH}")
    exit(0)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

print("          INSPEKSI DATABASE KEAMANAN: CIPHERVAULT.DB")

# 1. Tabel Users
print("\n[1] TABEL PENGGUNA (USERS):")
print(f"{'ID':<4} {'Username':<18} {'Role':<8} {'Password Hash (PBKDF2-HMAC-SHA256)':<36}")
print("-" * 70)
users = conn.execute("SELECT id, username, role, hex(salt) as salt_hex, hex(password_hash) as hash_hex FROM users").fetchall()
if not users:
    print("Belum ada pengguna terdaftar.")
else:
    for u in users:
        print(f"#{u['id']:<3} {u['username']:<18} {u['role']:<8} {u['hash_hex'][:30]}... (Salt: {u['salt_hex'][:12]}...)")

# 2. Tabel Evidences
print("\n[2] TABEL BARANG BUKTI TERENKRIPSI (EVIDENCES):")
print(f"{'ID':<4} {'Pelapor':<14} {'Kategori':<12} {'Nama File':<20} {'Algoritma':<10} {'Ukuran':<10}")
print("-" * 70)
evidences = conn.execute("""
    SELECT e.id, u.username as reporter, e.category, e.filename, e.algorithm, e.mode, e.filesize, e.envelope_json
    FROM evidences e
    JOIN users u ON e.user_id = u.id
    ORDER BY e.id DESC
""").fetchall()

if not evidences:
    print("Belum ada barang bukti yang tersimpan di database.")
else:
    for ev in evidences:
        cat = ev['category'] or 'unknown'
        algo_mode = f"{ev['algorithm']}-{ev['mode']}"
        size_kb = f"{(ev['filesize'] or 0)/1024:.1f} KB"
        
        # Ekstrak preview ciphertext
        ct_preview = ""
        try:
            env = json.loads(ev['envelope_json'])
            ct_preview = env.get('ciphertext', '')[:28] + "..."
        except Exception:
            pass

        print(f"#{ev['id']:<3} {ev['reporter']:<14} {cat:<12} {ev['filename'][:19]:<20} {algo_mode:<10} {size_kb:<10}")
        if ct_preview:
            print(f"     └─ Ciphertext Preview: {ct_preview}")

print("\n" + "=" * 70)

