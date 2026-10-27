"""Evaluasi praktis AES vs DES vs RC4 untuk skenario Lapor Siber.

Jalankan dari folder backend:
    python -m benchmark.run_benchmark            # lengkap (video 64 MB)
    python -m benchmark.run_benchmark --quick    # cepat (video 16 MB, sampel lebih sedikit)

Yang diukur dan alasannya
1. Waktu enkripsi/dekripsi per jenis data di skenario (NIK, kronologi, scan KTP,
   dokumen, video) memakai skema PERSIS seperti di aplikasi (mode + MAC + key wrap).
   -> menjawab: berapa lama pelapor menunggu saat unggah/unduh.
2. Kecepatan cipher murni (tanpa integritas) + HMAC-SHA256 sendiri.
   -> memisahkan biaya cipher dari biaya MAC, supaya tahu apa yang dominan.
3. Overhead penyimpanan per item (padding, IV, tag, kunci terbungkus).
4. Uji manipulasi: bit-flip acak & serangan terarah, dengan dan tanpa MAC.
5. Kelemahan nyata: bias keystream RC4, biaya brute-force kunci DES, batas
   birthday blok 64-bit DES (Sweet32).

Cara agar angka bisa dipercaya
- data acak dari os.urandom (kecepatan cipher tidak bergantung isi),
- potongan 1 MiB disiapkan di luar pengukuran (I/O disk tidak ikut terukur),
- pemanasan dulu, GC dimatikan saat mengukur, perf_counter_ns,
- payload kecil diulang k kali per sampel agar tiap sampel >= ~20 ms,
- banyak sampel, dilaporkan median + IQR + koefisien variasi (CV),
- opsi --pin mengunci proses ke 1 core.
"""
import argparse
import csv
import gc
import hashlib
import hmac
import json
import math
import os
import platform
import statistics
import sys
import time
from datetime import datetime
from pathlib import Path

import Crypto
from Crypto.Cipher import AES, ARC4, DES
from Crypto.Util.Padding import pad, unpad

from app.crypto import keywrap
from app.crypto.suites import CHUNK_SIZE, SUITES, IntegrityError

KEK = os.urandom(32)
INTEGRITY_KEY = os.urandom(32)
AAD = b"lapor-siber/v1|bench|attachment|x|content"
MiB = 1024 * 1024
SHORT = {"AES-256-GCM": "AES", "DES-CBC-HMAC": "DES", "RC4-HMAC": "RC4"}


# ----------------------------------------------------------------- utilitas
class ListReader:
    """Membaca daftar potongan ciphertext seperti file (tanpa menyalin ulang data)."""

    def __init__(self, parts):
        self.parts = [p for p in parts if p]
        self.i = 0

    def read(self, n=-1):
        if self.i >= len(self.parts):
            return b""
        self.i += 1
        return self.parts[self.i - 1]

    def seek(self, pos):
        self.i = 0


class NullSink:
    def write(self, b):
        pass


def chunks_of(data: bytes):
    return [data[i:i + CHUNK_SIZE] for i in range(0, len(data), CHUNK_SIZE)] or [b""]


def measure(fn, samples: int, target_ms: float = 20.0) -> dict:
    fn(); fn()  # pemanasan
    t0 = time.perf_counter_ns(); fn(); one = time.perf_counter_ns() - t0
    k = max(1, int(target_ms * 1e6 / max(one, 1)))
    times = []
    gc.disable()
    try:
        for _ in range(samples):
            t0 = time.perf_counter_ns()
            for _ in range(k):
                fn()
            times.append((time.perf_counter_ns() - t0) / k)
    finally:
        gc.enable()
    q = statistics.quantiles(times, n=4) if len(times) >= 4 else [min(times), statistics.median(times), max(times)]
    mean = statistics.fmean(times)
    return {"median_ns": statistics.median(times), "p25_ns": q[0], "p75_ns": q[2],
            "min_ns": min(times), "cv": statistics.pstdev(times) / mean if mean else 0.0,
            "samples": samples, "reps_per_sample": k}


# ------------------------------------------------------- skema seperti di aplikasi
def app_encrypt(suite, parts):
    """Sama seperti vault.store_stream untuk SATU cipher (HMAC plaintext dihitung terpisah, sekali per unggahan)."""
    aad = AAD + b"|" + suite.name.encode()
    key = suite.new_key()
    enc = suite.encryptor(key, aad)
    out = [enc.update(p) for p in parts]
    last, tag = enc.finalize()
    out.append(last)
    wrapped = keywrap.wrap(KEK, key, aad)
    return {"iv": enc.iv, "tag": tag, "parts": out, "wrapped": wrapped}


def app_decrypt(suite, blob, sink=None):
    aad = AAD + b"|" + suite.name.encode()
    key = keywrap.unwrap(KEK, blob["wrapped"], aad)
    suite.decrypt_stream(key, aad, blob["iv"], blob["tag"], ListReader(blob["parts"]), sink or NullSink())


class _Collect:
    def __init__(self):
        self.parts = []

    def write(self, b):
        self.parts.append(b)


def plain_hmac(parts):
    m = hmac.new(INTEGRITY_KEY, AAD, hashlib.sha256)
    for p in parts:
        m.update(p)
    return m.digest()


