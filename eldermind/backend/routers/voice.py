"""
ElderMind — Voice Pipeline Router
Owner: Sukirthan

Full pipeline: Audio → STT → Translate → Memory → LLM → Translate → TTS → WAV
All Sarvam API calls are async httpx. Memory is imported directly (no internal HTTP).
"""

import httpx, base64, os, io, time, logging, struct
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydub import AudioSegment
from services.gpt_service import chat_with_gpt
from services.memory_service import retrieve_memories

router = APIRouter(prefix="/voice", tags=["voice"])
logger = logging.getLogger("voice")

def _get_voice_api_key() -> str:
    return (
        os.getenv("SARVAM_VOICE_API_KEY", "").strip()
        or os.getenv("SARVAM_API_KEY", "").strip()
    )


def _json_headers() -> dict[str, str]:
    key = _get_voice_api_key()
    if not key:
        raise ValueError("SARVAM_VOICE_API_KEY is missing")
    return {"api-subscription-key": key, "Content-Type": "application/json"}


def _file_headers() -> dict[str, str]:
    key = _get_voice_api_key()
    if not key:
        raise ValueError("SARVAM_VOICE_API_KEY is missing")
    return {"api-subscription-key": key}


def _log_latency(user_id: str, step: str, started_at: float) -> None:
    latency_ms = round((time.perf_counter() - started_at) * 1000, 2)
    logger.info(f"[voice] user={user_id} step={step} latency_ms={latency_ms}")


def _silent_wav(duration_s: float = 0.5, sample_rate: int = 16000) -> bytes:
    """Generate a minimal silent WAV file as a fallback so the frontend never crashes."""
    num_samples = int(sample_rate * duration_s)
    data_size = num_samples * 2  # 16-bit mono
    buf = io.BytesIO()
    # RIFF header
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + data_size))
    buf.write(b"WAVE")
    # fmt chunk
    buf.write(b"fmt ")
    buf.write(struct.pack("<I", 16))           # chunk size
    buf.write(struct.pack("<H", 1))            # PCM
    buf.write(struct.pack("<H", 1))            # mono
    buf.write(struct.pack("<I", sample_rate))   # sample rate
    buf.write(struct.pack("<I", sample_rate * 2))  # byte rate
    buf.write(struct.pack("<H", 2))            # block align
    buf.write(struct.pack("<H", 16))           # bits per sample
    # data chunk
    buf.write(b"data")
    buf.write(struct.pack("<I", data_size))
    buf.write(b"\x00" * data_size)
    return buf.getvalue()


async def stt(wav: bytes) -> str:
    """Sarvam Saarika v2.5 speech-to-text — multipart/form-data (NOT base64)."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.sarvam.ai/speech-to-text",
            headers=_file_headers(),
            files={"file": ("audio.wav", wav, "audio/wav")},
            data={
                "model":           "saarika:v2.5",
                "language_code":   "ta-IN",
                "with_timestamps": "false",
            },
        )
    r.raise_for_status()
    return r.json().get("transcript", "")


async def translate(text: str, src: str, tgt: str) -> str:
    """Sarvam Mayura v1 translation."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.sarvam.ai/translate",
            headers=_json_headers(),
            json={
                "input":                text,
                "source_language_code": src,
                "target_language_code": tgt,
                "model":                "mayura:v1",
                "mode":                 "formal",
            },
        )
    r.raise_for_status()
    return r.json().get("translated_text", text)


