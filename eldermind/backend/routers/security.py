"""
ElderMind — Security Router
Owner: Sudharsan (Cybersecurity Engineer)

Endpoint:
  POST /security/check — score a message for scam likelihood

Scam classifier: TF-IDF + Logistic Regression
  - Trained on 300+ examples
  - Target accuracy: 88%+
  - Risk threshold: 0.7 → triggers Twilio family alert

The scam_middleware.py middleware screens EVERY incoming /chat message BEFORE
it reaches the AI layer. This router exposes the classifier directly for testing.

Tech: scikit-learn, FastAPI middleware, OWASP ZAP, bcrypt, slowapi
"""

from fastapi import APIRouter
from models.schemas import SecurityCheckRequest, SecurityCheckResponse
import logging

logger = logging.getLogger("security")
router = APIRouter(prefix="/security", tags=["security"])


@router.post("/check", response_model=SecurityCheckResponse)
def check_message(req: SecurityCheckRequest):
    """
    Score a message for scam likelihood.

    TODO (Sudharsan):
      1. Load trained TF-IDF vectoriser + Logistic Regression model
      2. vectoriser.transform([req.message])
      3. model.predict_proba(...)
      4. If risk_score >= 0.7 → fire Twilio SMS to FAMILY_ALERT_NUMBER
      5. Log the event
    """
    # ── STUB ───────────────────────────────────────────────────────
    return SecurityCheckResponse(
        is_scam    = False,
        risk_score = 0.0,
        message    = "Stub — classifier not yet loaded",
    )
