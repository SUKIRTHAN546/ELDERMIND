"""
ElderMind - Chat Router
Owner: Tanisha (AI Engineer 1)
"""

import logging
import uuid
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from models.database import get_db
from models.orm import Conversation, User
from models.schemas import ChatRequest, ChatResponse
from routers.auth import get_current_user
from services.gpt_service import FALLBACK_REPLY, chat_with_gpt, clear_history, stream_gpt_response

logger = logging.getLogger("chat")
router = APIRouter(prefix="/chat", tags=["chat"])


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
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id
    if req.user_id and req.user_id != user_id:
        raise HTTPException(status_code=403, detail="user_id does not match authenticated user")

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
    current_user: User = Depends(get_current_user),
):
    effective_user_id = current_user.id
    if user_id and user_id != effective_user_id:
        raise HTTPException(status_code=403, detail="user_id does not match authenticated user")

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
    current_user: User = Depends(get_current_user),
):
    if user_id != current_user.id:
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
    current_user: User = Depends(get_current_user),
):
    effective_user_id = current_user.id
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
