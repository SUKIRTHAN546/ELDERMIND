"""
ElderMind — Scam Detection Middleware
Owner: Sudharsan (Cybersecurity Engineer)

Screens EVERY incoming /chat message before it reaches the AI layer.
If risk_score >= 0.7, blocks the message and fires a Twilio family alert.

Classifier: TF-IDF vectoriser + Logistic Regression
  - Trained on 300+ examples (data in ml_models/scam_classifier/data/)
  - Target accuracy: 88%+

TODO (Sudharsan):
  1. Train the classifier (see ml_models/scam_classifier/train.py)
  2. Load the saved .joblib model files on startup
  3. Replace the stub risk_score logic with the real predictor
  4. Wire the Twilio family alert
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from twilio.rest import Client
import os, json, logging

logger = logging.getLogger("scam_middleware")

SCAM_RISK_THRESHOLD   = 0.7
FAMILY_ALERT_NUMBER   = os.getenv("FAMILY_ALERT_NUMBER")
TWILIO_SID            = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN          = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM           = os.getenv("TWILIO_FROM_NUMBER")

# ── TODO: Load trained model on module import ──────────────────────
# import joblib
# vectoriser = joblib.load("ml_models/scam_classifier/model/tfidf.joblib")
# classifier = joblib.load("ml_models/scam_classifier/model/logreg.joblib")


def _score_message(text: str) -> float:
    """
    Returns scam risk score in [0, 1].
    TODO (Sudharsan): Replace with real classifier prediction.
    """
    # stub — always returns 0 until model is loaded
    return 0.0


def _fire_family_alert(message: str, risk_score: float):
    """Send Twilio SMS alert to family when scam is detected."""
    try:
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        body   = f"⚠️ ElderMind Scam Alert! A suspicious message was blocked (risk={risk_score:.0%}): \"{message[:80]}\""
        client.messages.create(body=body, from_=TWILIO_FROM, to=FAMILY_ALERT_NUMBER)
        logger.warning(f"Family scam alert sent. risk={risk_score:.2f} msg='{message[:60]}'")
    except Exception as e:
        logger.error(f"Failed to send scam alert: {e}")


class ScamDetectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only screen POST /chat/ requests
        if request.method == "POST" and request.url.path.startswith("/chat"):
            try:
                body = await request.body()
                data = json.loads(body.decode("utf-8", errors="ignore"))
                msg  = data.get("message", "")

                risk_score = _score_message(msg)

                if risk_score >= SCAM_RISK_THRESHOLD:
                    _fire_family_alert(msg, risk_score)
                    logger.warning(f"Scam blocked: risk={risk_score:.2f} msg='{msg[:80]}'")
                    return JSONResponse(
                        status_code=403,
                        content={
                            "detail": "Message blocked by scam filter.",
                            "risk_score": risk_score,
                        },
                    )
            except Exception as e:
                logger.error(f"Scam middleware error: {e}")

        return await call_next(request)
