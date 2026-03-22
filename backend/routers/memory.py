"""
ElderMind — Memory Router
Owner: Suchit (AI Engineer 2)

Endpoints:
  POST   /memory/store          — embed and store a single memory
  POST   /memory/retrieve       — semantic search, returns formatted string for GPT injection
  GET    /memory/all/{user_id}  — all memories, used by Shivani's family dashboard
  POST   /memory/extract        — auto-extract facts from a completed conversation transcript
  DELETE /memory/clear/{user_id}— wipe all memories for a user (testing only)
  GET    /memory/stats/{user_id}— count per category (shown in family dashboard)

Tech: ChromaDB 0.4.22 (PINNED), sentence-transformers all-MiniLM-L6-v2
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# from services.memory_service import (      # Uncomment when memory_service.py is ready
#     store_memory, retrieve_memories,
#     get_all_memories, extract_and_store_facts,
# )

router = APIRouter(prefix="/memory", tags=["memory"])


class StoreRequest(BaseModel):
    user_id:    str
    text:       str
    category:   str
    importance: float = 0.5
    source:     str   = "manual"


class RetrieveRequest(BaseModel):
    user_id:   str
    query:     str
    n_results: int           = 5
    category:  Optional[str] = None


# ─── STUB ENDPOINTS — replace with real logic once memory_service.py is ready ──

@router.post("/store")
def store(req: StoreRequest):
    """
    Store a single memory for a user.
    TODO (Suchit): Replace stub with real store_memory() call from memory_service.py
    """
    # result = store_memory(req.user_id, req.text, req.category, req.importance, req.source)
    # if not result["stored"]:
    #     raise HTTPException(status_code=400, detail=result["reason"])
    # return result
    return {"stored": True, "reason": "stub — not yet implemented", "id": "stub_id"}


@router.post("/retrieve")
def retrieve(req: RetrieveRequest):
    """
    Retrieve semantically similar memories for a query.
    Called by Sukirthan's voice pipeline before every /chat call.
    Returns formatted string ready for GPT system prompt injection.

    TODO (Suchit): Replace stub with real retrieve_memories() call
    """
    # facts = retrieve_memories(req.user_id, req.query, req.n_results, req.category)
    # return {"facts": facts, "user_id": req.user_id}
    return {"facts": "", "user_id": req.user_id}


@router.get("/all/{user_id}")
def get_all(user_id: str, category: Optional[str] = None):
    """
    Returns all stored memories — used by Shivani's family dashboard.
    TODO (Suchit): Replace stub with real get_all_memories() call
    """
    # return {"memories": get_all_memories(user_id, category), "user_id": user_id}
    return {"memories": [], "user_id": user_id}


@router.post("/extract")
def extract(user_id: str, conversation: str):
    """
    Auto-extract and store facts from a completed conversation.
    Called by Tanisha's /chat/end-session.
    TODO (Suchit): Replace stub with real extract_and_store_facts() call
    """
    # ids = extract_and_store_facts(user_id, conversation)
    # return {"extracted_count": len(ids), "stored_ids": ids}
    return {"extracted_count": 0, "stored_ids": []}


@router.delete("/clear/{user_id}")
def clear(user_id: str):
    """Delete all memories for a user. Use only for testing."""
    # try:
    #     chroma_client.delete_collection(f"user_memories_{user_id}")
    #     return {"cleared": True, "user_id": user_id}
    # except Exception as e:
    #     raise HTTPException(status_code=404, detail=str(e))
    return {"cleared": True, "user_id": user_id}


@router.get("/stats/{user_id}")
def stats(user_id: str):
    """
    Returns memory count per category.
    Shown in Shivani's family dashboard.
    TODO (Suchit): Implement real count query against ChromaDB
    """
    return {
        "user_id": user_id,
        "total": 0,
        "by_category": {
            "family": 0, "medical": 0, "preferences": 0,
            "routine": 0, "life_memories": 0, "events": 0,
        },
    }
