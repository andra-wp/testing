from __future__ import annotations

from typing import Any, Callable, Optional
from fastapi import Depends, Header, HTTPException, status

SESSIONS: dict[str, dict[str, Any]] = {}


def get_current_user(authorization: Optional[str] = Header(None)) -> dict[str, Any]:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header otentikasi tidak ditemukan. Silakan login terlebih dahulu.",
        )

    parts = authorization.split(" ")
    token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else parts[0]

    session_data = SESSIONS.get(token)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesi login tidak valid atau sudah kedaluwarsa.",
        )
    return session_data


def require_role(*allowed_roles: str) -> Callable:
    def role_checker(
        current_user: dict[str, Any] = Depends(get_current_user),
    ) -> dict[str, Any]:
        user_role = current_user.get("role", "user")
        if user_role not in allowed_roles:
            roles_str = ", ".join(allowed_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak: Memerlukan hak akses role ({roles_str}).",
            )
        return current_user

    return role_checker

require_admin = require_role("admin")

