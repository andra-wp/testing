import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
NIK_RE = re.compile(r"^\d{16}$")
PHONE_RE = re.compile(r"^(\+62|62|0)8\d{7,12}$")

# Kept in sync with CATEGORIES in frontend/src/lib/constants.js
CATEGORIES = {
    "kekerasan_seksual": "Kekerasan seksual",
    "pelecehan_seksual": "Pelecehan seksual verbal/nonfisik",
    "kbgo": "Kekerasan berbasis gender online (KBGO)",
    "perundungan": "Perundungan (bullying)",
    "perundungan_siber": "Perundungan siber (cyberbullying)",
    "kekerasan_fisik": "Kekerasan fisik",
    "kekerasan_psikis": "Kekerasan psikis",
    "lainnya": "Lainnya",
}

STATUSES = ["diterima", "diverifikasi", "ditindaklanjuti", "selesai", "ditolak"]
# urutan penting: opsi pertama = langkah maju yang wajar, "ditolak" selalu terakhir
TRANSITIONS = {
    "diterima": ["diverifikasi", "ditolak"],
    "diverifikasi": ["ditindaklanjuti", "ditolak"],
    "ditindaklanjuti": ["selesai"],
    "selesai": [],
    "ditolak": [],
}

_DOCX = "application/vnd.openxmlformats-officedocument."
KIND_RULES = {
    "ktp": {
        "max_mb": 10,
        "exts": {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".pdf": "application/pdf"},
    },
    "dokumen": {
        "max_mb": 25,
        "exts": {
            # chat screenshots are the most common evidence of (cyber)bullying and harassment
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".pdf": "application/pdf",
            ".docx": _DOCX + "wordprocessingml.document",
            ".xlsx": _DOCX + "spreadsheetml.sheet",
            ".pptx": _DOCX + "presentationml.presentation",
            ".doc": "application/msword",
            ".xls": "application/vnd.ms-excel",
            ".ppt": "application/vnd.ms-powerpoint",
            ".odt": "application/vnd.oasis.opendocument.text",
            ".txt": "text/plain",
            ".eml": "message/rfc822",
        },
    },
    "video": {
        "max_mb": 200,
        "exts": {".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm", ".mkv": "video/x-matroska"},
    },
}

_ZIP = (b"PK\x03\x04",)
_OLE = (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",)
_EBML = (b"\x1a\x45\xdf\xa3",)
MAGIC = {
    ".jpg": (b"\xff\xd8\xff",), ".jpeg": (b"\xff\xd8\xff",), ".png": (b"\x89PNG\r\n\x1a\n",),
    ".pdf": (b"%PDF-",), ".docx": _ZIP, ".xlsx": _ZIP, ".pptx": _ZIP, ".odt": _ZIP,
    ".doc": _OLE, ".xls": _OLE, ".ppt": _OLE, ".webm": _EBML, ".mkv": _EBML,
}


def content_matches_extension(ext: str, head: bytes) -> bool:
    """Cek magic bytes agar file berbahaya tidak menyamar dengan mengganti ekstensi."""
    if ext in (".mp4", ".mov"):
        return len(head) >= 12 and head[4:8] == b"ftyp"
    if ext in (".txt", ".eml"):
        return b"\x00" not in head[:4096]
    return any(head.startswith(sig) for sig in MAGIC.get(ext, ()))


def mask_name(name: str) -> str:
    return " ".join(w[0] + "*" * (len(w) - 1) for w in name.split() if w)


def mask_nik(nik: str) -> str:
    return nik[:4] + "*" * 10 + nik[-2:]


def mask_phone(phone: str) -> str:
    return phone[:4] + "*" * max(len(phone) - 7, 0) + phone[-3:]


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    return local[:1] + "***@" + domain
