import json
import logging
import os
import re
import time
import atexit
from pathlib import Path
from typing import AsyncGenerator

import httpx

logger = logging.getLogger("gpt_service")

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "system_prompt.txt"
if PROMPT_PATH.exists():
    SYSTEM_PROMPT = PROMPT_PATH.read_text(encoding="utf-8")
else:
    SYSTEM_PROMPT = "You are ElderMind, a warm and patient AI companion for elderly Indian users."

_histories: dict[str, list[dict[str, str]]] = {}
MAX_HISTORY = 10
FALLBACK_REPLY = "I am having a little trouble right now. Please try again in a moment."

SARVAM_CHAT_API_KEY = os.getenv("SARVAM_CHAT_API_KEY", "") or os.getenv("SARVAM_API_KEY", "")
SARVAM_MODEL = os.getenv("SARVAM_MODEL", "sarvam-m")
SARVAM_CHAT_URL = os.getenv("SARVAM_CHAT_URL", "https://api.sarvam.ai/v1/chat/completions")

# Reuse HTTP connection pool across requests to reduce connect/TLS overhead.
try:
    _sarvam_http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(30.0, connect=4.0),
        http2=True,
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
    )
except ImportError:
    _sarvam_http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(30.0, connect=4.0),
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
    )


def _close_http_client() -> None:
    try:
        import asyncio

        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(_sarvam_http_client.aclose())
        else:
            loop.run_until_complete(_sarvam_http_client.aclose())
    except Exception:
        pass


atexit.register(_close_http_client)


def _trim_history(user_id: str) -> None:
    if user_id in _histories and len(_histories[user_id]) > MAX_HISTORY:
        _histories[user_id] = _histories[user_id][-MAX_HISTORY:]


def _build_system(memory_context: str) -> str:
    context = (memory_context or "").strip()
    if context:
        return f"{SYSTEM_PROMPT}\n\nKNOWN FACTS ABOUT THIS USER:\n{context}"
    return SYSTEM_PROMPT


def _sanitize_reply(text: str) -> str:
    cleaned = text or ""
    cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r"<think>.*", "", cleaned, flags=re.DOTALL | re.IGNORECASE)
    return cleaned.strip()


def _compact_messages(messages: list[dict[str, str]], max_turns: int = 8, max_chars: int = 500) -> list[dict[str, str]]:
    """
    Reduce prompt size to improve latency while keeping recent context useful.
    Keeps the system message plus the most recent turns, with per-message truncation.
    """
    if not messages:
        return messages

    system_msg = messages[0]
    turns = messages[1:][-max_turns:]
    compact_turns = []
    for turn in turns:
        role = turn.get("role", "user")
        content = (turn.get("content") or "").strip()
        if len(content) > max_chars:
            content = content[-max_chars:]
        compact_turns.append({"role": role, "content": content})

    # Ensure the conversation starts on a user turn after system message.
    while compact_turns and compact_turns[0].get("role") != "user":
        compact_turns.pop(0)

    return [system_msg] + compact_turns


def _compact_system_prompt(system_text: str, max_chars: int = 900) -> str:
    """Keep system prompt concise during streaming to reduce first-token latency."""
    text = (system_text or "").strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars]


async def _sarvam_chat(messages: list[dict[str, str]]) -> str:
    if not SARVAM_CHAT_API_KEY:
        raise ValueError("SARVAM_CHAT_API_KEY is missing")

    payload = {
        "model": SARVAM_MODEL,
        "messages": messages,
        "temperature": 0.75,
        "max_tokens": 300,
    }
    headers = {"api-subscription-key": SARVAM_CHAT_API_KEY}

    resp = await _sarvam_http_client.post(SARVAM_CHAT_URL, json=payload, headers=headers)
    resp.raise_for_status()
    data = resp.json()
    return _sanitize_reply(
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )


async def chat_with_gpt(user_id: str, message: str, memory_context: str = "") -> str:
    history = _histories.setdefault(user_id, [])
    history.append({"role": "user", "content": message})
    _trim_history(user_id)

    messages = [{"role": "system", "content": _build_system(memory_context)}] + _histories[user_id]
    messages = _compact_messages(messages, max_turns=8, max_chars=500)

    start = time.perf_counter()
    try:
        reply = await _sarvam_chat(messages)

        if not reply:
            reply = FALLBACK_REPLY
    except Exception as exc:
        logger.exception("Model API error for %s (provider=sarvam): %s", user_id, exc)
        reply = FALLBACK_REPLY

    _histories[user_id].append({"role": "assistant", "content": reply})
    _trim_history(user_id)

    latency_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
        "[gpt] user=%s msg_len=%s reply_len=%s latency_ms=%s provider=sarvam",
        user_id,
        len(message),
        len(reply),
        latency_ms,
    )
    return reply


async def stream_gpt_response(
    user_id: str,
    message: str,
    memory_context: str = "",
) -> AsyncGenerator[str, None]:
    history = _histories.setdefault(user_id, [])
    history.append({"role": "user", "content": message})
    _trim_history(user_id)

    stream_system = _compact_system_prompt(_build_system(memory_context), max_chars=900)
    messages = [{"role": "system", "content": stream_system}] + _histories[user_id]
    messages = _compact_messages(messages, max_turns=4, max_chars=250)

    full_reply = ""
    start = time.perf_counter()
    try:
        if not SARVAM_CHAT_API_KEY:
            raise ValueError("SARVAM_CHAT_API_KEY is missing")

        payload = {
            "model": SARVAM_MODEL,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 160,
            "stream": True,
        }
        headers = {
            "api-subscription-key": SARVAM_CHAT_API_KEY,
            "accept": "text/event-stream",
        }

        async with _sarvam_http_client.stream("POST", SARVAM_CHAT_URL, json=payload, headers=headers) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue

                chunk_str = line[len("data:"):].strip()
                if chunk_str == "[DONE]":
                    break

                try:
                    chunk = json.loads(chunk_str)
                except json.JSONDecodeError:
                    continue

                choice = (chunk.get("choices") or [{}])[0]
                delta = choice.get("delta") or {}
                msg = choice.get("message") or {}
                token = delta.get("content") or msg.get("content") or chunk.get("text") or ""
                if token:
                    full_reply += token
                    yield token
    except Exception as exc:
        logger.exception("Model stream error for %s (provider=sarvam): %s", user_id, exc)
        full_reply = FALLBACK_REPLY
        yield FALLBACK_REPLY

    full_reply = _sanitize_reply(full_reply)
    if not full_reply.strip():
        full_reply = FALLBACK_REPLY

    _histories[user_id].append({"role": "assistant", "content": full_reply})
    _trim_history(user_id)

    latency_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
        "[gpt_stream] user=%s msg_len=%s reply_len=%s latency_ms=%s provider=sarvam",
        user_id,
        len(message),
        len(full_reply),
        latency_ms,
    )


def clear_history(user_id: str) -> None:
    _histories.pop(user_id, None)
