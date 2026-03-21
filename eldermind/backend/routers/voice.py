"""
ElderMind — Voice Pipeline Router
Owner: Sukirthan (AI Engineer 3)

Endpoint:
  POST /voice/process  — receives audio blob, returns audio blob

Full pipeline:
  Sarvam Saarika v2.5 STT  →  Mayura translate (ta→en)  →
  /memory/retrieve          →  Sarvam chat model via /chat/     →
  Mayura translate (en→ta)  →  Bulbul v3 TTS             →
  WAV bytes returned to React VoiceButton

Performance target: < 3.5 s total perceived latency
WebSocket streaming: first TTS sentence plays before LLM finishes generating

Tech: Sarvam AI full API, WebSocket, Docker Compose
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
import logging, io

logger = logging.getLogger("voice")
router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/process")
async def process_voice(
    user_id: str,
    audio:   UploadFile = File(...),
):
    """
    Main voice processing endpoint.

    Accepts: audio/webm or audio/wav blob from Shivani's VoiceButton
    Returns: audio/wav bytes (Bulbul TTS output)

    TODO (Sukirthan):
      1. Read audio bytes from upload
      2. Call Sarvam Saarika STT (codemix, ta-IN, WAV 16kHz mono)
      3. Call Sarvam Mayura translate  Tamil → English
      4. Call POST /memory/retrieve with the English transcript
      5. Call POST /chat/ with transcript + memory_context
      6. Call Sarvam Mayura translate  English → Tamil
      7. Call Sarvam Bulbul TTS (pace=0.85, speaker='meera')
      8. Stream WAV bytes back

    Profile each step and log latency_ms.
    Target: < 3.5 s perceived (streaming — audio starts before LLM finishes)
    """
    audio_bytes = await audio.read()
    logger.info(f"[voice] user={user_id} audio_size={len(audio_bytes)} bytes")

    # ── STUB — returns silent WAV so Shivani can test her audio player ──
    # Replace entirely with real pipeline in Week 3
    silent_wav = _make_silent_wav(duration_ms=500)
    return StreamingResponse(io.BytesIO(silent_wav), media_type="audio/wav")


def _make_silent_wav(duration_ms: int = 500, sample_rate: int = 16000) -> bytes:
    """Generates a minimal silent WAV file for stub testing."""
    import struct, math
    num_samples = int(sample_rate * duration_ms / 1000)
    data_size   = num_samples * 2  # 16-bit = 2 bytes per sample
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + data_size, b"WAVE",
        b"fmt ", 16, 1, 1,
        sample_rate, sample_rate * 2, 2, 16,
        b"data", data_size,
    )
    return header + b"\x00" * data_size
