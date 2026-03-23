# ElderMind — Integration Gate Checklists
> Owned by Sukirthan · Run every Friday · No exceptions

---

## Gate 1 — End of Week 4

**Format:** 30-minute live terminal demo. Each person demoes their module calling the next.  
**Rule:** If two modules cannot communicate, stop adding features and fix the integration first.

### Checklist

- [ ] **Sujit P** — JWT auth live. Unauthenticated request to `/chat/` returns 401. Authenticated request returns 200.
- [ ] **Tanisha** — `/chat/` calls Sarvam chat model with the full ElderMind system prompt. Conversation history (last 10 messages) injected.
- [ ] **Suchit** — `/memory/retrieve` returns relevant facts for `demo_elderly_user`. All 30 seed memories loaded. Memory persists across server restart.
- [ ] **Sukirthan** — Full terminal voice pipeline: Tamil audio → Saarika STT → Mayura translate → `/memory/retrieve` → `/chat/` → GPT response in terminal.
- [ ] **Shivani** — CORS working from React. VoiceButton connected to `/voice/process`. Twilio SMS fires at scheduled time from DB.
- [ ] **Sudharsan** — Scam middleware integrated. All `/chat/` messages screened before reaching GPT. Test scam message returns 403.

### Golden test

Speak Tamil into the microphone →  
transcript → memory retrieval → GPT response that **uses a name from memory** (e.g. "Karthik") →  
terminal shows the full reply.

**All 6 must pass. No exceptions.**

---

## Gate 2 — End of Week 7

**Format:** Full live demo using the React frontend. All 3 demo scenarios must run.  
**Rule:** All 6 modules connected through shared FastAPI backend with JWT auth.

### Checklist

- [ ] **Sujit P** — All 6 routers visible in `/docs`. JWT required and working on all critical endpoints. Demo users in DB. No 500 errors in any scenario.
- [ ] **Tanisha** — 5+ distinct memory facts used naturally across the 5-turn demo conversation. `/chat/end-session` triggers memory extraction.
- [ ] **Suchit** — 5+ memory facts from ChromaDB used in demo conversation. All 6 categories have entries. Memory updates post-conversation within 2 seconds.
- [ ] **Sukirthan** — Full Tamil voice round-trip under 3.5 seconds perceived latency. Streaming enabled — audio starts before LLM finishes. Backup demo video recorded.
- [ ] **Shivani** — Family dashboard shows last 5 conversations, next upcoming reminder, and any scam alerts. WebSocket live. Reminder SMS delivered during demo.
- [ ] **Sudharsan** — Scam detector confirmed active in live middleware. OWASP ZAP scan started. All high/medium findings from scan documented.

### 3 demo scenarios

1. **Morning greeting** — Elderly user says good morning in Tamil. ElderMind responds warmly, mentions an upcoming family event from memory.
2. **Medication reminder** — APScheduler fires at scheduled time. Twilio SMS arrives on family phone. Family dashboard updates in real time.
3. **Family check-in** — User asks about Karthik. ElderMind responds using specific facts from ChromaDB (name, city, profession).

**All must pass. All must use real data. No hardcoded responses.**

---

## Post-Gate: What happens if something fails

1. Stop the sync immediately.
2. Identify which module-to-module connection is broken.
3. The two owners of those modules stay on the call and fix it live.
4. The rest of the team continues polishing their own modules.
5. Re-test the broken connection before the next day's work session.
