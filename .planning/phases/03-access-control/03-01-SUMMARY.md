---
phase: 03-access-control
plan: 01
subsystem: auth
tags: [middleware, security, header-stripping, x-user-id, proxy]

# Dependency graph
requires:
  - phase: 02-security-hardening
    provides: "proxy.ts with rate limiting and x-user-id forwarding for authenticated users"
provides:
  - "Fixed proxy.ts that strips client x-user-id headers before session check"
  - "AUTH-01 through AUTH-04 regression tests in proxy.test.ts"
  - "Route permission contract documentation in proxy.ts"
affects: [04-property-faq-integration, 05-booking-support, 09-dedicated-chat-page]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Client header stripping before session read — strip untrusted headers at middleware entry point"]

key-files:
  created: []
  modified:
    - src/proxy.ts
    - src/proxy.test.ts

key-decisions:
  - "Strip x-user-id at top of proxy() before supabaseResponse construction — ensures all three NextResponse.next() call sites use clean headers"
  - "Build authenticated user headers from strippedHeaders (not request.headers) — prevents any forged header from leaking through"
  - "No refactor phase needed — fix is minimal and clean as-is"

patterns-established:
  - "Header stripping pattern: untrusted client headers are deleted before any middleware logic, re-added only when server confirms the value"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 03 Plan 01: Fix x-user-id Header Stripping Bug Summary

**Fixed security bug where anonymous clients could forge auth tier via x-user-id header; added AUTH-01 through AUTH-04 regression tests**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T12:29:30Z
- **Completed:** 2026-03-03T12:31:31Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed critical security vulnerability: anonymous clients can no longer forge `x-user-id` header to bypass auth tier detection
- Added 3 new access control regression tests (AUTH-01, AUTH-03, AUTH-04) with AUTH-02 covered by existing test
- Documented route permission contract in proxy.ts for future developer reference
- All 32 tests pass across both test files with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for AUTH-01 through AUTH-04** - `cd3d8c6` (test — TDD RED phase)
2. **Task 2: Fix proxy.ts — strip x-user-id before session check** - `8b5e7cb` (fix — TDD GREEN phase)

_TDD plan: RED phase confirmed AUTH-03 failure (security bug), GREEN phase confirmed fix._

## Files Created/Modified
- `src/proxy.ts` - Fixed to strip client x-user-id at entry point; uses strippedHeaders in all NextResponse.next() calls; added route permission comment
- `src/proxy.test.ts` - Added 3 new tests in nested `describe('access control')` block for AUTH-01, AUTH-03, AUTH-04

## Decisions Made
- Strip x-user-id at top of proxy() before supabaseResponse construction — ensures clean headers propagate everywhere
- Build authenticated user headers from strippedHeaders (not request.headers) — no forged value can leak through
- No TDD REFACTOR phase needed — the fix is minimal (3 edits) and clean as written

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AUTH-04 test used toContain on null**
- **Found during:** Task 1 (RED phase)
- **Issue:** `response.headers.get('location')` returns null (not a string) for non-redirect responses; `toContain` on null throws
- **Fix:** Changed assertion to `expect(location === null || !location.includes('/login')).toBe(true)`
- **Files modified:** src/proxy.test.ts
- **Verification:** Test passes for both redirect and non-redirect cases
- **Committed in:** cd3d8c6 (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test assertion fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth tier detection is now fully verified and secure — Phase 4+ can rely on the `x-user-id` invariant
- Route permission contract documented for Phase 9 `/chat` page
- No blockers for Phase 4 (Property FAQ Integration)

---
*Phase: 03-access-control*
*Completed: 2026-03-03*
