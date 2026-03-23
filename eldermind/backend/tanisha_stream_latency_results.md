# Tanisha Stream Latency Results

## Goal (Week 6)

- First token: under 400 ms (target)
- Streaming endpoint stable with `[DONE]` terminator

## How To Run

1. Start backend server.
2. Get JWT via `/auth/login`.
3. Run:

```bash
python tools/measure_chat_stream_latency.py --base-url http://127.0.0.1:8000 --token <JWT> --runs 5
```

## Result Log

| Date | Runs | first_token_avg_ms | first_token_p95_ms | total_avg_ms | total_p95_ms | Notes |
|---|---:|---:|---:|---:|---:|---|
| 2026-03-21 | 1 | 831.2 | 831.2 | 1836.3 | 1836.3 | Real Sarvam stream test completed; first-token target (<400ms) not yet met. |
| 2026-03-21 | 3 | 531.8 | 569.3 | 1403.4 | 1791.4 | After stream-path optimization (connection reuse + compact context + lighter stream payload). ~36% first-token improvement vs baseline. |
| 2026-03-21 | 3 | 491.7 | 512.7 | 1151.5 | 1285.1 | After reliability fix + clean-run benchmark (history reset per run). ~41% first-token improvement vs baseline. |
