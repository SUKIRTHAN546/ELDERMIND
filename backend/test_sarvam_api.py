import argparse
import base64
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv


BASE_URL = "https://api.sarvam.ai"


def load_env_files() -> None:
    root_dir = Path(__file__).resolve().parent.parent
    backend_dir = Path(__file__).resolve().parent

    load_dotenv(root_dir / ".env")
    load_dotenv(backend_dir / ".env")
    load_dotenv()


def build_headers(api_key: str) -> dict[str, str]:
    return {
        "api-subscription-key": api_key,
        "Content-Type": "application/json",
    }


def run_stt(client: httpx.Client, headers: dict[str, str], audio_path: Path, language_code: str) -> str:
    response = client.post(
        f"{BASE_URL}/speech-to-text",
        headers={"api-subscription-key": headers["api-subscription-key"]},
        data={
            "model": "saarika:v2.5",
            "language_code": language_code,
        },
        files={"file": (audio_path.name, audio_path.read_bytes(), "audio/wav")},
        timeout=60.0,
    )
    response.raise_for_status()
    payload = response.json()
    return payload.get("transcript", "")


def run_translate(
    client: httpx.Client,
    headers: dict[str, str],
    text: str,
    source_language_code: str,
    target_language_code: str,
) -> str:
    response = client.post(
        f"{BASE_URL}/translate",
        headers=headers,
        json={
            "input": text,
            "source_language_code": source_language_code,
            "target_language_code": target_language_code,
            "model": "mayura:v1",
        },
        timeout=30.0,
    )
    response.raise_for_status()
    payload = response.json()
    return payload.get("translated_text", text)


def run_tts(
    client: httpx.Client,
    headers: dict[str, str],
    text: str,
    target_language_code: str,
    speaker: str,
) -> bytes:
    response = client.post(
        f"{BASE_URL}/text-to-speech",
        headers=headers,
        json={
            "inputs": [text],
            "target_language_code": target_language_code,
            "speaker": speaker,
            "model": "bulbul:v3",
            "pace": 0.85,
            "enable_preprocessing": True,
        },
        timeout=60.0,
    )
    response.raise_for_status()
    payload = response.json()
    audios = payload.get("audios", [])
    if not audios:
        raise RuntimeError("Sarvam TTS returned no audio payload.")
    return base64.b64decode(audios[0])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Standalone Sarvam API tester for STT, translation, and TTS."
    )
    parser.add_argument(
        "--audio",
        default=None,
        help="Path to a WAV file for STT testing.",
    )
    parser.add_argument(
        "--stt-language",
        default="ta-IN",
        help="Language code for STT input audio. Default: ta-IN",
    )
    parser.add_argument(
        "--translate-to",
        default="en-IN",
        help="Target language code for translation. Default: en-IN",
    )
    parser.add_argument(
        "--tts-language",
        default="ta-IN",
        help="Target language code for TTS audio. Default: ta-IN",
    )
    parser.add_argument(
        "--tts-text",
        default=None,
        help="Optional custom text for TTS. If omitted, the translated text is used.",
    )
    parser.add_argument(
        "--speaker",
        default="meera",
        help="Sarvam TTS speaker. Default: meera",
    )
    parser.add_argument(
        "--output",
        default="backend/sarvam_tts_output.wav",
        help="Path to save the generated TTS WAV file.",
    )
    parser.add_argument(
        "--debug-key",
        action="store_true",
        help="Print a masked view of the loaded API key for debugging.",
    )
    parser.add_argument(
        "--text",
        default="Vanakkam, this is a Sarvam translation test.",
        help="Standalone text to use for translation and TTS tests.",
    )
    parser.add_argument(
        "--source-language",
        default="en-IN",
        help="Source language code for standalone translation tests. Default: en-IN",
    )
    parser.add_argument(
        "--only-stt",
        action="store_true",
        help="Run only speech-to-text.",
    )
    parser.add_argument(
        "--only-translate",
        action="store_true",
        help="Run only translation.",
    )
    parser.add_argument(
        "--only-tts",
        action="store_true",
        help="Run only text-to-speech.",
    )
    return parser.parse_args()


def main() -> None:
    load_env_files()
    args = parse_args()

    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        raise RuntimeError("Missing SARVAM_API_KEY in environment or .env file.")

    if args.debug_key:
        masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) >= 10 else "***"
        print(f"Loaded SARVAM_API_KEY: {masked_key}")
        print()

    feature_flags = [args.only_stt, args.only_translate, args.only_tts]
    if sum(feature_flags) > 1:
        raise RuntimeError("Use only one of --only-stt, --only-translate, or --only-tts at a time.")

    audio_path = None
    if not args.only_translate and not args.only_tts:
        if not args.audio:
            raise RuntimeError("--audio is required unless you use --only-translate or --only-tts.")
        audio_path = Path(args.audio).expanduser().resolve()
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

    output_path = Path(args.output).expanduser().resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    headers = build_headers(api_key)

    try:
        with httpx.Client() as client:
            transcript = ""
            translated_text = ""
            tts_text = ""

            if args.only_stt:
                transcript = run_stt(client, headers, audio_path, args.stt_language)
                print(f"STT transcript [{args.stt_language}]:")
                print(transcript or "<empty>")
                print()
                return

            if args.only_translate:
                translated_text = run_translate(
                    client,
                    headers,
                    args.text,
                    args.source_language,
                    args.translate_to,
                )
                print(f"Translated text [{args.source_language} -> {args.translate_to}]:")
                print(translated_text or "<empty>")
                print()
                return

            if args.only_tts:
                tts_text = args.tts_text or args.text
                audio_bytes = run_tts(
                    client,
                    headers,
                    tts_text,
                    args.tts_language,
                    args.speaker,
                )
                output_path.write_bytes(audio_bytes)
            else:
                transcript = run_stt(client, headers, audio_path, args.stt_language)
                print(f"STT transcript [{args.stt_language}]:")
                print(transcript or "<empty>")
                print()

                translated_text = run_translate(
                    client,
                    headers,
                    transcript,
                    args.stt_language,
                    args.translate_to,
                )
                print(f"Translated text [{args.stt_language} -> {args.translate_to}]:")
                print(translated_text or "<empty>")
                print()

                tts_text = args.tts_text or translated_text
                audio_bytes = run_tts(
                    client,
                    headers,
                    tts_text,
                    args.tts_language,
                    args.speaker,
                )
                output_path.write_bytes(audio_bytes)
    except httpx.HTTPStatusError as exc:
        print(f"Sarvam request failed: HTTP {exc.response.status_code}")
        print(exc.response.text)
        raise

    print(f"TTS input [{args.tts_language}]:")
    print(tts_text or "<empty>")
    print()
    print(f"Saved TTS audio to: {output_path}")


if __name__ == "__main__":
    main()
