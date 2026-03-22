"""
ElderMind — Chat Router
Owner: Tanisha (AI Engineer 1)

Endpoints:
  POST /chat/          — main conversation endpoint
  GET  /chat/history/{user_id} — fetch conversation history (for Shivani's dashboard)
  POST /chat/end-session       — end session, triggers memory extraction (calls Suchit)

Tech: GPT-4o-mini, FastAPI, conversation history (last 10 messages), memory injection
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db
from models.orm import User, Conversation
from models.schemas import ChatRequest, ChatResponse
from routers.auth import get_current_user
import os, uuid, logging

logger = logging.getLogger("chat")
router = APIRouter(prefix="/chat", tags=["chat"])

# ─── ELDERMIND SYSTEM PROMPT ──────────────────────────────────────
# TODO (Tanisha): Refine this in Week 1. Inject memory_context below.
SYSTEM_PROMPT_TEMPLATE = """You are ElderMind, a warm and caring AI companion for elderly Indian users.

Your persona:
- Speak in a gentle, patient, and respectful tone — like a trusted family friend.
- Address the user with affection (e.g. "Amma", "Thatha") when appropriate.
- Keep sentences short and clear. Avoid technical jargon.
- Show genuine curiosity about the user's life, health, and family.
- For medication reminders, be firm but caring — never scolding.
- Celebrate small moments (birthdays, anniversaries, achievements) with warmth.
- If the user expresses loneliness or grief, respond with empathy first — advice second.

Language: Respond in the same language the user uses (Tamil, Hindi, or English).

{memory_context}
"""


@router.post("/", response_model=ChatResponse)
async def chat(
    req:          ChatRequest,
    db:           Session = Depends(get_db),
    # current_user: User    = Depends(get_current_user),   # Uncomment after Week 4 JWT gate
):
    """
    Main conversation endpoint.
    1. Assembles system prompt with memory context from Suchit's /memory/retrieve
    2. Appends last 10 messages of conversation history
    3. Calls GPT-4o-mini
    4. Stores both turns in PostgreSQL
    5. Returns reply

    TODO (Tanisha):
      - Uncomment the openai import and client initialisation below
      - Wire in the memory_context injection
      - Enable JWT auth after Week 4 gate
    """
    # ── PLACEHOLDER — replace with real GPT call in Week 3 ────────
    session_id = req.session_id or f"session_{uuid.uuid4().hex[:8]}"

    # Hardcoded stub for Week 2 — gives teammates something to call immediately
    reply = (
        "Vanakkam! I am ElderMind, your caring companion. "
        "I am still being set up — check back soon! 😊"
    )

    # ── STORE BOTH TURNS IN DB ────────────────────────────────────
    for role, content in [("user", req.message), ("assistant", reply)]:
        db.add(Conversation(
            user_id=req.user_id,
            session_id=session_id,
            role=role,
            content=content,
        ))
    db.commit()

    logger.info(f"[chat] user={req.user_id} session={session_id} msg_len={len(req.message)}")
    return ChatResponse(reply=reply, session_id=session_id)


@router.get("/history/{user_id}")
def get_history(user_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    Returns last N conversation turns for a user.
    Called by Shivani's FamilyDashboard.
    """
    rows = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "history": [
            {"role": r.role, "content": r.content, "created_at": str(r.created_at)}
            for r in reversed(rows)
        ],
        "user_id": user_id,
    }


@router.post("/end-session")
async def end_session(user_id: str, session_id: str, db: Session = Depends(get_db)):
    """
    Called at end of conversation session.
    Retrieves the full transcript, calls Suchit's /memory/extract,
    and notifies Shivani's WebSocket dashboard.

    TODO (Tanisha):
      - Call POST /memory/extract with the session transcript
      - Call notify_family("new_conversation", {...}) from main.py
    """
    return {"ended": True, "user_id": user_id, "session_id": session_id}
