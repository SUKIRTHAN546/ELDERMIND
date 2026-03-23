"""
ElderMind — FastAPI Application Entry Point
Owner: Sujit P

Add routers incrementally as each team member completes and PRs their module.
Do NOT uncomment a router until the PR has been reviewed and merged.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
import re, json, logging
from typing import List

load_dotenv()
logging.basicConfig(level=logging.INFO)

# ─── RATE LIMITER ─────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="ElderMind API",
    description="AI Companionship Platform for Elderly Indian Users",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── GENERIC EXCEPTION HANDLER ────────────────────────────────────
# Ensures no stack traces are ever exposed to the client
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logging.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "An internal error occurred."})

# ─── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── INPUT SANITISATION MIDDLEWARE ────────────────────────────────
# ─── INPUT SANITISATION MIDDLEWARE ────────────────────────────────
INJECTION_PATTERNS = re.compile(
    r"ignore.{0,20}previous.{0,20}instructions|"
    r"forget everything|"
    r"forget.{0,20}instructions|"
    r"you are now|"
    r"dan|"
    r"hack|"
    r"(drop|delete|truncate|insert|update|select)\s+.*|"
    r"1=1|"
    r"or 1=1",
    re.IGNORECASE,
)


class SanitisationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and "application/json" in request.headers.get("content-type", ""):
            try:
                body = await request.body()
                if INJECTION_PATTERNS.search(body.decode("utf-8", errors="ignore")):
                    return JSONResponse(status_code=400, content={"detail": "Request contains disallowed content."})
            except:
                pass
        return await call_next(request)

app.add_middleware(SanitisationMiddleware)

# ─── SECURITY HEADERS MIDDLEWARE ──────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"]        = "DENY"
        response.headers["X-XSS-Protection"]       = "1; mode=block"
        response.headers["Referrer-Policy"]= "strict-origin-when-cross-origin"
        
        if "server" in response.headers:
            del response.headers["server"]
        
        response.headers["Referrer-Policy"]        = "strict-origin-when-cross-origin"
        if "server" in response.headers:
            del response.headers["server"]
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ─── SCAM DETECTION MIDDLEWARE (Sudharsan — Week 4) ───────────────
from middleware.scam_middleware import ScamDetectionMiddleware
app.add_middleware(ScamDetectionMiddleware)

# ─── WEBSOCKET CONNECTION MANAGER (Shivani — Week 6) ─────────────
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(data))
            except:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()

@app.websocket("/ws/family")
async def ws_family(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def notify_family(event_type: str, data: dict):
    """Call from any router to push a real-time update to all family dashboards."""
    await manager.broadcast({"type": event_type, "data": data})

# ─── ROUTERS ──────────────────────────────────────────────────────
# Uncomment each as the team member completes and PRs their module.

# from routers.auth import router as auth_router
# app.include_router(auth_router)

from routers.chat import router as chat_router
# from routers.memory    import router as memory_router    # Suchit  — Week 2
from routers.voice     import router as voice_router     # Sukirthan — Week 3
# from routers.chat      import router as chat_router      # Tanisha — Week 3
from routers.memory    import router as memory_router    # Suchit  — Week 2
# from routers.voice     import router as voice_router     # Sukirthan — Week 3
# from routers.reminders import router as reminders_router # Shivani — Week 3
from routers.security  import router as security_router  # Sudharsan — Week 4

app.include_router(chat_router)
# app.include_router(memory_router)
app.include_router(voice_router)
# app.include_router(chat_router)
app.include_router(memory_router)
# app.include_router(voice_router)
# app.include_router(reminders_router)
app.include_router(security_router)

# ─── SCHEDULER (Shivani — Week 3) ────────────────────────────────
# from services.scheduler_service import start_scheduler
# @app.on_event("startup")
# async def startup_event():
#     start_scheduler()

# ─── HEALTH ───────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ElderMind API", "version": "1.0.0"}
