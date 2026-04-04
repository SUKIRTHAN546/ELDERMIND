"""
ElderMind - Chat Router
Owner: Tanisha (AI Engineer 1)
"""

import logging
import uuid
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from models.database import get_db
from models.orm import Conversation, User
from models.schemas import ChatRequest, ChatResponse
from routers.auth import get_current_user
from services.gpt_service import FALLBACK_REPLY, chat_with_gpt, clear_history, stream_gpt_response
from services.memory_service import retrieve_memories

logger = logging.getLogger("chat")
router = APIRouter(prefix="/chat", tags=["chat"])

IST = timezone(timedelta(hours=5, minutes=30))


async def _resolve_memory_context(user_id: str, message: str, memory_context: str) -> str:
    context = (memory_context or "").strip()
    if context:
        return context

    try:
        async with httpx.AsyncClient() as hc:
            resp = await hc.post(
                "http://localhost:8000/memory/retrieve",
                json={"user_id": user_id, "query": message, "n_results": 5},
                timeout=2.0,
            )
        payload = resp.json()
        facts = payload.get("facts", "")
        if isinstance(facts, list):
            return "\n".join(str(item) for item in facts)
        if isinstance(facts, str):
            return facts
        return str(facts)
    except Exception as exc:
        logger.warning("Memory fetch failed for %s: %s", user_id, exc)
        return ""


def _store_turns(db: Session, user_id: str, session_id: str, user_msg: str, assistant_msg: str) -> None:
    db.add(
        Conversation(
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=user_msg,
        )
    )
    db.add(
        Conversation(
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=assistant_msg,
        )
    )
    db.commit()


