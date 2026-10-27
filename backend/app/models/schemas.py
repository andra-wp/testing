from typing import Any, Optional
from pydantic import BaseModel, Field
from enum import Enum

class caseStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    CLOSED = "CLOSED"

class cipherAlgorithm(str, Enum):
    AES = "AES"
    DES = "DES"
    RC4 = "RC4"

class cipherMode(str, Enum):
    CTR = "CTR"

class EncryptTextRequest(BaseModel):
    text: str = Field(..., description="Plaintext to encrypt")
    password: str = Field(..., min_length=1, description="Secret password for encryption")
    algorithm: cipherAlgorithm = Field(default=cipherAlgorithm.AES, description="Cipher algorithm: AES, DES, or RC4")
    mode: cipherMode = Field(default=cipherMode.CTR, description="Cipher mode: CTR")
    name: str = Field("text.txt", description="Filename or label for the encrypted content")


class DecryptRequest(BaseModel):
    envelope: dict[str, Any] = Field(..., description="JSON envelope containing salt, ciphertext, iv, etc.")
    password: str = Field(..., min_length=1, description="Password to decrypt the envelope")


class EncryptResponse(BaseModel):
    success: bool = True
    envelope: dict[str, Any]


class DecryptResponse(BaseModel):
    success: bool = True
    original_name: str
    plaintext: str

class UserAuthRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=32,
        description="Username 3-32 karakter",
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password minimal 8 karakter",
    )


class AuthResponse(BaseModel):
    success: bool = True
    message: str
    token: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    username: str
    role: str = "user"
    created_at: str

class CaseCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=120, description="Judul kasus insiden siber")
    description: Optional[str] = Field("", description="Deskripsi kronologi kasus")
    status: Optional[caseStatus] = Field("OPEN", description="Status kasus")


class CaseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = ""
    status: caseStatus
    created_by: Optional[int] = None
    creator: Optional[str] = None
    evidence_count: Optional[int] = 0
    created_at: str
