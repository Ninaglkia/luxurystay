---
phase: 06-concierge-recommendations
plan: 01
subsystem: api
tags: [system-prompt, concierge, location, pure-function, tdd, vitest]

# Dependency graph
requires:
  - phase: 04-property-faq-integration
    provides: PropertyRecord interface, buildPropertyContext pattern, property fetch in route.ts
provides:
  - buildConciergeContext() pure function for location-aware concierge prompt injection
  - Concierge block wired into route.ts system prompt inside if (property) branch
affects: [07-chat-persona-ux-behaviors]

# Tech tracking
tech-stack:
  added: []
  patterns: [concierge-context-serializer, location-aware-prompt-engineering]

key-files:
  created:
    - src/app/api/chat/concierge-context.ts
    - src/app/api/chat/concierge-context.test.ts
  modified:
    - src/app/api/chat/route.ts

key-decisions:
  - "System prompt engineering over Google Places API — LLM training knowledge sufficient for Italian destination recommendations"
  - "Concierge block injected for all users (anon + auth) when property is loaded — no auth gating per AUTH-01"
  - "Suggestions framed as 'suggestions to explore, not guaranteed facts' to mitigate stale training data"

patterns-established:
  - "Concierge context serializer: pure function taking PropertyRecord, returning string block for system prompt"

requirements-completed: [CONC-01, CONC-02, CONC-03, CONC-04]

# Metrics
duration: 2 min
completed: 2026-03-03
---

# Phase 6 Plan 01: buildConciergeContext() TDD + Route Wiring Summary

**Location-aware concierge context serializer with TDD tests wired into route.ts for restaurant, transport, and activity recommendations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T13:24:08Z
- **Completed:** 2026-03-03T13:25:57Z
- **Tasks:** 2 (TDD feature + route wiring)
- **Files modified:** 3

## Accomplishments
- Pure `buildConciergeContext()` function serializes property address, coordinates, and category into a concierge guidance block
- System prompt instructs AI to provide specific, named recommendations for restaurants, transport, and local activities
- Framing ensures all recommendations are presented as "suggestions to explore, not guaranteed current facts"
- Graceful fallback when location data is missing — instructs AI to suggest contacting host
- 9 unit tests covering all serialization behaviors, null field handling, and edge cases
- Route.ts wired with two minimal changes (import + one line in if-property branch)
- All 110 tests pass across 5 test files, TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **TDD RED: Failing tests for buildConciergeContext** - `91678bb` (test)
2. **TDD GREEN: Implement buildConciergeContext** - `62be453` (feat)
3. **Task 2: Wire buildConciergeContext into route.ts** - `8de2a2f` (feat)

## Files Created/Modified
- `src/app/api/chat/concierge-context.ts` - Pure concierge context serializer (address, coordinates, category, recommendation framing, location fallback)
- `src/app/api/chat/concierge-context.test.ts` - 9 Vitest unit tests covering all behaviors
- `src/app/api/chat/route.ts` - Import + call buildConciergeContext inside if (property) branch

## Decisions Made
- System prompt engineering chosen over Google Places API — zero new dependencies, LLM training knowledge sufficient for Italian destinations
- Concierge block applies to all users (anonymous and authenticated) when property is loaded, per AUTH-01 scope
- "Suggestions to explore" framing mitigates stale training data risk
- No refactor phase needed — implementation is clean and follows established Phase 4/5 pattern exactly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 6 complete — concierge recommendations available for all property pages
- Ready for Phase 7: Chat Persona and UX Behaviors
- No blockers or concerns

---
*Phase: 06-concierge-recommendations*
*Completed: 2026-03-03*