@router.post("/", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    #current_user: User = Depends(get_current_user),
):
    user_id = req.user_id
    

    message = (req.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(message) > 1000:
        message = message[:1000]

    session_id = req.session_id or f"session_{uuid.uuid4().hex[:8]}"
    memory_context = await _resolve_memory_context(user_id, message, req.memory_context)

    reply = await chat_with_gpt(user_id=user_id, message=message, memory_context=memory_context)
    _store_turns(db, user_id, session_id, message, reply)

    logger.info("[chat] user=%s session=%s msg_len=%s", user_id, session_id, len(message))
    return ChatResponse(reply=reply, session_id=session_id)


@router.get("/stream")
async def chat_stream(
    message: str,
    session_id: str | None = None,
    memory_context: str = "",
    user_id: str | None = None,
    db: Session = Depends(get_db),
    #current_user: User = Depends(get_current_user),
):
    effective_user_id = user_id
   

    msg = (message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(msg) > 1000:
        msg = msg[:1000]

    sid = session_id or f"session_{uuid.uuid4().hex[:8]}"

    async def generate():
        resolved_context = await _resolve_memory_context(effective_user_id, msg, memory_context)
        full_reply = ""
        try:
            async for token in stream_gpt_response(effective_user_id, msg, resolved_context):
                full_reply += token
                yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"
        finally:
            assistant_msg = full_reply.strip() or FALLBACK_REPLY
            try:
                _store_turns(db, effective_user_id, sid, msg, assistant_msg)
            except Exception as exc:
                logger.exception("Failed to store streamed conversation: %s", exc)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.get("/history/{user_id}")
def get_history(
    user_id: str,
    limit: int = 20,
    db: Session = Depends(get_db),
    #current_user: User = Depends(get_current_user),
):
    if user_id != user_id:
        raise HTTPException(status_code=403, detail="Not allowed to access other users' history")

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
async def end_session(
    session_id: str,
    user_id: str | None = None,
    db: Session = Depends(get_db),
    #current_user: User = Depends(get_current_user),
):
    effective_user_id = user_id
    if user_id and user_id != effective_user_id:
        raise HTTPException(status_code=403, detail="user_id does not match authenticated user")

    rows = (
        db.query(Conversation)
        .filter(
            Conversation.user_id == effective_user_id,
            Conversation.session_id == session_id,
        )
        .order_by(Conversation.created_at)
        .all()
    )
    transcript = "\n".join(f"{r.role}: {r.content}" for r in rows)

    try:
        async with httpx.AsyncClient() as hc:
            await hc.post(
                "http://localhost:8000/memory/extract",
                params={"user_id": effective_user_id, "conversation": transcript},
                timeout=5.0,
            )
    except Exception as exc:
        logger.warning("memory/extract failed for %s: %s", effective_user_id, exc)

    from main import notify_family

    last = rows[-1].content[:100] if rows else ""
    await notify_family(
        "new_conversation",
        {
            "role": "assistant",
            "content": last,
            "created_at": str(datetime.now()),
        },
    )

    clear_history(effective_user_id)
    return {"ended": True, "turns": len(rows), "session_id": session_id}


# ─── PROACTIVE GREETING ENDPOINT (Task 4) ────────────────────────

@router.get("/greeting/{user_id}")
async def get_greeting(user_id: str):
    """
    Generate a context-aware, time-appropriate greeting for the elderly user.
    Retrieves upcoming event memories and weaves them into a warm greeting.
    """
    user_id = str(user_id)

    # ── Get current IST time ─────────────────────────────────────
    now_ist = datetime.now(IST)
    hour = now_ist.hour

    if 5 <= hour < 12:
        time_context = "morning"
        base_greeting = "a warm good morning greeting"
    elif 12 <= hour < 17:
        time_context = "afternoon"
        base_greeting = "a gentle afternoon check-in"
    elif 17 <= hour < 21:
        time_context = "evening"
        base_greeting = "an evening greeting asking how their day was"
    else:
        time_context = "night"
        base_greeting = "a calming late-night greeting"

    # ── Retrieve event/context memories ──────────────────────────
    event_context = ""
    try:
        event_context = retrieve_memories(
            user_id,
            "upcoming events birthdays anniversaries appointments",
            n_results=3,
        )
    except Exception as e:
        logger.warning(f"[greeting] memory retrieval failed for {user_id}: {e}")

    # Also retrieve general user context
    general_context = ""
    try:
        general_context = retrieve_memories(
            user_id,
            "family preferences routine",
            n_results=3,
        )
    except Exception:
        pass

    memory_block = ""
    if event_context or general_context:
        memory_block = f"\n\nKnown facts about this user:\n{general_context}\n{event_context}".strip()

    # ── Build greeting prompt ────────────────────────────────────
    greeting_prompt = (
        f"You are ElderMind, a warm AI companion for an elderly Indian user. "
        f"It is currently {time_context} ({now_ist.strftime('%I:%M %p')} IST). "
        f"Generate {base_greeting} in 1-2 short, warm sentences. "
        f"Speak as a caring friend or grandchild would. Keep it simple and heartfelt. "
        f"Do NOT use emojis. Do NOT be formal. "
    )

    if memory_block:
        greeting_prompt += (
            f"If any upcoming events or personal details are relevant, "
            f"weave them into the greeting naturally (don't list them). "
            f"{memory_block}"
        )

    # ── Call LLM ─────────────────────────────────────────────────
    try:
        greeting_en = await chat_with_gpt(
            user_id=f"{user_id}_greeting",  # Use separate history to avoid polluting main chat
            message=greeting_prompt,
            memory_context="",
        )
        # Clean up the greeting history immediately
        clear_history(f"{user_id}_greeting")
    except Exception as e:
        logger.error(f"[greeting] LLM failed for {user_id}: {e}")
        # Fallback greetings
        fallbacks = {
            "morning": "Good morning! I hope you slept well. How are you feeling today?",
            "afternoon": "Good afternoon! How has your day been so far?",
            "evening": "Good evening! I hope you had a wonderful day. What's on your mind?",
            "night": "Hello! It's getting late. I hope you're doing well tonight.",
        }
        greeting_en = fallbacks.get(time_context, "Hello! How are you today?")

    fallbacks = {
        "morning": "Good morning! I hope you slept well. How are you feeling today?",
        "afternoon": "Good afternoon! How has your day been so far?",
        "evening": "Good evening! I hope you had a wonderful day. What's on your mind?",
        "night": "Hello! It's getting late. I hope you're doing well tonight.",
    }

    if not greeting_en or greeting_en.strip() == FALLBACK_REPLY:
        logger.warning(f"[greeting] replacing generic fallback reply for user={user_id}")
        greeting_en = fallbacks.get(time_context, "Hello! How are you today?")

    # ── Translate to Tamil ───────────────────────────────────────
    greeting_tamil = greeting_en  # fallback
    try:
        from routers.voice import translate
        greeting_tamil = await translate(greeting_en, "en-IN", "ta-IN")
    except Exception as e:
        logger.warning(f"[greeting] translation failed: {e}")

    logger.info(f"[greeting] user={user_id} time={time_context} greeting_len={len(greeting_en)}")

    return {
        "greeting": greeting_en,
        "greeting_tamil": greeting_tamil,
        "time_of_day": time_context,
    }
