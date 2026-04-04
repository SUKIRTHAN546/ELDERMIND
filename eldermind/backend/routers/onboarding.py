"""
ElderMind — Caretaker Onboarding Router
Task 2: Parse free-form caretaker text into structured memories via LLM.

POST /onboarding/process
  Input:  { "user_id": str, "raw_text": str }
  Output: { "stored_count": int, "memories": [...] }
"""

import json
import logging
import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.memory_service import store_memory, get_memory_stats

router = APIRouter(prefix="/onboarding", tags=["onboarding"])
logger = logging.getLogger("onboarding")

SARVAM_CHAT_API_KEY = os.getenv("SARVAM_CHAT_API_KEY", "") or os.getenv("SARVAM_API_KEY", "")
SARVAM_MODEL = os.getenv("SARVAM_MODEL", "sarvam-m")
SARVAM_CHAT_URL = os.getenv("SARVAM_CHAT_URL", "https://api.sarvam.ai/v1/chat/completions")

EXTRACTION_SYSTEM_PROMPT = """You are a memory extraction assistant for ElderMind, an AI companion for elderly Indian users.

Given a paragraph written by a family member about their elderly relative, extract individual facts and classify each into one of these categories:
- family: relationships, family members, their names, ages, locations
- medical: health conditions, medications, dosages, doctor visits, allergies
- preferences: food preferences, music, hobbies, likes, dislikes
- routine: daily schedule, meal times, sleep patterns, regular activities
- life_memories: past experiences, career, achievements, important life events
- events: upcoming birthdays, anniversaries, appointments, festivals

Return ONLY a valid JSON array with no additional text. Each element must have:
- "text": a clear, concise fact (one sentence)
- "category": one of the categories above
- "importance": a float from 0.0 to 1.0 (1.0 = critical medical/safety info, 0.5 = normal, 0.3 = nice-to-know)

Extract as many distinct facts as possible. Do NOT invent facts not present in the input.
Do NOT wrap the JSON in markdown code blocks. Return raw JSON only.

Example output:
[{"text": "Has a son named Karthik who lives in Bangalore", "category": "family", "importance": 0.6}, {"text": "Takes Metformin 500mg twice daily for diabetes", "category": "medical", "importance": 0.9}]"""


class OnboardingRequest(BaseModel):
    user_id: str
    raw_text: str


class OnboardingResponse(BaseModel):
    stored_count: int
    memories: list


@router.post("/process", response_model=OnboardingResponse)
async def process_onboarding(req: OnboardingRequest):
    """
    Accept free-form text from a caretaker, use LLM to extract structured memories,
    and store each in ChromaDB. Returns the count and list of stored memories.
    """
    user_id = str(req.user_id)
    raw_text = (req.raw_text or "").strip()

    if not raw_text:
        raise HTTPException(status_code=400, detail="raw_text cannot be empty")

    if len(raw_text) > 5000:
        raw_text = raw_text[:5000]

    # ── Call LLM to extract structured facts ─────────────────────
    messages = [
        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
        {"role": "user", "content": raw_text},
    ]

    try:
        if not SARVAM_CHAT_API_KEY:
            raise ValueError("SARVAM_CHAT_API_KEY is missing")

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                SARVAM_CHAT_URL,
                json={
                    "model": SARVAM_MODEL,
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 2000,
                },
                headers={"api-subscription-key": SARVAM_CHAT_API_KEY},
            )
        resp.raise_for_status()
        data = resp.json()

        reply_text = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )

        logger.info(f"[onboarding] LLM raw response for user={user_id}: {reply_text[:500]}")

        # Strip markdown code fences if present
        if reply_text.startswith("```"):
            lines = reply_text.split("\n")
            # Remove first and last line (```json and ```)
            lines = [l for l in lines if not l.strip().startswith("```")]
            reply_text = "\n".join(lines)

        # Clean up any <think> tags from the model
        import re
        reply_text = re.sub(r"<think>.*?</think>", "", reply_text, flags=re.DOTALL | re.IGNORECASE)
        reply_text = re.sub(r"<think>.*", "", reply_text, flags=re.DOTALL | re.IGNORECASE)
        reply_text = reply_text.strip()

        facts = json.loads(reply_text)

    except json.JSONDecodeError as e:
        logger.error(f"[onboarding] JSON parse failed: {e}, raw: {reply_text[:500]}")
        raise HTTPException(status_code=500, detail="Failed to parse LLM response as JSON. Please try again.")
    except Exception as e:
        logger.error(f"[onboarding] LLM call failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LLM extraction failed: {str(e)}")

    if not isinstance(facts, list):
        raise HTTPException(status_code=500, detail="LLM did not return a JSON array")

    # ── Store each extracted fact ─────────────────────────────────
    valid_categories = {"family", "medical", "preferences", "routine", "life_memories", "events"}
    stored_memories = []

    for fact in facts:
        if not isinstance(fact, dict):
            continue

        text = str(fact.get("text", "")).strip()
        category = str(fact.get("category", "")).strip()
        importance = float(fact.get("importance", 0.5))

        if not text or category not in valid_categories:
            logger.warning(f"[onboarding] skipping invalid fact: {fact}")
            continue

        importance = max(0.0, min(1.0, importance))

        result = store_memory(
            user_id=user_id,
            text=text,
            category=category,
            importance=importance,
            source="onboarding",
        )

        if result["stored"]:
            stored_memories.append({
                "text": text,
                "category": category,
                "importance": importance,
                "id": result["id"],
            })
        else:
            logger.info(f"[onboarding] skipped (dedup): {text[:80]} — {result['reason']}")

    logger.info(f"[onboarding] user={user_id} extracted={len(facts)} stored={len(stored_memories)}")

    return OnboardingResponse(
        stored_count=len(stored_memories),
        memories=stored_memories,
    )
