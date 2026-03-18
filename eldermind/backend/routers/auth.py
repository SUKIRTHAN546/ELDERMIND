"""
ElderMind — JWT Authentication Router
Owner: Sujit P

Endpoints: /auth/register, /auth/login, /auth/verify
get_current_user() dependency is used by ALL protected endpoints across the team.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from models.database import get_db
from models.orm import User
from models.schemas import RegisterRequest, LoginRequest, TokenResponse
import os, uuid

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY           = os.getenv("JWT_SECRET_KEY", "change-this-in-production-please")
ALGORITHM            = "HS256"
TOKEN_EXPIRY_MINUTES = 60

pwd_ctx  = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(p: str) -> str:
    return pwd_ctx.hash(p)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRY_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db:    Session                       = Depends(get_db),
) -> User:
    """
    FastAPI dependency for protected endpoints.
    Usage in any router: current_user: User = Depends(get_current_user)

    If no valid JWT is supplied → FastAPI automatically returns 401.
    """
    user_id = decode_token(creds.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or deactivated.")
    return user


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.phone == req.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered.")
    user = User(
        id            = f"user_{uuid.uuid4().hex[:8]}",
        name          = req.name,
        phone         = req.phone,
        email         = req.email,
        password_hash = hash_password(req.password),
        role          = req.role,
        language      = req.language,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone number or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated.")
    return TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
    )


@router.get("/verify")
def verify(current_user: User = Depends(get_current_user)):
    return {
        "valid":   True,
        "user_id": current_user.id,
        "name":    current_user.name,
        "role":    current_user.role,
    }
