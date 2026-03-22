# ElderMind 🧠
**AI Companionship Platform for Elderly Indian Users**

> Rajalakshmi Engineering College · Team ElderMind · 2024–2028

ElderMind is a voice-first AI companion that helps elderly Indian users through
conversations in Tamil, Hindi, or English. It remembers their life history,
family members, medications, and routines — and keeps family members informed
through a real-time dashboard and SMS reminders.

---

## Team

| Role | Name | Focus |
|------|------|-------|
| AI Engineer 1 | **Tanisha** | Conversational AI — GPT-4o-mini, Persona, `/chat` endpoint |
| AI Engineer 2 | **Suchit** | Memory — ChromaDB, RAG, Embeddings, Fact Extraction |
| AI Engineer 3 | **Sukirthan** | Voice Pipeline — Sarvam STT/TTS/Translation, Orchestration |
| Backend Engineer 1 | **Sujit P** | API & Database — FastAPI, PostgreSQL, JWT, Routing |
| Backend Engineer 2 | **Shivani** | Frontend + Scheduling — React, Twilio, APScheduler |
| Cybersecurity Engineer | **Sudharsan** | Scam Detection, Security Middleware, OWASP ZAP |

---

## Quick Start

### 1. Clone & branch

```bash
git clone https://github.com/YOUR_USERNAME/eldermind.git
cd eldermind
git checkout dev/YOUR_NAME        # use your own branch
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # Fill in your real API keys
python create_tables.py           # Create PostgreSQL tables (run once)
python seed_demo_db.py            # Create demo users

uvicorn main:app --reload         # Start the server
# API docs: http://localhost:8000/docs
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm start
# Opens at http://localhost:3000
```

### 4. Load demo memories (before every demo)

```bash
cd backend
python ml_models/seed_demo_user.py
```

---

## Architecture

```
React Frontend (Shivani)
    │
    ├── POST /voice/process  ──▶ Sukirthan: STT → translate → RAG → GPT → translate → TTS
    ├── POST /chat/          ──▶ Tanisha:   GPT-4o-mini + memory injection
    ├── GET  /memory/all     ──▶ Suchit:    ChromaDB retrieval
    ├── POST /reminders      ──▶ Shivani:   APScheduler + Twilio SMS
    ├── WS   /ws/family      ──▶ Shivani:   Real-time family dashboard
    └── All requests         ──▶ Sudharsan: Scam middleware → Sujit P: JWT + DB
```

---

## API Overview

| Endpoint | Method | Auth | Owner | Purpose |
|----------|--------|------|-------|---------|
| `/health` | GET | No | Sujit P | Health check |
| `/auth/register` | POST | No | Sujit P | Register + get JWT |
| `/auth/login` | POST | No | Sujit P | Login + get JWT |
| `/chat/` | POST | Yes | Tanisha | Send message, get GPT reply |
| `/chat/history/{id}` | GET | Yes | Tanisha | Conversation history |
| `/memory/store` | POST | Yes | Suchit | Store a memory |
| `/memory/retrieve` | POST | Yes | Suchit | Semantic search |
| `/memory/all/{id}` | GET | Yes | Suchit | All memories (dashboard) |
| `/voice/process` | POST | Yes | Sukirthan | Audio in → audio out |
| `/reminders/create` | POST | Yes | Shivani | Create reminder |
| `/reminders/{id}` | GET | Yes | Shivani | List reminders |
| `/security/check` | POST | Yes | Sudharsan | Scam risk score |
| `WS /ws/family` | WS | — | Shivani | Real-time updates |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Owner | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Sujit P | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Sujit P | JWT signing key (generate randomly) |
| `OPENAI_API_KEY` | Tanisha | GPT-4o-mini calls |
| `SARVAM_API_KEY` | Sukirthan | STT + TTS + Translation |
| `TWILIO_ACCOUNT_SID` | Shivani | SMS sending |
| `TWILIO_AUTH_TOKEN` | Shivani | SMS sending |
| `TWILIO_FROM_NUMBER` | Shivani | Twilio sender number |
| `FAMILY_ALERT_NUMBER` | Sudharsan | Scam alert destination |

---

## Git Workflow

Everyone works on their own branch. **Never push directly to `main`.**

```bash
git checkout dev/YOUR_NAME
git pull origin main              # Sync with latest
# ... make your changes ...
git add .
git commit -m "feat(module): description of what you did"
git push origin dev/YOUR_NAME
# Then open a Pull Request → Sujit P reviews and merges
```

**Commit message format:** `feat(module): description` or `fix(module): description`

---

## Key Version Locks

| Package | Version | Reason |
|---------|---------|--------|
| `chromadb` | `0.4.22` | **PINNED** — 0.5+ breaks filter query syntax (Suchit's code) |
| `fastapi` | `0.110.0` | Stable version used throughout |

---

## Critical Rules

1. **Never commit `.env`** — only `.env.example` goes to Git
2. **Never commit `chroma_db/`** — each developer has their own local copy
3. **Never commit `.pkl` / `.joblib` model files** — share via Google Drive
4. **Always run `seed_demo_db.py` + `seed_demo_user.py` before the demo**
5. **ChromaDB 0.4.22 is pinned — do not upgrade without Suchit's agreement**

---

## 8-Week Roadmap Summary

| Week | Focus | Gate |
|------|-------|------|
| W1 | Environment setup, API keys, first tools running | — |
| W2 | Module skeletons, dummy endpoints, VoiceButton | — |
| W3 | Core AI + Memory v1, real GPT calls | — |
| W4 | **Integration Gate 1** — full terminal voice pipeline | ✓ All must pass |
| W5 | Reminders, security, recurring SMS | — |
| W6 | Full voice pipeline, WebSocket streaming | — |
| W7 | **Integration Gate 2** — all 6 modules connected | ✓ All must pass |
| W8 | Polish, OWASP ZAP scan, demo prep | Demo |

---

*ElderMind · Technical Implementation v2.0 · March 2026 · Rajalakshmi Engineering College*
