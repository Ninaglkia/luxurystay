---
phase: 07-chat-persona-and-ux-behaviors
plan: 01
subsystem: api
tags: [system-prompt, persona, luxury-tone, fallback, ux]

# Dependency graph
requires:
  - phase: 01-ai-api-foundation
    provides: SYSTEM_PROMPT_BASE constant in route.ts
provides:
  - Luxury persona tone block (TONE AND VOICE) in SYSTEM_PROMPT_BASE
  - Graceful fallback instruction block (FALLBACK INSTRUCTIONS) in SYSTEM_PROMPT_BASE
affects: [08-chat-bubble-widget, 09-dedicated-chat-page]

# Tech tracking
tech-stack:
  added: []
  patterns: [luxury-concierge-tone, explicit-fallback-with-host-redirect]

key-files:
  created: []
  modified:
    - src/app/api/chat/route.ts

key-decisions:
  - "Tone examples use WRONG/RIGHT format for clarity in system prompt"
  - "Fallback redirects to host AND LuxuryStay support team (dual channel)"
  - "Prohibit both 'I believe' and 'I think' phrasing to prevent hedged guesses"

patterns-established:
  - "Luxury tone: formal complete sentences, no exclamation marks, no emojis, 'I would be happy to' phrasing"
  - "Fallback pattern: explicit admission + host redirect + offer of available help"

requirements-completed: [UX-01, UX-03]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 7 Plan 01: Luxury Persona and Fallback Summary

**Luxury concierge persona tone and graceful fallback instructions appended to SYSTEM_PROMPT_BASE in route.ts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03
- **Completed:** 2026-03-03
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- TONE AND VOICE block with formal/warm/hospitable communication guidelines and WRONG/RIGHT style examples
- FALLBACK INSTRUCTIONS block enforcing explicit "I don't know" responses with dual-channel host/support redirect
- Prohibition on guessing, estimating, or using hedging language ("I believe", "I think")
- Follow-up offer pattern after every fallback response

## Task Commits

Each task was committed atomically:

1. **Task 1: Add luxury persona tone block** - `200b276` (feat)
2. **Task 2: Add graceful fallback instructions** - `69b0ba2` (feat)

## Files Created/Modified
- `src/app/api/chat/route.ts` - Added TONE AND VOICE and FALLBACK INSTRUCTIONS blocks to SYSTEM_PROMPT_BASE

## Decisions Made
- Used WRONG/RIGHT example format in system prompt for maximum clarity to the AI model
- Dual redirect channel (host + LuxuryStay support) gives guests two paths for resolution
- Explicitly prohibited "I believe" and "I think" phrasing to prevent hedged guesses

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- System prompt now enforces luxury persona and graceful fallback across all tiers
- Ready for Phase 8 (Chat Bubble Widget) which will surface these behaviors in the UI

---
*Phase: 07-chat-persona-and-ux-behaviors*
*Completed: 2026-03-03*
