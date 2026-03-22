"""
ElderMind — Pydantic Request/Response Schemas
Owner: Sujit P

These validate every API request and response. All team members import from here.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── AUTH ─────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name:     str
    phone:    str
    password: str
    email:    Optional[str] = None
    role:     str = "elderly"
    language: str = "ta-IN"


class LoginRequest(BaseModel):
    phone:    str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      str
    name:         str


# ── CHAT (Tanisha) ────────────────────────────────────────────────
class ChatRequest(BaseModel):
    user_id:        str
    message:        str
    memory_context: str = ""
    session_id:     Optional[str] = None


class ChatResponse(BaseModel):
    reply:      str
    session_id: str


# ── MEMORY (Suchit) ───────────────────────────────────────────────
class MemoryStoreRequest(BaseModel):
    user_id:    str
    text:       str
    category:   str
    importance: float = 0.5
    source:     str   = "manual"


class MemoryRetrieveRequest(BaseModel):
    user_id:   str
    query:     str
    n_results: int           = 5
    category:  Optional[str] = None


# ── REMINDERS (Shivani) ───────────────────────────────────────────
class ReminderCreate(BaseModel):
    user_id:      str
    title:        str
    message:      str
    remind_at:    datetime
    is_recurring: bool = False
    recur_cron:   Optional[str] = None
    phone_number: str


# ── VOICE (Sukirthan) ─────────────────────────────────────────────
class VoiceProcessResponse(BaseModel):
    transcript:  str
    reply_text:  str
    language:    str


# ── SECURITY (Sudharsan) ──────────────────────────────────────────
class SecurityCheckRequest(BaseModel):
    user_id:  str
    message:  str


class SecurityCheckResponse(BaseModel):
    is_scam:    bool
    risk_score: float
    message:    str