# ------------------------------------------------------------ cipher murni
def raw_ciphers():
    """Tanpa integritas. AES-CTR = inti dari GCM (GCM = CTR + GHASH)."""
    def aes_ctr(parts):
        c = AES.new(os.urandom(32), AES.MODE_CTR, nonce=os.urandom(8))
        for p in parts:
            c.encrypt(p)

    def des_cbc(parts):
        c = DES.new(os.urandom(8), DES.MODE_CBC, iv=os.urandom(8))
        for p in parts[:-1]:
            c.encrypt(p)
        c.encrypt(pad(parts[-1], 8))

    def rc4(parts):
        c = ARC4.new(os.urandom(16), drop=3072)
        for p in parts:
            c.encrypt(p)

    def hmac_sha256(parts):
        m = hmac.new(os.urandom(32), digestmod=hashlib.sha256)
        for p in parts:
            m.update(p)
        m.digest()

    def aes_gcm(parts):
        c = AES.new(os.urandom(32), AES.MODE_GCM, nonce=os.urandom(12))
        for p in parts:
            c.encrypt(p)
        c.digest()

    return {"AES-256-CTR": aes_ctr, "AES-256-GCM (dgn tag)": aes_gcm, "DES-CBC": des_cbc,
            "RC4-drop3072": rc4, "HMAC-SHA256": hmac_sha256}


# ---------------------------------------------------------------- eksperimen
def bench_payloads(payloads, samples_small, samples_big):
    rows = []
    for key, label, size in payloads:
        data = os.urandom(size)
        parts = chunks_of(data)
        for name, suite in SUITES.items():
            blob = app_encrypt(suite, parts)
            got = _Collect(); app_decrypt(suite, blob, got)
            assert b"".join(got.parts) == data, f"roundtrip gagal: {name}"
            n = samples_big if size >= 8 * MiB else samples_small
            e = measure(lambda: app_encrypt(suite, parts), n)
            d = measure(lambda: app_decrypt(suite, blob), n)
            ct_len = sum(len(p) for p in blob["parts"])
            overhead = ct_len - size + len(blob["iv"]) + len(blob["tag"]) + len(blob["wrapped"])
            rows.append({
                "payload": key, "label": label, "size": size, "cipher": name,
                "enc": e, "dec": d, "overhead_bytes": overhead,
                "enc_mbps": size / MiB / (e["median_ns"] / 1e9) if size else None,
                "dec_mbps": size / MiB / (d["median_ns"] / 1e9) if size else None,
            })
            print(f"  {label:<28} {SHORT[name]}  enc {fmt_ns(e['median_ns']):>10}  dec {fmt_ns(d['median_ns']):>10}  "
                  f"CV {e['cv']*100:4.1f}%")
        m = measure(lambda: plain_hmac(parts), samples_big if size >= 8 * MiB else samples_small)
        rows.append({"payload": key, "label": label, "size": size, "cipher": "HMAC plaintext (sekali)",
                     "enc": m, "dec": m, "overhead_bytes": 32,
                     "enc_mbps": size / MiB / (m["median_ns"] / 1e9) if size else None,
                     "dec_mbps": size / MiB / (m["median_ns"] / 1e9) if size else None})
    return rows


def bench_raw(size, samples):
    data = os.urandom(size)
    parts = chunks_of(data)
    out = []
    for name, fn in raw_ciphers().items():
        m = measure(lambda: fn(parts), samples)
        out.append({"primitive": name, "size": size, **m, "mbps": size / MiB / (m["median_ns"] / 1e9)})
        print(f"  {name:<24} {out[-1]['mbps']:8.1f} MB/s  (CV {m['cv']*100:.1f}%)")
    return out


def bench_setup(samples):
    """Biaya tetap per item (payload 0 byte) dan rinciannya."""
    out = {}
    for name, suite in SUITES.items():
        out[f"Total skema {SHORT[name]} (0 byte)"] = measure(lambda: app_encrypt(suite, [b""]), samples)["median_ns"]
    k32, k8, k16 = os.urandom(32), os.urandom(8), os.urandom(16)
    parts = {
        "AES-GCM: inisialisasi + tag": lambda: AES.new(k32, AES.MODE_GCM, nonce=os.urandom(12)).digest(),
        "DES-CBC: inisialisasi": lambda: DES.new(k8, DES.MODE_CBC, iv=os.urandom(8)),
        "RC4: inisialisasi tanpa drop": lambda: ARC4.new(k16),
        "RC4: inisialisasi + drop 3072": lambda: ARC4.new(k16, drop=3072),
        "HMAC-SHA256: init + digest": lambda: hmac.new(k32, b"x", hashlib.sha256).digest(),
        "Key wrap AES-GCM (dipakai semua skema)": lambda: keywrap.wrap(KEK, k32, AAD),
        "Kunci acak os.urandom(48)": lambda: os.urandom(48),
    }
    for label, fn in parts.items():
        out[label] = measure(fn, samples)["median_ns"]
    return out


