from app.database import DB_DIR, DB_PATH, get_db, init_db

# Re-export fitur modular
from .user import (
    create_user,
    get_user_by_username,
    get_user_by_id,
    get_all_users,
    count_users,
)

from .case import (
    create_case,
    get_case_by_id,
    get_all_cases,
    update_case_status,
    get_evidences_by_case,
    assign_evidence_to_case,
)

from .evidence import (
    save_evidence,
    get_all_evidences,
    get_evidence_by_id,
    get_evidences_by_user,
    count_evidences,
    get_evidence_stats,
)

from .schemas import (
    EncryptTextRequest,
    DecryptRequest,
    EncryptResponse,
    DecryptResponse,
    UserAuthRequest,
    AuthResponse,
    UserProfileResponse,
    CaseCreateRequest,
    CaseResponse,
)

__all__ = [
    # database
    "DB_DIR",
    "DB_PATH",
    "get_db",
    "init_db",
    # user
    "create_user",
    "get_user_by_username",
    "get_user_by_id",
    "get_all_users",
    "count_users",
    # case
    "create_case",
    "get_case_by_id",
    "get_all_cases",
    "update_case_status",
    "get_evidences_by_case",
    "assign_evidence_to_case",
    # evidence
    "save_evidence",
    "get_all_evidences",
    "get_evidence_by_id",
    "get_evidences_by_user",
    "count_evidences",
    "get_evidence_stats",
    # schemas
    "EncryptTextRequest",
    "DecryptRequest",
    "EncryptResponse",
    "DecryptResponse",
    "UserAuthRequest",
    "AuthResponse",
    "UserProfileResponse",
    "CaseCreateRequest",
    "CaseResponse",
]
