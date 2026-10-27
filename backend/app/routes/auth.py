import sqlite3
from typing import Any, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from app.models.user import create_user, get_user_by_username
from app.models.schemas import AuthResponse, UserAuthRequest, UserProfileResponse
from app.utils.security import generate_salt, generate_token, hash_password, verify_password
from app.dependencies import SESSIONS, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserAuthRequest):
    """Mendaftarkan akun baru dengan password yang di-hash (PBKDF2-HMAC-SHA256)."""
    username = request.username.strip()

    existing_user = get_user_by_username(username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username sudah dipakai. Silakan gunakan username lain.",
        )

    # Buat salt unik dan hash password
    salt = generate_salt()
    pw_hash = hash_password(request.password, salt)

    try:
        create_user(username, salt, pw_hash)
        return AuthResponse(
            success=True,
            message="Registrasi berhasil! Silakan login dengan akun Anda.",
            username=username,
        )
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username sudah terdaftar.",
        )


@router.post("/login", response_model=AuthResponse)
def login(request: UserAuthRequest):
    """Memverifikasi username & password, lalu memberikan token sesi."""
    username = request.username.strip()
    user = get_user_by_username(username)

    if not user or not verify_password(request.password, user["salt"], user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah.",
        )

    # Generate token sesi
    token = generate_token()
    role = user["role"] if "role" in user.keys() else ("admin" if user["username"].lower() == "admin" else "user")
    SESSIONS[token] = {
        "user_id": user["id"],
        "username": user["username"],
        "role": role,
        "created_at": user["created_at"],
    }

    return AuthResponse(
        success=True,
        message="Login berhasil!",
        token=token,
        username=user["username"],
        role=role,
    )


@router.post("/logout", response_model=AuthResponse)
def logout(authorization: Optional[str] = Header(None)):
    """Menghapus sesi login pengguna."""
    if authorization:
        parts = authorization.split(" ")
        token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else parts[0]
        SESSIONS.pop(token, None)
    return AuthResponse(success=True, message="Logout berhasil.")


@router.get("/me", response_model=UserProfileResponse)
def get_me(user: dict[str, Any] = Depends(get_current_user)):
    """Mengambil informasi profil pengguna yang sedang login."""
    return UserProfileResponse(
        id=user["user_id"],
        username=user["username"],
        role=user.get("role", "user"),
        created_at=str(user.get("created_at", "")),
    )

