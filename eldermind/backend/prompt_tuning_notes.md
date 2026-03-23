# Tanisha Prompt Tuning Notes

## Version History

1. `system_prompt_v1.txt`
- Baseline warm ElderMind persona.
- Memory usage + safety instructions in place.

2. `system_prompt_v2.txt`
- Added stronger guidance to mention only relevant memory.
- Improved loneliness handling instruction (acknowledge first, then suggest).

3. `system_prompt_v3.txt` (current baseline mirrored in `system_prompt.txt`)
- Added explicit rule to avoid robotic memory listing.
- Kept concise style, emotional safeguards, and codemix understanding.

## Current Operating Prompt

- Active file loaded by backend: `backend/prompts/system_prompt.txt`
- Aligned with `system_prompt_v3.txt`

## Next Independent Tuning Cycle

- Validate 7/7 emotional scenarios in one run and record outputs.
- Compare response quality at `temperature=0.75` vs `temperature=0.5`.
- Keep any successful update as `system_prompt_v4.txt`.
