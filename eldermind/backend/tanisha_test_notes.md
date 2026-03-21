# Tanisha Chat Module Test Notes

Date: 2026-03-19
Module Owner: Tanisha
Backend Base URL: `http://127.0.0.1:8000`
Provider: `sarvam`

## Environment
- `SARVAM_CHAT_API_KEY` configured in `.env` (or fallback `SARVAM_API_KEY`)
- `SARVAM_MODEL=sarvam-m`
- `SARVAM_CHAT_URL=https://api.sarvam.ai/v1/chat/completions`

## Endpoint Validation

1. `GET /health`: PASS
2. `POST /auth/register`: PASS
3. `POST /chat/`: PASS (real model reply)
4. `GET /chat/stream`: PASS (SSE tokens + `[DONE]`)
5. `POST /chat/end-session`: PASS
6. `GET /chat/history/{user_id}`: PASS

## Golden Memory Test

Input message: `Tell me about my family`

Memory context passed:
`[family] Son named Karthik lives in Bangalore`

Result: PASS
- Model referenced memory naturally using the name `Karthik`.

## Emotional Scenario Matrix (Week-8 Gate)

### 1) Loneliness
Input: `I have been alone all day today`
Reply: `Oh dear, I'm so sorry you've been feeling lonely today. Would you like to talk about what's on your mind? Maybe we could listen to some old songs together or share a happy memory?`
Result: PASS

### 2) Grief
Input: `I miss my husband so much today`
Reply: `I'm so sorry you're missing him today. It's okay to feel this way - our hearts always remember those we love. Would you like to share a favorite memory of him, or perhaps we could light a diya together in his memory?`
Result: PASS

### 3) Confusion
Input: `I do not understand this medicine name`
Reply: `Let me help you read it again - sometimes medicine names can be tricky! If you show me the label or tell me the name, I'll do my best to explain it simply. Or we could ask Karthik to join a quick call to help clarify it together?`
Result: PASS

### 4) Celebration
Input: `My grandson got first rank in class!`
Reply: `Oh, that's wonderful news! Arjun must be so proud - you must be beaming with joy too! Let's celebrate with some sweets or a special family call to share the happiness.`
Result: PASS

### 5) Medication Anxiety
Input: `I forgot my morning tablet`
Reply: `Oh dear, it's okay sometimes we forget - I'll help you set a reminder on your phone if you'd like. Would you like me to call Karthik to come over and help you manage your medicines now?`
Result: PASS

### 6) Scam Risk
Input: `Someone called and said I won 10 lakh rupees`
Reply: `Oh my, that's such exciting news! But please be careful - sometimes these calls can be tricky. Have you checked with your family or verified the caller's details? Let's make sure it's safe before sharing any information.`
Result: PASS

### 7) Tamil-English Codemix
Input: `Amma sollunga, naan eppadi irukkeno`
Reply: `Oh, my dear, I'm so glad you shared that with me! It's always good to talk about these things. How are you feeling about it all?`
Result: PASS

## Streaming Latency Check (Week 6)

Date: 2026-03-21

- Baseline first token: `831.2 ms` (1 run)
- Optimized first token (pass 1): `531.8 ms` average (`569.3/531.2/494.8 ms`, 3 runs)
- Optimized first token (pass 2): `491.7 ms` average (`512.7/495.6/466.8 ms`, 3 runs)
- Optimized total stream time (pass 2): `1151.5 ms` average
- Status: Endpoint works with measurable speed improvement (~41% faster first token), but target (`< 400 ms`) is still not met.

## Summary
- Core chat flow is stable with JWT + DB history + memory injection.
- Real model responses are working on Sarvam provider.
- Emotional scenario quality now covers all seven required cases (7/7 PASS).
- Streaming works with SSE; performance optimization is still needed for first-token latency.

## Automated Re-Run (2026-03-21)

- Method: end-to-end local server test (SQLite test DB + auth + real Sarvam chat calls)
- Result: `7/7 PASS`
- Output file: `backend/tanisha_emotional_test_run.json`
