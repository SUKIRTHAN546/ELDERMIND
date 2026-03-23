"""
ElderMind — Voice Pipeline Router
Owner: Sukirthan (AI Engineer 3)

Endpoint:
  POST /voice/process  — receives audio blob, returns audio blob

Full pipeline:
  Sarvam Saarika v2.5 STT  →  Mayura translate (ta→en)  →
  /memory/retrieve          →  GPT-4o-mini via /chat/     →
  Mayura translate (en→ta)  →  Bulbul v3 TTS             →
  WAV bytes returned to React VoiceButton

Performance target: < 3.5 s total perceived latency
WebSocket streaming: first TTS sentence plays before LLM finishes generating

Tech: Sarvam AI full API, WebSocket, Docker Compose
"""
import httpx, base64, os, io, time, logging
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from pydub import AudioSegment

router = APIRouter(prefix="/voice", tags=["voice"])
logger = logging.getLogger("voice")



KEY = os.getenv("SARVAM_API_KEY")
HDR = {"api-subscription-key": KEY, "Content-Type": "application/json"}


def _log_latency(user_id: str, step: str, started_at: float) -> None:
    latency_ms = round((time.perf_counter() - started_at) * 1000, 2)
    logger.info(f"[voice] user={user_id} step={step} latency_ms={latency_ms}")

async def stt(wav: bytes) -> str:
    r = httpx.post("https://api.sarvam.ai/speech-to-text", headers=HDR,
        json={"model":"saarika:v2.5","language_code":"ta-IN",
              "audio":base64.b64encode(wav).decode(),"mode":"codemix"})
    r.raise_for_status()
    return r.json().get("transcript","")

async def translate(text: str, src: str, tgt: str) -> str:
    r = httpx.post("https://api.sarvam.ai/translate", headers=HDR,
        json={"input":text,"source_language_code":src,
              "target_language_code":tgt,"model":"mayura:v1"})
    r.raise_for_status()
    return r.json().get("translated_text", text)

async def tts(text: str) -> bytes:
    r = httpx.post("https://api.sarvam.ai/text-to-speech", headers=HDR,
        json={"inputs":[text],"target_language_code":"ta-IN",
              "speaker":"meera","model":"bulbul:v3",
              "pace":0.85,"enable_preprocessing":True})
    r.raise_for_status()
    audios = r.json().get("audios",[])
    return base64.b64decode(audios[0]) if audios else b""

@router.post("/process")
async def process_voice(user_id: str, audio: UploadFile = File(...)):
    t0 = time.perf_counter()

    step_started = time.perf_counter()
    raw = await audio.read()
    _log_latency(user_id, "read_upload", step_started)

    step_started = time.perf_counter()
    seg = AudioSegment.from_file(io.BytesIO(raw)).set_frame_rate(16000).set_channels(1)
    buf = io.BytesIO(); seg.export(buf, format="wav")
    wav_bytes = buf.getvalue()
    _log_latency(user_id, "convert_to_wav_16khz_mono", step_started)

    step_started = time.perf_counter()
    transcript = await stt(wav_bytes)
    _log_latency(user_id, "stt", step_started)

    step_started = time.perf_counter()
    en_text    = await translate(transcript, "ta-IN", "en-IN")
    _log_latency(user_id, "translate_ta_to_en", step_started)

    memory_context = ""
    async with httpx.AsyncClient() as hc:
        step_started = time.perf_counter()
        mr = await hc.post("http://localhost:8000/memory/retrieve",
            json={"user_id":user_id,"query":en_text,"n_results":5})
        memory_context = mr.json().get("facts","")
        _log_latency(user_id, "memory_retrieve", step_started)

    async with httpx.AsyncClient() as hc:
        step_started = time.perf_counter()
        cr = await hc.post("http://localhost:8000/chat/",
            json={"user_id":user_id,"message":en_text,
                  "memory_context":memory_context})
        en_reply = cr.json().get("reply","")
        _log_latency(user_id, "chat", step_started)

    step_started = time.perf_counter()
    ta_reply = await translate(en_reply, "en-IN", "ta-IN")
    _log_latency(user_id, "translate_en_to_ta", step_started)

    step_started = time.perf_counter()
    wav_out  = await tts(ta_reply)
    _log_latency(user_id, "tts", step_started)

    total_latency_ms = round((time.perf_counter() - t0) * 1000, 2)
    logger.info(f"[voice] user={user_id} step=total latency_ms={total_latency_ms}")
    return StreamingResponse(io.BytesIO(wav_out), media_type="audio/wav")
