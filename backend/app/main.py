from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import init_db
from app.routes.auth import router as auth_router
from app.routes.crypto import router as crypto_router
from app.routes.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inisialisasi database SQLite saat server mulai
    init_db()
    yield


app = FastAPI(
    title="CipherVault API",
    description="REST API for Encrypting, Decrypting, and User Authentication (AES, DES, RC4, PBKDF2)",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS agar antarmuka Frontend diizinkan mengakses API dan membaca response headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Filename", "X-Notes", "X-Category", "Content-Type"],
)

# Daftarkan router Auth, Crypto, & Admin
app.include_router(auth_router)
app.include_router(crypto_router)
app.include_router(admin_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "CipherVault API",
        "docs_url": "/docs",
    }
