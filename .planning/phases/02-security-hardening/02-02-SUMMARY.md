---
phase: 02-security-hardening
plan: 02
subsystem: api
tags: [prompt-injection, system-prompt, auth-tier, security, ai-safety]

requires:
  - phase: 01-ai-api-foundation
    provides: POST /api/chat route handler with streamText
  - phase: 02-security-hardening
    provides: x-user-id header from proxy.ts (plan 02-01)
provides:
  - Prompt injection detection with graceful refusal (10 regex patterns)
  - Differentiated system prompt (anonymous vs authenticated tiers)
  - Role-locking constraints in system prompt
  - Security logging for injection attempts
affects: [07-chat-ui, 04-supabase-rag]

tech-stack:
  added: []
  patterns: [injection-detection, auth-tiered-prompts, role-locking]

key-files:
  created: []
  modified: [src/app/api/chat/route.ts, src/app/api/chat/route.test.ts]

key-decisions:
  - "Injection refusal returns HTTP 200 (not 4xx) — error status signals detection to attacker"
  - "UIMessage uses parts[] not content in ai@6.x — type-safe extraction via filter/map"
  - "Auth tier from x-user-id header (proxy-set, unforgeable) not session/cookie"
  - "10 regex patterns covering OWASP LLM injection cheat sheet patterns"

patterns-established:
  - "Injection detection: detectInjection(text) using INJECTION_PATTERNS array"
  - "System prompt composition: SYSTEM_PROMPT_BASE + (isAuth ? AUTH_ADDITIONS : ANON_ADDITIONS)"
  - "Role-locking: ROLE CONSTRAINTS block in every system prompt"

requirements-completed: [SEC-03, SEC-05]

duration: 3min
completed: 2026-03-03
---

# Phase 02 Plan 02: Prompt Injection Detection and Differentiated System Prompts Summary

**Prompt injection detection with 10 regex patterns + auth-tiered system prompts restricting anonymous users from booking/payment data**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-03T12:10:50Z
- **Completed:** 2026-03-03T12:13:30Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 2

## Accomplishments
- Added prompt injection detection with 10 OWASP-based regex patterns
- Graceful refusal: polite 200 response (not error status) when injection detected
- Security logging: console.warn with IP and truncated message on injection
- Differentiated system prompt: anonymous users restricted from booking/payment data
- Auth-tiered prompt: authenticated users get full booking/payment access
- Role-locking constraints: NEVER reveal instructions, NEVER impersonate

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for injection + system prompts** - `0cbe0c7` (test)
2. **Task 1+2 (GREEN): Implementation** - `b295627` (feat)

**Plan metadata:** (pending docs commit)

_Note: Both tasks implemented in single GREEN phase since they modify the same file._

## Files Created/Modified
- `src/app/api/chat/route.ts` - Added INJECTION_PATTERNS, detectInjection(), SYSTEM_PROMPT_BASE, ANON_ADDITIONS, AUTH_ADDITIONS
- `src/app/api/chat/route.test.ts` - Added 13 new tests (8 injection + 5 system prompt)

## Decisions Made
- Injection refusal returns HTTP 200 (not 4xx) to avoid signaling detection to attacker
- UIMessage uses parts[] not content in ai@6.x — fixed TypeScript type extraction
- Auth tier determined by x-user-id header (set server-side by proxy.ts, unforgeable)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error with UIMessage.content**
- **Found during:** Task 1 GREEN phase
- **Issue:** Plan used `typeof lastUserMessage?.content === 'string'` but UIMessage in ai@6.x has `parts` not `content`
- **Fix:** Changed to use `parts` array with type-safe filter/map
- **Files modified:** src/app/api/chat/route.ts
- **Verification:** `npx tsc --noEmit` returns 0 errors
- **Committed in:** b295627

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary type fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 02 complete: rate limiting, injection detection, auth-tiered prompts all operational
- Ready for Phase 03+ development
- 29 tests passing across all test files

---
*Phase: 02-security-hardening*
*Completed: 2026-03-03*