async def tts(text: str) -> bytes:
    if not (text or "").strip():
        return b""
    """Sarvam Bulbul v3 text-to-speech — returns raw WAV bytes."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.sarvam.ai/text-to-speech",
            headers=_json_headers(),
            json={
                "text":                 (text or "").strip(),
                "target_language_code": "ta-IN",
                "model":                "bulbul:v3",
                "pace":                 0.85,
            },
        )
    if r.is_error:
        logger.error("[voice/tts] Sarvam error %s: %s", r.status_code, r.text[:1000])
    r.raise_for_status()
    audios = r.json().get("audios", [])
    audio_bytes = base64.b64decode(audios[0]) if audios else b""
    logger.info(
        "[voice/tts] bytes=%s wav_header=%s",
        len(audio_bytes),
        audio_bytes[:4] == b"RIFF",
    )
    return audio_bytes


# ─── MAIN VOICE PIPELINE ────────────────────────────────────────────

@router.post("/process")
async def process_voice(user_id: str, audio: UploadFile = File(...)):
    t0 = time.perf_counter()

    # ── Step 1: Read upload ───────────────────────────────────────
    step_started = time.perf_counter()
    raw = await audio.read()
    _log_latency(user_id, "read_upload", step_started)

    # ── Step 1b: Convert to 16kHz mono WAV ────────────────────────
    step_started = time.perf_counter()
    try:
        seg = AudioSegment.from_file(io.BytesIO(raw)).set_frame_rate(16000).set_channels(1)
        buf = io.BytesIO()
        seg.export(buf, format="wav")
        wav_bytes = buf.getvalue()
    except Exception as e:
        logger.error(f"[voice] audio conversion failed: {e}", exc_info=True)
        return StreamingResponse(
            io.BytesIO(_silent_wav()),
            media_type="audio/wav",
            headers={"X-ElderMind-Silent": "1", "X-ElderMind-Reason": "audio_conversion_failed"},
        )
    _log_latency(user_id, "convert_to_wav_16khz_mono", step_started)

    try:
        # ── Step 2: STT (Saarika v2.5) ───────────────────────────
        step_started = time.perf_counter()
        transcript = await stt(wav_bytes)
        _log_latency(user_id, "stt", step_started)

        if not transcript.strip():
            logger.warning(f"[voice] user={user_id} empty transcript — returning silent WAV")
            return StreamingResponse(
                io.BytesIO(_silent_wav()),
                media_type="audio/wav",
                headers={"X-ElderMind-Silent": "1", "X-ElderMind-Reason": "empty_transcript"},
            )

        # ── Step 3: Tamil → English (Mayura v1) ──────────────────
        step_started = time.perf_counter()
        en_text = await translate(transcript, "ta-IN", "en-IN")
        _log_latency(user_id, "translate_ta_to_en", step_started)

        # ── Step 4: Memory retrieval (direct import, no HTTP) ────
        step_started = time.perf_counter()
        try:
            memory_context = retrieve_memories(user_id, en_text, n_results=5)
        except Exception as e:
            logger.warning(f"[voice] memory retrieve failed (non-fatal): {e}")
            memory_context = ""
        _log_latency(user_id, "memory_retrieve", step_started)

        # ── Step 5: LLM reply (direct import) ────────────────────
        step_started = time.perf_counter()
        en_reply = await chat_with_gpt(
            user_id        = user_id,
            message        = en_text,
            memory_context = memory_context,
        )
        _log_latency(user_id, "chat", step_started)

        # ── Step 6: English → Tamil (Mayura v1) ──────────────────
        step_started = time.perf_counter()
        ta_reply = await translate(en_reply, "en-IN", "ta-IN")
        _log_latency(user_id, "translate_en_to_ta", step_started)

        # ── Step 7: TTS (Bulbul v3) ──────────────────────────────
        step_started = time.perf_counter()
        wav_out = await tts(ta_reply)
        _log_latency(user_id, "tts", step_started)

        total_ms = round((time.perf_counter() - t0) * 1000, 2)
        logger.info(
            f"[voice] user={user_id} step=total latency_ms={total_ms} "
            f"{'✅ under 3.5s' if total_ms < 3500 else '⚠️ OVER 3.5s target'}"
        )

        return StreamingResponse(io.BytesIO(wav_out), media_type="audio/wav")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[voice] pipeline error for user={user_id}: {e}", exc_info=True)
        # Fallback: return silent WAV so the frontend does not crash
        return StreamingResponse(
            io.BytesIO(_silent_wav()),
            media_type="audio/wav",
            headers={"X-ElderMind-Silent": "1", "X-ElderMind-Reason": "pipeline_error"},
        )


# ─── TTS-ONLY ENDPOINT (for greeting auto-play) ─────────────────────

@router.get("/speak")
async def speak_text(
    text: str = Query(..., description="Text to speak (English — will be translated to Tamil)"),
    user_id: str = Query("demo_elderly_user", description="User ID for logging"),
    lang: str = Query("ta-IN", description="Target language for TTS"),
):
    """
    TTS-only endpoint. Accepts English text, translates to Tamil, returns WAV audio.
    Used by the frontend to auto-play greetings and other proactive messages.
    """
    t0 = time.perf_counter()
    try:
        # Translate to Tamil if not already
        step_started = time.perf_counter()
        if lang == "ta-IN":
            tamil_text = await translate(text, "en-IN", "ta-IN")
        else:
            tamil_text = text
        _log_latency(user_id, "speak_translate", step_started)

        # TTS
        step_started = time.perf_counter()
        wav_out = await tts(tamil_text)
        _log_latency(user_id, "speak_tts", step_started)

        total_ms = round((time.perf_counter() - t0) * 1000, 2)
        logger.info(f"[voice/speak] user={user_id} latency_ms={total_ms}")

        if not wav_out:
            return StreamingResponse(
                io.BytesIO(_silent_wav()),
                media_type="audio/wav",
                headers={"X-ElderMind-Silent": "1", "X-ElderMind-Reason": "empty_tts"},
            )

        return StreamingResponse(io.BytesIO(wav_out), media_type="audio/wav")

    except Exception as e:
        logger.error(f"[voice/speak] error: {e}", exc_info=True)
        return StreamingResponse(
            io.BytesIO(_silent_wav()),
            media_type="audio/wav",
            headers={"X-ElderMind-Silent": "1", "X-ElderMind-Reason": "speak_error"},
        )
