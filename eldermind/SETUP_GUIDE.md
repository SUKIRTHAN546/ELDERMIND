# ElderMind — First-Day Setup Guide
> For all team members · Read this before anything else

---

## Step 1 — Clone the repo and switch to your branch

```bash
git clone https://github.com/YOUR_USERNAME/eldermind.git
cd eldermind
```

| Your name | Your branch command |
|-----------|---------------------|
| Tanisha   | `git checkout dev/tanisha` |
| Suchit    | `git checkout dev/suchit` |
| Sukirthan | `git checkout dev/sukirthan` |
| Sujit P   | `git checkout dev/sujit` |
| Shivani   | `git checkout dev/shivani` |
| Sudharsan | `git checkout dev/sudharsan` |

---

## Step 2 — Python environment

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate          # Mac/Linux
# OR
venv\Scripts\activate             # Windows

pip install -r requirements.txt
```

---

## Step 3 — Set up your .env file

```bash
cp .env.example .env
# Open .env in your editor and fill in only the keys relevant to YOUR module
# DO NOT share your .env with anyone or commit it to Git
```

---

## Step 4 — PostgreSQL (Sujit P sets this up on Day 1; others just need the URL)

```bash
# After Sujit P creates the DB and shares the DATABASE_URL:
python create_tables.py

# Verify it worked — should show 4 tables:
#   ✓ users
#   ✓ conversations
#   ✓ reminders
#   ✓ memory_logs
```

---

## Step 5 — Start the server and verify it works

```bash
uvicorn main:app --reload
# Visit http://localhost:8000/health → should return {"status":"ok"}
# Visit http://localhost:8000/docs  → should show all API endpoints
```

---

## Step 6 — Your module-specific first task

| Name | First task |
|------|-----------|
| **Tanisha** | Get Sarvam chat model to respond to a test message via `/chat/` |
| **Suchit** | Install ChromaDB 0.4.22, embed one sentence, verify the 384-dim vector |
| **Sukirthan** | Activate Sarvam API key, transcribe a test WAV file with Saarika |
| **Sujit P** | Create the GitHub repo, all 6 branches, protect `main` |
| **Shivani** | `cd frontend && npm install && npm start`, send a test Twilio SMS |
| **Sudharsan** | Run a TF-IDF vectoriser on 5 test sentences, print the vocabulary |

---

## Key contacts for blockers

| Blocker | Who to ask |
|---------|-----------|
| Can't clone repo / branch issues | Sujit P |
| PostgreSQL connection failing | Sujit P |
| CORS errors from React | Sujit P |
| Memory retrieval returns wrong results | Suchit |
| Audio not transcribing | Sukirthan |
| SMS not delivering | Shivani |
| 401 errors after Week 4 | Sujit P |

---

## Friday Sync — Every Week

**Who runs it:** Sukirthan  
**Duration:** 30 minutes  
**Rule:** Each person demos their module calling the next module.  
**Golden rule:** A working pipe beats a perfect isolated module every time.

---

## What NEVER goes to Git

```
.env
chroma_db/
*.pkl
*.joblib
*.wav
*.webm
node_modules/
```

If you accidentally commit any of these, tell Sujit P immediately.
