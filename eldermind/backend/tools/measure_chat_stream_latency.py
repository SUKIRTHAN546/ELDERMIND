"""
Measure first-token and total-stream latency for GET /chat/stream.

Usage:
  python tools/measure_chat_stream_latency.py --base-url http://127.0.0.1:8000 --token <JWT>
"""

from __future__ import annotations

import argparse
import asyncio
import statistics
import time

import httpx


async def measure_once(base_url: str, token: str, message: str) -> tuple[float, float, int]:
    headers = {"Authorization": f"Bearer {token}"}
    params = {"message": message}
    first_token_ms = None
    total_chars = 0
    start = time.perf_counter()

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream(
            "GET",
            f"{base_url.rstrip('/')}/chat/stream",
            params=params,
            headers=headers,
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue

                payload = line[6:]
                if payload == "[DONE]":
                    break

                if first_token_ms is None:
                    first_token_ms = (time.perf_counter() - start) * 1000

                total_chars += len(payload)

    total_ms = (time.perf_counter() - start) * 1000
    return first_token_ms or total_ms, total_ms, total_chars


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--token", required=True, help="JWT from /auth/login")
    parser.add_argument("--runs", type=int, default=5)
    parser.add_argument("--message", default="Please give me a short warm greeting.")
    args = parser.parse_args()

    results = []
    for i in range(args.runs):
        first_ms, total_ms, chars = await measure_once(args.base_url, args.token, args.message)
        results.append((first_ms, total_ms, chars))
        print(
            f"run={i+1} first_token_ms={first_ms:.1f} total_ms={total_ms:.1f} chars={chars}"
        )

    first_vals = [r[0] for r in results]
    total_vals = [r[1] for r in results]

    print("\nSUMMARY")
    print(f"first_token_avg_ms={statistics.mean(first_vals):.1f}")
    print(f"first_token_p95_ms={max(first_vals):.1f}")
    print(f"total_avg_ms={statistics.mean(total_vals):.1f}")
    print(f"total_p95_ms={max(total_vals):.1f}")


if __name__ == "__main__":
    asyncio.run(main())
