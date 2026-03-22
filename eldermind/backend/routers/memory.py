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

from services.memory_service import (
    store_memory, retrieve_memories,
    get_all_memories, extract_and_store_facts, chroma_client, delete_memory, get_memory_stats
)

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

class ExtractRequest(BaseModel):
    user_id: str
    conversation: str


# ─── STUB ENDPOINTS — replace with real logic once memory_service.py is ready ──

@router.post("/store")
def store(req: StoreRequest):
    result = store_memory(
        req.user_id, req.text, req.category,
        req.importance, req.source
    )
    if not result["stored"]:
        raise HTTPException(status_code=400, detail=result["reason"])
    return result

@router.post("/retrieve")
def retrieve(req: RetrieveRequest):
    facts = retrieve_memories(
        req.user_id,
        req.query,
        req.n_results,
        req.category
    )
    return {"facts": facts, "user_id": req.user_id}

@router.get("/all/{user_id}")
def get_all(user_id: str, category: Optional[str] = None):
    return {
        "memories": get_all_memories(user_id, category),
        "user_id": user_id
    }


@router.post("/extract")
def extract(req: ExtractRequest):
    ids = extract_and_store_facts(req.user_id, req.conversation)
    return {"extracted_count": len(ids), "stored_ids": ids}


@router.delete("/clear/{user_id}")
def clear(user_id: str):
    try:
        chroma_client.delete_collection(f"user_memories_{user_id}")
        return {"cleared": True, "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/delete")
def delete(user_id: str, mem_id: str):
    result = delete_memory(user_id, mem_id)

    if not result["deleted"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result

@router.get("/stats/{user_id}")
def stats(user_id: str):
    return get_memory_stats(user_id)