def tamper_experiment(trials=2000, size=4096):
    data = os.urandom(size)
    res = {}
    # dengan integritas (skema aplikasi)
    for name, suite in SUITES.items():
        detected = 0
        for _ in range(trials):
            blob = app_encrypt(suite, [data])
            ct = bytearray(b"".join(blob["parts"]))
            bit = int.from_bytes(os.urandom(4), "big") % (len(ct) * 8)
            ct[bit // 8] ^= 1 << (bit % 8)
            blob["parts"] = [bytes(ct)]
            try:
                app_decrypt(suite, blob)
            except IntegrityError:
                detected += 1
        res[name] = {"trials": trials, "detected": detected, "silent": trials - detected}

    # tanpa integritas
    def raw(name):
        detected = silent = 0
        bits_changed = []
        for _ in range(trials):
            if name == "AES-256-CTR":
                k, n = os.urandom(32), os.urandom(8)
                ct = bytearray(AES.new(k, AES.MODE_CTR, nonce=n).encrypt(data))
                dec = lambda c: AES.new(k, AES.MODE_CTR, nonce=n).decrypt(bytes(c))
            elif name == "DES-CBC":
                k, iv = os.urandom(8), os.urandom(8)
                ct = bytearray(DES.new(k, DES.MODE_CBC, iv=iv).encrypt(pad(data, 8)))
                dec = lambda c: unpad(DES.new(k, DES.MODE_CBC, iv=iv).decrypt(bytes(c)), 8)
            else:
                k = os.urandom(16)
                ct = bytearray(ARC4.new(k, drop=3072).encrypt(data))
                dec = lambda c: ARC4.new(k, drop=3072).decrypt(bytes(c))
            bit = int.from_bytes(os.urandom(4), "big") % (len(ct) * 8)
            ct[bit // 8] ^= 1 << (bit % 8)
            try:
                pt = dec(ct)
            except ValueError:
                detected += 1
                continue
            if len(pt) != len(data):
                detected += 1
                continue
            silent += 1
            bits_changed.append(sum(bin(a ^ b).count("1") for a, b in zip(pt, data)))
        return {"trials": trials, "detected": detected, "silent": silent,
                "avg_plain_bits_changed": statistics.fmean(bits_changed) if bits_changed else 0}

    for name in ("AES-256-CTR", "DES-CBC", "RC4"):
        res[name + " (tanpa MAC)"] = raw(name)
    return res


def forgery_demo():
    """Penyerang tanpa kunci mengubah nominal kerugian di kronologi laporan."""
    msg = b"Kerugian: Rp 1.000.000 ke rek BCA 1234567890 a.n. pelaku"
    pos = msg.index(b"1.000")
    delta = ord("1") ^ ord("9")
    out = {"original": msg.decode()}

    k = os.urandom(16)
    ct = bytearray(ARC4.new(k, drop=3072).encrypt(msg)); ct[pos] ^= delta
    out["RC4 tanpa MAC"] = ARC4.new(k, drop=3072).decrypt(bytes(ct)).decode(errors="replace")

    k, iv = os.urandom(8), bytearray(os.urandom(8))
    ct = DES.new(k, DES.MODE_CBC, iv=bytes(iv)).encrypt(pad(msg, 8))
    # byte di blok pertama bisa diubah lewat IV tanpa merusak apa pun
    blk, off = divmod(pos, 8)
    if blk == 0:
        iv[off] ^= delta; forged = DES.new(k, DES.MODE_CBC, iv=bytes(iv)).decrypt(ct)
    else:
        c = bytearray(ct); c[(blk - 1) * 8 + off] ^= delta
        forged = DES.new(k, DES.MODE_CBC, iv=bytes(iv)).decrypt(bytes(c))
    out["DES-CBC tanpa MAC"] = unpad(forged, 8).decode(errors="replace")

    for name, suite in SUITES.items():
        blob = app_encrypt(suite, [msg])
        ct = bytearray(b"".join(blob["parts"]))
        if name == "DES-CBC-HMAC":
            blk, off = divmod(pos, 8)
            if blk == 0:
                iv2 = bytearray(blob["iv"]); iv2[off] ^= delta; blob["iv"] = bytes(iv2)
            else:
                ct[(blk - 1) * 8 + off] ^= delta
        else:
            ct[pos] ^= delta
        blob["parts"] = [bytes(ct)]
        try:
            app_decrypt(suite, blob)
            out[name] = "LOLOS (tidak terdeteksi)"
        except IntegrityError:
            out[name] = "DITOLAK: integritas gagal"
    return out


def rc4_bias(n: int):
    """Mantin-Shamir: byte keystream ke-2 RC4 bernilai 0 dengan peluang ~2/256 (seharusnya 1/256)."""
    res = {}
    for drop in (0, 3072):
        zeros = 0
        for _ in range(n):
            if ARC4.new(os.urandom(16), drop=drop).encrypt(b"\x00\x00")[1] == 0:
                zeros += 1
        p = zeros / n
        se = math.sqrt(p * (1 - p) / n)
        z = (p - 1 / 256) / math.sqrt((1 / 256) * (255 / 256) / n)
        res[f"drop={drop}"] = {"n": n, "p": p, "ci95": [p - 1.96 * se, p + 1.96 * se], "z_vs_uniform": z}
    return res


def brute_force(seconds: float):
    """Laju percobaan kunci per detik di 1 core (Python + pycryptodome = sangat konservatif)."""
    block, iv = os.urandom(8), bytes(8)
    out = {}
    for name, keylen, bits, mk in (
        ("DES", 8, 56, lambda k: DES.new(k, DES.MODE_CBC, iv=iv)),
        ("AES-128", 16, 128, lambda k: AES.new(k, AES.MODE_CBC, iv=bytes(16))),
    ):
        blk = block if name == "DES" else block * 2
        keys = [os.urandom(keylen) for _ in range(20000)]
        n, t0 = 0, time.perf_counter()
        while time.perf_counter() - t0 < seconds:
            for k in keys:
                mk(k).encrypt(blk)
            n += len(keys)
        rate = n / (time.perf_counter() - t0)
        avg_trials = 2 ** (bits - 1)
        out[name] = {"key_bits": bits, "keys_per_s_1core": rate,
                     "years_avg_1core": avg_trials / rate / 31_557_600,
                     "years_avg_all_cores": avg_trials / rate / 31_557_600 / (os.cpu_count() or 1)}
    return out


def sweet32(max_file_mb=200):
    """Peluang tabrakan blok CBC ~ n^2 / 2^(b+1) untuk n blok di bawah satu kunci."""
    def p(bytes_, b):
        n = bytes_ / (b // 8)
        return min(1.0, n * n / 2 ** (b + 1))
    one_file = max_file_mb * MiB
    shared_key = 100 * 1024 * MiB  # misal: 100 GB bukti memakai SATU kunci DES
    return {"des_per_file_key": p(one_file, 64), "des_single_key_100GB": p(shared_key, 64),
            "aes_single_key_100GB": p(shared_key, 128), "des_birthday_bound_GiB": (2 ** 32 * 8) / 1024 ** 3}


# --------------------------------------------------------------------- laporan
def fmt_ns(ns):
    if ns < 1e3:
        return f"{ns:.0f} ns"
    if ns < 1e6:
        return f"{ns/1e3:.1f} µs"
    if ns < 1e9:
        return f"{ns/1e6:.2f} ms"
    return f"{ns/1e9:.2f} s"


def env_info():
    cpu = platform.processor() or ""
    flags = ""
    try:
        txt = Path("/proc/cpuinfo").read_text()
        for line in txt.splitlines():
            if line.startswith("model name") and not cpu:
                cpu = line.split(":", 1)[1].strip()
            if line.startswith("flags"):
                flags = line
                break
    except OSError:
        pass
    aesni = (" aes " in flags + " ") if flags else None
    if aesni is None and platform.machine().lower() in ("arm64", "aarch64"):
        aesni = "ARMv8 Crypto Ext. (kemungkinan)"
    return {"python": sys.version.split()[0], "pycryptodome": Crypto.__version__, "os": platform.platform(),
            "cpu": cpu or platform.machine(), "cores": os.cpu_count(), "aes_ni": aesni,
            "timestamp": datetime.now().isoformat(timespec="seconds")}


def write_charts(rows, raw, outdir: Path):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("  matplotlib tidak ada, grafik dilewati")
        return []
    colors = {"AES-256-GCM": "#2563eb", "DES-CBC-HMAC": "#dc2626", "RC4-HMAC": "#d97706"}
    files = []

    big = [p for p in dict.fromkeys(r["payload"] for r in rows) if next(r for r in rows if r["payload"] == p)["size"] >= 64 * 1024]
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.2), sharey=True)
    for ax, kind in zip(axes, ("enc", "dec")):
        w = 0.26
        for i, c in enumerate(SUITES):
            vals = [next(r for r in rows if r["payload"] == p and r["cipher"] == c)[f"{kind}_mbps"] for p in big]
            xs = [j + (i - 1) * w for j in range(len(big))]
            ax.bar(xs, vals, w, label=SHORT[c], color=colors[c])
            for x, v in zip(xs, vals):
                ax.text(x, v, f"{v:.0f}", ha="center", va="bottom", fontsize=8)
        ax.set_xticks(range(len(big)))
        ax.set_xticklabels([next(r["label"] for r in rows if r["payload"] == p) for p in big], fontsize=9)
        ax.set_title("Enkripsi" if kind == "enc" else "Dekripsi (verifikasi + dekripsi)")
        ax.set_yscale("log")
        ax.grid(axis="y", alpha=0.3)
    axes[0].set_ylabel("MB/s (skala log, makin tinggi makin cepat)")
    axes[0].legend()
    fig.suptitle("Throughput skema aplikasi (cipher + integritas + key wrap)")
    fig.tight_layout()
    f = outdir / "throughput.png"; fig.savefig(f, dpi=150); plt.close(fig); files.append(f)

    small = [p for p in dict.fromkeys(r["payload"] for r in rows) if next(r for r in rows if r["payload"] == p)["size"] < 64 * 1024]
    fig, ax = plt.subplots(figsize=(7, 3.8))
    w = 0.26
    for i, c in enumerate(SUITES):
        vals = [next(r for r in rows if r["payload"] == p and r["cipher"] == c)["enc"]["median_ns"] / 1e3 for p in small]
        xs = [j + (i - 1) * w for j in range(len(small))]
        ax.bar(xs, vals, w, label=SHORT[c], color=colors[c])
        for x, v in zip(xs, vals):
            ax.text(x, v, f"{v:.0f}", ha="center", va="bottom", fontsize=8)
    ax.set_xticks(range(len(small)))
    ax.set_xticklabels([next(r["label"] for r in rows if r["payload"] == p) for p in small])
    ax.set_ylabel("µs per item (makin rendah makin cepat)")
    ax.set_title("Latensi enkripsi data kecil (didominasi biaya tetap)")
    ax.legend(); ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    f = outdir / "latency_small.png"; fig.savefig(f, dpi=150); plt.close(fig); files.append(f)

    fig, ax = plt.subplots(figsize=(7, 3.6))
    names = [r["primitive"] for r in raw]
    ax.barh(names, [r["mbps"] for r in raw], color=["#2563eb", "#60a5fa", "#dc2626", "#d97706", "#6b7280"])
    for i, r in enumerate(raw):
        ax.text(r["mbps"], i, f" {r['mbps']:.0f}", va="center", fontsize=8)
    ax.set_xlabel("MB/s"); ax.set_title("Kecepatan primitif (tanpa integritas) vs HMAC")
    ax.invert_yaxis(); ax.grid(axis="x", alpha=0.3)
    fig.tight_layout()
    f = outdir / "primitives.png"; fig.savefig(f, dpi=150); plt.close(fig); files.append(f)
    return files


def row(rows, payload, cipher):
    return next(r for r in rows if r["payload"] == payload and r["cipher"] == cipher)


def write_summary(res, outdir: Path):
    rows, raw, env = res["payloads"], res["primitives"], res["env"]
    names = list(SUITES)
    L = []
    L.append("# Hasil Benchmark AES vs DES vs RC4 — Lapor Siber\n")
    L.append(f"Mesin: {env['cpu']} ({env['cores']} core), akselerasi AES perangkat keras: {env['aes_ni']}, "
             f"Python {env['python']}, pycryptodome {env['pycryptodome']}, {env['os']}. Waktu: {env['timestamp']}.\n")
    L.append("Angka absolut hanya berlaku untuk mesin ini. Yang dibandingkan adalah **rasio antar cipher** dan "
             "**apakah selisihnya terasa oleh pengguna**.\n")

    # ---------------------------------------------------------------- 1
    L.append("## 1. Waktu per jenis data (skema persis seperti di aplikasi)\n")
    L.append("Per cipher: buat kunci acak → enkripsi per potongan 1 MiB → tag/HMAC → bungkus kunci. Dekripsi: buka kunci → "
             "verifikasi tag/HMAC → dekripsi. Median (kuartil 1–3 dalam kurung). Baris *HMAC plaintext* adalah cek keutuhan "
             "end-to-end yang dihitung sekali per unggahan dan sekali per unduhan, sama untuk semua cipher.\n")
    L.append("| Data | Ukuran | Skema | Enkripsi | Dekripsi | MB/s enk | MB/s dek | CV | Overhead simpan |")
    L.append("|---|---:|---|---:|---:|---:|---:|---:|---:|")
    for r in rows:
        mb = lambda v: f"{v:.0f}" if v and r["size"] >= 64 * 1024 else "–"  # MB/s tak bermakna untuk data kecil
        iqr = f"{fmt_ns(r['enc']['median_ns'])} ({fmt_ns(r['enc']['p25_ns'])}–{fmt_ns(r['enc']['p75_ns'])})"
        dec = fmt_ns(r['dec']['median_ns']) if r["cipher"] in SUITES else "(sama)"
        L.append(f"| {r['label']} | {human(r['size'])} | {SHORT.get(r['cipher'], r['cipher'])} | {iqr} | {dec} | "
                 f"{mb(r['enc_mbps'])} | {mb(r['dec_mbps']) if r['cipher'] in SUITES else '–'} | {r['enc']['cv']*100:.1f}% | "
                 f"{r['overhead_bytes']} B |")
    L.append("")
    worst = max(rows, key=lambda r: r["enc"]["cv"])
    big_cv = max(r["enc"]["cv"] for r in rows if r["size"] >= 8 * MiB)
    L.append(f"Koefisien variasi (CV) tertinggi {worst['enc']['cv']*100:.1f}% ({worst['label']}, "
             f"{SHORT.get(worst['cipher'], worst['cipher'])}); untuk payload besar paling tinggi {big_cv*100:.1f}%. "
             + ("Pengukuran stabil." if worst["enc"]["cv"] < 0.15 else
                "Derau terbesar ada di payload kecil yang sangat peka gangguan sistem lain. Selisih antar cipher pada data besar "
                "berlipat-lipat, jauh di atas derau ini, jadi kesimpulan perbandingan tidak berubah; untuk angka absolut "
                "yang lebih stabil, tutup aplikasi lain, jalankan dengan --pin, lalu ulangi.") + "\n")

    payloads = list(dict.fromkeys(r["payload"] for r in rows))
    vid, small = payloads[-1], payloads[0]
    V = {n: row(rows, vid, n) for n in names}
    H = row(rows, vid, "HMAC plaintext (sekali)")
    S = {n: row(rows, small, n) for n in names}
    fastest_big = max(names, key=lambda n: V[n]["enc_mbps"])
    slowest_big = min(names, key=lambda n: V[n]["enc_mbps"])
    fastest_small = min(names, key=lambda n: S[n]["enc"]["median_ns"])
    slowest_small = max(names, key=lambda n: S[n]["enc"]["median_ns"])
    L.append("**Interpretasi:**\n")
    ratio = lambda a, b: V[a]["enc_mbps"] / V[b]["enc_mbps"]
    L.append(f"- **Data besar ({V[names[0]]['label'].lower()}, {human(V[names[0]]['size'])}):** {SHORT[fastest_big]} tercepat. "
             f"DES {ratio('AES-256-GCM', 'DES-CBC-HMAC'):.1f}× lebih lambat dari AES, RC4 {ratio('AES-256-GCM', 'RC4-HMAC'):.1f}× lebih lambat dari AES. "
             + ("AES unggul karena dieksekusi instruksi khusus CPU (AES-NI/ARMv8), sedangkan DES dan RC4 murni perangkat lunak; "
                "DES juga lambat secara desain (16 ronde permutasi bit yang mahal di software)." if env["aes_ni"] else
                "Mesin ini tidak terdeteksi punya akselerasi AES, sehingga selisih AES bisa lebih kecil daripada di laptop modern."))
    max_mb = 200
    t = {n: max_mb / V[n]["enc_mbps"] for n in names}
    th = max_mb / H["enc_mbps"]
    total = sum(t.values()) + th
    L.append(f"- **Waktu tunggu pelapor.** Video maksimal {max_mb} MB: AES ≈ {t['AES-256-GCM']:.1f} s, DES ≈ {t['DES-CBC-HMAC']:.1f} s, "
             f"RC4 ≈ {t['RC4-HMAC']:.1f} s, HMAC plaintext ≈ {th:.1f} s. Aplikasi menyimpan ketiganya, jadi setelah unggahan selesai "
             f"server butuh ≈ {total:.1f} s, dan {t[slowest_big]/total*100:.0f}% di antaranya karena {SHORT[slowest_big]}. "
             f"Kalau hanya AES yang disimpan, angka itu turun ke ≈ {t['AES-256-GCM'] + th:.1f} s.")
    L.append(f"- **Unduhan** memakai satu cipher. Pemilik yang mengunduh video {max_mb} MB menunggu ≈ "
             + ", ".join(f"{SHORT[n]} {max_mb / V[n]['dec_mbps'] + th:.1f} s" for n in names)
             + " (termasuk cek keutuhan). Karena itu AES dijadikan cipher bawaan untuk unduhan.")
    L.append(f"- **Data kecil ({S[names[0]]['label']}, {human(S[names[0]]['size'])}):** semua paling lama "
             f"{math.ceil(max(S[n]['enc']['median_ns'] for n in names)/1e3)} µs; {SHORT[fastest_small]} tercepat dan {SHORT[slowest_small]} terlambat"
             + (", urutan yang berbeda dari data besar. " if fastest_small != fastest_big else ". ")
             + "Pada ukuran ini kecepatan cipher tidak berperan; yang terukur adalah biaya tetap "
             "(lihat bagian 3). Selisih puluhan mikrodetik tidak terasa oleh pengguna, bahkan untuk formulir dengan puluhan field.")
    L.append(f"- **Overhead simpan** per item kecil dan konstan: IV + tag + kunci terbungkus, ditambah padding 1–8 byte untuk DES. "
             f"Untuk NIK 16 byte ini terlihat besar ({', '.join(SHORT[n] + ' ' + str(S[n]['overhead_bytes']) + ' B' for n in names)}), "
             "tetapi untuk file tidak berarti. Yang signifikan adalah keputusan menyimpan **tiga salinan**: disk ≈ 3× ukuran bukti.\n")

    # ---------------------------------------------------------------- 2
    rp = {r["primitive"]: r["mbps"] for r in raw}
    L.append("## 2. Primitif murni vs HMAC\n")
    L.append(f"Payload {human(raw[0]['size'])}, tanpa integritas, untuk memisahkan biaya cipher dari biaya MAC.\n")
    L.append("| Primitif | MB/s | CV |")
    L.append("|---|---:|---:|")
    for r in raw:
        L.append(f"| {r['primitive']} | {r['mbps']:.0f} | {r['cv']*100:.1f}% |")
    h = rp["HMAC-SHA256"]
    harm = lambda a, b: 1 / (1 / a + 1 / b)  # dua proses berurutan
    L.append("")
    L.append("**Interpretasi:**\n")
    L.append(f"- DES murni hanya {rp['DES-CBC']:.0f} MB/s, jadi DES sendiri leher botolnya; HMAC ({h:.0f} MB/s) hanya menambah "
             f"sedikit (perkiraan DES+HMAC ≈ {harm(rp['DES-CBC'], h):.0f} MB/s).")
    rc4_mac = harm(rp["RC4-drop3072"], h)
    L.append(f"- RC4 murni {rp['RC4-drop3072']:.0f} MB/s, tetapi begitu ditambah HMAC turun ke ≈ {rc4_mac:.0f} MB/s, "
             f"sedangkan AES-GCM yang integritasnya sudah termasuk mencapai {rp['AES-256-GCM (dgn tag)']:.0f} MB/s. "
             + ("Jadi alasan klasik 'RC4 dipilih karena cepat' tidak berlaku lagi bila integritas wajib dan CPU punya akselerasi AES."
                if rp["AES-256-GCM (dgn tag)"] > rc4_mac else
                "Di mesin ini RC4+HMAC masih lebih cepat, tetapi selisihnya tidak sebanding dengan kelemahan keamanannya."))
    L.append(f"- Selisih AES-CTR ({rp['AES-256-CTR']:.0f}) dan AES-GCM ({rp['AES-256-GCM (dgn tag)']:.0f}) adalah biaya GHASH, "
             "yaitu harga integritas di GCM.\n")

    # ---------------------------------------------------------------- 3
    st = res["setup_ns"]
    L.append("## 3. Biaya tetap per item (menjelaskan hasil data kecil)\n")
    L.append("| Komponen | Waktu |")
    L.append("|---|---:|")
    for k, v in st.items():
        L.append(f"| {k} | {fmt_ns(v)} |")
    L.append("")
    kw = st["Key wrap AES-GCM (dipakai semua skema)"]
    gcm = st["AES-GCM: inisialisasi + tag"]
    L.append("**Interpretasi:**\n")
    L.append(f"- Key wrap ({fmt_ns(kw)}) adalah porsi terbesar dan sama untuk ketiga skema, karena envelope encryption memakai "
             "AES-GCM untuk membungkus kunci data apa pun cipher-nya.")
    L.append(f"- AES-GCM juga punya inisialisasi relatif mahal ({fmt_ns(gcm)}): pycryptodome menyiapkan tabel GHASH untuk setiap kunci baru. "
             "Karena aplikasi memakai kunci baru per item, biaya ini dibayar setiap kali; itu sebabnya AES bisa kalah di data sangat kecil.")
    L.append(f"- Membuang 3072 byte awal RC4 menaikkan inisialisasi dari {fmt_ns(st['RC4: inisialisasi tanpa drop'])} ke "
             f"{fmt_ns(st['RC4: inisialisasi + drop 3072'])}. Harga ini kecil dibanding manfaatnya (bagian 5).\n")

    # ---------------------------------------------------------------- 4
    tp = res["tamper"]
    L.append("## 4. Uji manipulasi ciphertext\n")
    L.append("Satu bit acak dibalik pada ciphertext dokumen 4 KB, lalu didekripsi.\n")
    L.append("| Skema | Percobaan | Terdeteksi | Lolos diam-diam | Rata-rata bit plaintext berubah (yang lolos) |")
    L.append("|---|---:|---:|---:|---:|")
    for k, v in tp.items():
        L.append(f"| {k} | {v['trials']} | {v['detected']} | {v['silent']} | {v.get('avg_plain_bits_changed', 0):.1f} |")
    L.append("")
    L.append("Serangan terarah: penyerang tanpa kunci mengubah nominal kerugian di kronologi dari 1 juta menjadi 9 juta.\n")
    for k, v in res["forgery"].items():
        L.append(f"- **{k}**: `{v}`")
    cbc = tp["DES-CBC (tanpa MAC)"]
    L.append("")
    L.append("**Interpretasi:**\n")
    L.append("- Tanpa MAC, CTR dan RC4 *malleable*: membalik 1 bit ciphertext membalik tepat 1 bit plaintext. Penyerang yang tahu "
             "posisi nominal bisa mengubahnya dengan presisi, dan dekripsi tetap 'berhasil'.")
    L.append(f"- CBC tanpa MAC merusak satu blok penuh plus 1 bit di blok berikutnya (rata-rata {cbc['avg_plain_bits_changed']:.0f} bit berubah), "
             f"tetapi padding hanya menangkap {cbc['detected']} dari {cbc['trials']} percobaan. Serangan terarah tetap berhasil dengan "
             "mengorbankan blok sebelumnya (atau tanpa jejak sama sekali bila target di blok pertama, lewat IV).")
    L.append("- Dengan GCM dan Encrypt-then-MAC, **semua** manipulasi ditolak sebelum plaintext dikirim. Laporan dipakai sebagai "
             "bukti, jadi tanpa integritas syarat 'data kembali utuh' tidak terpenuhi.\n")

    # ---------------------------------------------------------------- 5
    b = res["rc4_bias"]
    L.append("## 5. Kelemahan kriptografis yang terukur\n")
    L.append("**Bias RC4.** Peluang byte keystream ke-2 bernilai 0 (seharusnya 1/256 = 0,391%):\n")
    for k, v in b.items():
        L.append(f"- {k}: {v['p']*100:.3f}% (CI95 {v['ci95'][0]*100:.3f}–{v['ci95'][1]*100:.3f}%), z = {v['z_vs_uniform']:.1f}, n = {v['n']:,}")
    d0, d1 = b["drop=0"], b["drop=3072"]
    L.append(f"\nTanpa drop, peluangnya {d0['p']*256:.2f}× nilai acak (z = {d0['z_vs_uniform']:.0f}, jauh di atas 1,96), sesuai temuan "
             f"Mantin–Shamir. Dengan drop 3072, z = {d1['z_vs_uniform']:.1f}, tidak bisa dibedakan dari acak pada sampel ini. "
             "Bias semacam ini yang dipakai untuk memecahkan WEP dan RC4 di TLS, sehingga RFC 7465 melarang RC4 di TLS. "
             "Drop menghilangkan bias awal, tetapi bias jangka panjang RC4 tetap ada.\n")
    bf = res["brute_force"]
    L.append("**Brute force kunci** (1 core, Python + pycryptodome — jauh lebih lambat dari perangkat penyerang):\n")
    for k, v in bf.items():
        L.append(f"- {k} ({v['key_bits']} bit): {v['keys_per_s_1core']:,.0f} kunci/s → rata-rata {sci(v['years_avg_1core'])} tahun "
                 f"(1 core), {sci(v['years_avg_all_cores'])} tahun ({env['cores']} core)")
    L.append("\nAngka DES di atas tidak boleh dibaca sebagai 'aman ribuan tahun'. Implementasi bitslice di GPU/FPGA jutaan kali lebih cepat "
             "dari Python, dan mesin Deep Crack milik EFF sudah membongkar DES dalam sekitar 56 jam pada 1998. Yang tidak berubah adalah "
             "selisih ruang kunci: AES-128 punya 2^72 kali lebih banyak kunci daripada DES (AES-256 yang dipakai di sini 2^200 kali), "
             "jadi percepatan perangkat sebesar apa pun tidak menutup jarak itu.\n")
    s = res["sweet32"]
    L.append(f"**Blok 64 bit DES (Sweet32).** Tabrakan blok CBC mulai mungkin setelah ≈ {s['des_birthday_bound_GiB']:.0f} GiB di bawah satu kunci. "
             f"Karena aplikasi memakai kunci baru per file (video maks 200 MB), peluangnya ≈ {s['des_per_file_key']:.1e}. Kalau satu kunci DES "
             f"dipakai untuk 100 GB bukti, peluangnya ≈ {s['des_single_key_100GB']:.2f} (praktis pasti). AES dengan blok 128 bit pada 100 GB: "
             f"{s['aes_single_key_100GB']:.1e}. Kunci per item menghilangkan risiko ini di aplikasi; kelemahan DES yang tersisa adalah kunci 56 bit.\n")

    # ---------------------------------------------------------------- 6
    L.append("## 6. Kesimpulan untuk skenario Lapor Siber\n")
    L.append("- **AES-256-GCM dijadikan salinan utama** untuk semua akses (unduhan pemilik, tampilan profil, tampilan kasus petugas): "
             f"tercepat untuk bukti berukuran file ({V['AES-256-GCM']['enc_mbps']:.0f} MB/s vs DES {V['DES-CBC-HMAC']['enc_mbps']:.0f} "
             f"dan RC4 {V['RC4-HMAC']['enc_mbps']:.0f}), integritas sudah termasuk, kunci 256 bit, blok 128 bit.")
    L.append("- **DES-CBC-HMAC** tidak bisa dimanipulasi berkat HMAC, tetapi kerahasiaannya bergantung pada kunci 56 bit yang sudah bisa "
             "di-brute-force. Untuk scan KTP dan data keuangan (data pribadi spesifik menurut UU PDP), ini tidak memenuhi kewajiban "
             "pengendali untuk menerapkan pengamanan yang layak. DES juga penyebab terbesar waktu tunggu unggahan.")
    L.append("- **RC4-HMAC** tidak bisa dimanipulasi dan bias awalnya dihilangkan dengan drop 3072, tetapi RC4 sudah dilarang di protokol "
             "modern dan keunggulan kecepatannya hilang setelah HMAC ditambahkan.")
    L.append("- **Konsekuensi menyimpan tiga salinan:** disk 3×, waktu proses unggahan = jumlah ketiganya, dan yang paling penting, "
             "kerahasiaan data hanya sekuat salinan **terlemah**. Penyerang yang mencuri database cukup menyerang versi DES. Di sistem "
             "produksi, hanya salinan AES yang seharusnya disimpan; versi DES dan RC4 ada di proyek ini untuk keperluan perbandingan.")
    (outdir / "summary.md").write_text("\n".join(L), encoding="utf-8")


def human(n):
    if n < 1024:
        return f"{n} B"
    if n < MiB:
        return f"{n/1024:.0f} KB"
    return f"{n/MiB:.0f} MB"


def sci(x):
    return f"{x:,.1f}" if x < 1e6 else f"{x:.1e}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true")
    ap.add_argument("--pin", action="store_true", help="kunci ke CPU 0 (Linux)")
    ap.add_argument("--out", default=str(Path(__file__).parent / "results"))
    ap.add_argument("--summary-only", action="store_true", help="buat ulang summary.md & grafik dari results.json")
    a = ap.parse_args()
    if a.summary_only:
        outdir = Path(a.out)
        res = json.loads((outdir / "results.json").read_text(encoding="utf-8"))
        write_charts(res["payloads"], res["primitives"], outdir)
        write_summary(res, outdir)
        print(f"Ditulis ulang: {outdir / 'summary.md'}")
        return
    if a.pin and hasattr(os, "sched_setaffinity"):
        os.sched_setaffinity(0, {0})
    outdir = Path(a.out); outdir.mkdir(parents=True, exist_ok=True)

    video_mb = 16 if a.quick else 64
    payloads = [
        ("nik", "NIK (field)", 16),
        ("kronologi", "Kronologi laporan", 2 * 1024),
        ("ktp", "Scan KTP", 600 * 1024),
        ("dokumen", "Dokumen kantor", 3 * MiB),
        ("video", "Video bukti", video_mb * MiB),
    ]
    ss, sb = (9, 5) if a.quick else (21, 9)
    res = {"env": env_info()}
    print("Lingkungan:", res["env"])
    print("[1] Payload skenario"); res["payloads"] = bench_payloads(payloads, ss, sb)
    print("[2] Primitif murni"); res["primitives"] = bench_raw(16 * MiB, sb)
    print("[3] Biaya tetap"); res["setup_ns"] = bench_setup(ss)
    print("[4] Uji manipulasi"); res["tamper"] = tamper_experiment(500 if a.quick else 2000)
    res["forgery"] = forgery_demo()
    print("[5] Bias RC4"); res["rc4_bias"] = rc4_bias(2 ** 16 if a.quick else 2 ** 18)
    print("[6] Brute force"); res["brute_force"] = brute_force(1.0 if a.quick else 3.0)
    res["sweet32"] = sweet32()

    (outdir / "results.json").write_text(json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")
    with open(outdir / "payloads.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["payload", "size_bytes", "cipher", "enc_median_ms", "enc_p25_ms", "enc_p75_ms", "dec_median_ms",
                    "enc_mbps", "dec_mbps", "enc_cv", "overhead_bytes"])
        for r in res["payloads"]:
            w.writerow([r["payload"], r["size"], r["cipher"], r["enc"]["median_ns"] / 1e6, r["enc"]["p25_ns"] / 1e6,
                        r["enc"]["p75_ns"] / 1e6, r["dec"]["median_ns"] / 1e6, r["enc_mbps"], r["dec_mbps"],
                        r["enc"]["cv"], r["overhead_bytes"]])
    charts = write_charts(res["payloads"], res["primitives"], outdir)
    write_summary(res, outdir)
    print(f"\nSelesai. Lihat {outdir/'summary.md'}" + (f" dan {len(charts)} grafik PNG" if charts else ""))


if __name__ == "__main__":
    main()
