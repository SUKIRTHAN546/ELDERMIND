"""
ElderMind — Demo User Memory Seeder
Owner: Suchit (AI Engineer 2)

Run before EVERY demo:
  cd backend && python ml_models/seed_demo_user.py

Loads 30 realistic memories for 'demo_elderly_user' across all 6 categories.
Clears old demo memories first so the demo always starts clean.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.memory_service import store_memory, chroma_client

DEMO_USER = "demo_elderly_user"

# ── CLEAR EXISTING DEMO MEMORIES ─────────────────────────────────
try:
    chroma_client.delete_collection(f"user_memories_{DEMO_USER}")
    print("Cleared old demo memories.")
except:
    pass

# ── 30 REALISTIC MEMORIES ─────────────────────────────────────────
MEMORIES = [
    # FAMILY
    ("Son named Karthik, 42, lives in Bangalore, software engineer at Infosys",        "family",       0.95),
    ("Daughter-in-law Priya, schoolteacher, calls every Sunday",                        "family",       0.90),
    ("Grandson Arjun, age 8, loves cricket and superheroes",                            "family",       0.92),
    ("Granddaughter Kavya, age 5, just started kindergarten",                           "family",       0.88),
    ("Husband Ramamurthy passed away three years ago after 45 years of marriage",       "family",       0.95),
    ("Lives alone in Mylapore, Chennai, in the house she has owned for 30 years",       "family",       0.85),
    ("Sister Lakshmi lives in Adyar, they meet every Thursday for coffee",              "family",       0.80),

    # MEDICAL
    ("Has Type 2 diabetes diagnosed 8 years ago, takes Metformin 500mg twice daily",   "medical",      0.95),
    ("Has mild hypertension, takes Amlodipine 5mg every morning",                       "medical",      0.95),
    ("Regular checkup with Dr. Krishnamurthy at Apollo Hospital every 3 months",        "medical",      0.85),
    ("Allergic to penicillin — had a reaction in 1998",                                 "medical",      0.90),
    ("Arthritis in both knees, finds it difficult to climb stairs",                     "medical",      0.88),

    # PREFERENCES
    ("Loves filter coffee, has two cups daily — morning and evening",                   "preferences",  0.88),
    ("Favourite food is sambar rice and papad, dislikes very spicy food",               "preferences",  0.85),
    ("Watches Sun TV serials every evening — Chithi and Pandian Stores",                "preferences",  0.80),
    ("Loves Carnatic music, especially M.S. Subbulakshmi",                              "preferences",  0.82),
    ("Grows jasmine and rose plants in her small garden",                               "preferences",  0.78),

    # ROUTINE
    ("Wakes at 5 AM, completes Suprabhatam prayers before sunrise",                    "routine",      0.88),
    ("Takes a nap from 1 PM to 2:30 PM every afternoon",                               "routine",      0.85),
    ("Walks in the street for 20 minutes every evening at 6 PM",                       "routine",      0.82),
    ("Calls Karthik every Sunday at 7 PM — this is sacred family time",                "routine",      0.90),

    # LIFE MEMORIES
    ("Was a Tamil language school teacher for 32 years at Corporation school in Mylapore", "life_memories", 0.90),
    ("Very proud of teaching over 1000 children during her career",                     "life_memories", 0.88),
    ("Used to cook for the entire family of 20 people every Pongal",                    "life_memories", 0.82),
    ("Visited Tirupati with her husband every year for 20 years",                       "life_memories", 0.85),

    # EVENTS
    ("Grandson Arjun birthday is March 15 — big family lunch planned",                 "events",       0.90),
    ("Karthik planning to visit for Deepavali — she is very excited",                  "events",       0.88),
    ("Sister Lakshmi anniversary on November 3 — user always calls",                   "events",       0.80),
    ("Annual eye checkup due in April — has not been scheduled yet",                   "events",       0.82),
    ("Grandson Kavya school annual day is in December",                                 "events",       0.78),
]

print(f"Loading {len(MEMORIES)} memories for demo user '{DEMO_USER}'...")
ok = skip = 0
for text, category, importance in MEMORIES:
    r = store_memory(DEMO_USER, text, category, importance, source="seed")
    status = "OK  " if r["stored"] else "SKIP"
    print(f"  [{category:<13}] {status}: {text[:60]}")
    if r["stored"]: ok   += 1
    else:           skip += 1

print(f"\nDone. {ok} stored, {skip} skipped. Demo user ready.")
