"""
ElderMind — Memory Service (ChromaDB + sentence-transformers RAG)
Owner: Suchit (AI Engineer 2)

VERSION LOCK: chromadb==0.4.22  — DO NOT upgrade. 0.5+ breaks filter query syntax.

Core responsibilities:
  - Embed text using all-MiniLM-L6-v2 (384-dim, local, free)
  - Store memories per user in ChromaDB with category + deduplication
  - Retrieve top-5 semantically similar facts via cosine similarity
  - Auto-extract facts from completed conversations (keyword triggers)
"""

import chromadb
import time
import hashlib
import logging

from sentence_transformers import SentenceTransformer

logger = logging.getLogger("memory_service")

# ─── INITIALISE CHROMADB AND EMBEDDER ─────────────────────────────
# PersistentClient saves to disk — memories survive server restarts
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "../chroma_db")

chroma_client = chromadb.PersistentClient(path=DB_PATH)


# Load embedding model once at startup (~3 s on first load from disk cache)
# NOTE: First ever run downloads ~90 MB — normal, one-time only.
logger.info("Loading embedding model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
logger.info("Embedding model ready.")

VALID_CATEGORIES     = ["family", "medical", "preferences", "routine", "life_memories", "events"]
SIMILARITY_THRESHOLD = 0.30   # Minimum cosine similarity to include a result
DEDUP_THRESHOLD      = 0.92   # If similarity >= 0.92, treat as duplicate — skip


def get_collection(user_id: str):
    """Each user gets their own ChromaDB collection. Complete data isolation."""
    return chroma_client.get_or_create_collection(
        name=f"user_memories_{user_id}",
        metadata={"hnsw:space": "cosine"},
    )


def embed(text: str) -> list:
    """Convert text to a 384-dimensional normalised embedding vector."""
    return embedder.encode(text, normalize_embeddings=True).tolist()


# ─── STORE MEMORY ─────────────────────────────────────────────────

def store_memory(
    user_id:    str,
    text:       str,
    category:   str,
    importance: float = 0.5,
    source:     str   = "conversation",
) -> dict:
    """
    Store a single memory for a user. Runs deduplication before storing.
    Returns: {"stored": True/False, "reason": str, "id": str or None}
    """
    if category not in VALID_CATEGORIES:
        return {"stored": False, "reason": f"Invalid category: {category}", "id": None}
    if not text.strip():
        return {"stored": False, "reason": "Empty text", "id": None}

    collection = get_collection(user_id)

    # ── DEDUPLICATION CHECK ──────────────────────────────────────
    if collection.count() > 0:
        q_vec   = embed(text)
        results = collection.query(
            query_embeddings=[q_vec],
            n_results=min(3, collection.count()),
        )
        print("DEDUP RESULTS:", results)
        if results["distances"] and results["distances"][0]:
            top_sim = 1 - results["distances"][0][0]
            if top_sim >= DEDUP_THRESHOLD:
                return {"stored": False, "reason": f"Duplicate (similarity={top_sim:.2f})", "id": None}

    # ── STORE ────────────────────────────────────────────────────
    mem_id = f"mem_{user_id}_{int(time.time())}_{hashlib.md5(text.encode()).hexdigest()[:6]}"
    collection.add(
        ids        = [mem_id],
        embeddings = [embed(text)],
        documents  = [text],
        metadatas  = [{
            "user_id":    user_id,
            "category":   category,
            "timestamp":  int(time.time()),
            "source":     source,
            "importance": importance,
        }],
    )
    logger.info(f"[memory] stored user={user_id} cat={category} id={mem_id}")
    return {"stored": True, "reason": "Stored successfully", "id": mem_id}


# ─── RETRIEVE MEMORIES ────────────────────────────────────────────

def retrieve_memories(
    user_id:   str,
    query:     str,
    n_results: int = 5,
    category:  str = None,
) -> str:
    """
    Retrieve the most relevant memories for a given query.
    Returns a formatted multi-line string ready to inject into GPT's system prompt.

    Format:
      [family] Son named Karthik, 42, lives in Bangalore
      [medical] Takes Metformin 500mg twice daily

    Returns empty string "" if no memories exist or none pass the threshold.
    """
    collection = get_collection(user_id)
    if collection.count() == 0:
        return ""

    q_vec = embed(query)

    results = collection.query(
        query_embeddings = [q_vec],
        n_results        = min(n_results, collection.count()),
        include          = ["documents", "distances", "metadatas"],
    )

    facts = []
    for doc, dist, meta in zip(
        results["documents"][0],
        results["distances"][0],
        results["metadatas"][0],
    ):
        similarity = 1 - dist
        print("SIM:", similarity, "DOC:", doc)  # 🔥 debug line

        if similarity >= SIMILARITY_THRESHOLD:
                if category is None or meta["category"] == category:
                    facts.append(f'[{meta["category"]}] {doc}')

    logger.info(f"[memory] retrieve user={user_id} query_len={len(query)} results={len(facts)}")
    return "\n".join(facts)


# ─── GET ALL MEMORIES ─────────────────────────────────────────────

def get_all_memories(user_id: str, category: str = None) -> list:
    """Returns all stored memories — used by Shivani's family dashboard."""
    collection = get_collection(user_id)
    if collection.count() == 0:
        return []
    where  = {"$and": [{"user_id": user_id}, {"category": category}]} if category else {"user_id": user_id}
    result = collection.get(where=where, include=["documents", "metadatas"])
    return [
        { "id": id, "text": doc, "category": meta["category"], "timestamp": meta["timestamp"]}
        for id, doc, meta in zip(result["ids"], result["documents"], result["metadatas"])
    ]


# ─── AUTO-EXTRACT AND STORE FACTS ─────────────────────────────────

def extract_and_store_facts(user_id: str, conversation_text: str) -> list:
    """
    Called at end of session by Tanisha's /chat/end-session.
    Scans conversation for keyword triggers and stores relevant facts.
    Returns list of stored memory IDs.
    """
    stored_ids = []
    lines      = conversation_text.lower()

    family_triggers  = ["son", "daughter", "grandson", "granddaughter", "husband", "wife", "brother", "sister"]
    medical_triggers = ["tablet", "medicine", "doctor", "hospital", "diabetes", "blood pressure", "pain", "checkup"]

    for trigger in family_triggers:
        if trigger in lines:
            r = store_memory(user_id, f"User mentioned {trigger} during conversation.", "family", 0.6, "auto_extract")
            if r["stored"]:
                stored_ids.append(r["id"])

    for trigger in medical_triggers:
        if trigger in lines:
            r = store_memory(user_id, f"User mentioned {trigger} — possible health context.", "medical", 0.7, "auto_extract")
            if r["stored"]:
                stored_ids.append(r["id"])

    return stored_ids

# ─── AUTO-EXTRACT AND STORE FACTS ─────────────────────────────────

def delete_memory(user_id: str, mem_id: str) -> dict:
    collection = get_collection(user_id)

    try:
        collection.delete(ids=[mem_id])
        return {"deleted": True, "id": mem_id}
    except Exception as e:
        return {"deleted": False, "error": str(e)}
    

def get_memory_stats(user_id: str) -> dict:
    collection = get_collection(user_id)
    
    if collection.count() == 0:
        return {
            "user_id": user_id,
            "total": 0,
            "by_category": {cat: 0 for cat in VALID_CATEGORIES}
        }

    result = collection.get(where={"user_id": user_id}, include=["metadatas"])
    counts = {cat: 0 for cat in VALID_CATEGORIES}

    for meta in result["metadatas"]:
        category = meta["category"]
        if category in counts:
            counts[category] += 1

    return {
        "user_id": user_id,
        "total": collection.count(),
        "by_category": counts
    }
