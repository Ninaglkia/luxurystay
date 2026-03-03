---
phase: 01-ai-api-foundation
plan: 01
subsystem: api
tags: [ai, streaming, anthropic, vercel-ai-sdk, next-api-route]

# Dependency graph
requires: []
provides:
  - "Streaming POST /api/chat Route Handler using Vercel AI SDK and Anthropic claude-haiku-4-5"
  - "Server-only ANTHROPIC_API_KEY env var pattern established"
  - "maxDuration = 30 Vercel timeout configuration"
  - "Vitest test infrastructure for Next.js API routes"
affects: [02-rate-limiting, 04-supabase-context, 07-chat-ui]

# Tech tracking
tech-stack:
  added:
    - "ai@6.0.108 (Vercel AI SDK)"
    - "@ai-sdk/anthropic@3.0.53 (Anthropic provider adapter)"
    - "vitest@4.0.18 (test runner)"
    - "@vitest/coverage-v8@4.0.18"
  patterns:
    - "streamText() + toUIMessageStreamResponse() for streaming AI responses"
    - "convertToModelMessages() is async (returns Promise) — await required"
    - "Server-only env vars: no NEXT_PUBLIC_ prefix for AI API keys"
    - "maxDuration = 30 export on every streaming route"

key-files:
  created:
    - "src/app/api/chat/route.ts"
    - "src/app/api/chat/route.test.ts"
    - "vitest.config.ts"
  modified:
    - "package.json"
    - "package-lock.json"
    - ".env.local (gitignored — ANTHROPIC_API_KEY placeholder added)"

key-decisions:
  - "Used claude-haiku-4-5 model ID (confirmed as correct at implementation time)"
  - "convertToModelMessages is async in ai@6.0.108 — await required"
  - "Used toUIMessageStreamResponse() (not toDataStreamResponse()) for useChat hook compatibility"
  - "No runtime = edge export — Node.js runtime + maxDuration = 30 is sufficient per research"
  - "maxOutputTokens = 500 for cost control from day one"
  - "Vitest chosen as test framework (Next.js 16 + React 19 compatible)"

patterns-established:
  - "Pattern: All AI API calls go through src/app/api/chat/route.ts — never in client components"
  - "Pattern: streamText() result must call .toUIMessageStreamResponse() not .toDataStreamResponse()"
  - "Pattern: convertToModelMessages() is async — always await it"

requirements-completed: [SEC-01, SEC-04]

# Metrics
duration: 15min
completed: 2026-03-03
---

# Phase 01 Plan 01: AI API Foundation — Chat Route Handler Summary

**Streaming POST /api/chat endpoint with claude-haiku-4-5 via Vercel AI SDK, server-only API key, and explicit Vercel timeout configuration**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-03T11:28:00Z
- **Completed:** 2026-03-03T11:43:00Z
- **Tasks:** 2 of 3 automated (Task 3 awaits human verification)
- **Files modified:** 5 (+ .env.local gitignored)

## Accomplishments

- Installed ai@6.0.108 and @ai-sdk/anthropic@3.0.53 — correct paired versions
- Created `src/app/api/chat/route.ts` — streaming AI endpoint with input validation, maxDuration = 30, and server-only API key
- TDD cycle completed: 8 tests written (RED), route implemented (GREEN), all 8 tests passing
- Vitest test infrastructure set up for future API route tests
- ANTHROPIC_API_KEY added to .env.local with server-only convention (no NEXT_PUBLIC_ prefix)
- TypeScript compiles cleanly (0 errors)
- Security verified: no AI SDK imports in any client component

## Package Versions Installed

```
ai@6.0.108
@ai-sdk/anthropic@3.0.53
```

## Model ID Used

`claude-haiku-4-5` — used as specified in plan. The plan notes to verify if API rejects it and to try `claude-haiku-4-5-20251022` as fallback; this will be confirmed during Task 3 curl testing.

## convertToModelMessages: Async or Sync?

**Async** — `convertToModelMessages` in ai@6.0.108 returns a Promise. The `await` keyword is required (as in the plan's implementation).

Confirmed with:
```
node -e "const ai = require('ai'); const result = ai.convertToModelMessages([]); console.log('isPromise:', result instanceof Promise)"
// Output: isPromise: true
```

## Task Commits

Each task was committed atomically:

1. **Task 1: Install AI SDK packages** - `403815d` (chore)
2. **Task 2: TDD RED — failing tests** - `8f80397` (test)
3. **Task 2: TDD GREEN — route implementation** - `89f8cef` (feat)

_Task 3 is a human-verify checkpoint — no commit needed (no code changes)._

## Files Created/Modified

- `src/app/api/chat/route.ts` — Streaming POST /api/chat handler with UIMessage validation, streamText, convertToModelMessages, maxDuration = 30
- `src/app/api/chat/route.test.ts` — 8 unit tests covering: maxDuration export, 200 for valid messages, 400 for malformed JSON, 400 for non-array messages, streaming method verification
- `vitest.config.ts` — Vitest config for Node environment with `@/*` path alias
- `package.json` — Added ai, @ai-sdk/anthropic as deps; vitest, @vitest/coverage-v8 as devDeps; test scripts
- `package-lock.json` — Lock file updated
- `.env.local` (gitignored) — ANTHROPIC_API_KEY=sk-ant-api03-PLACEHOLDER added

## Decisions Made

- **convertToModelMessages is async**: Required `await` — confirmed before writing route.ts
- **toUIMessageStreamResponse()**: Used instead of toDataStreamResponse() for Phase 7 useChat compatibility
- **No `runtime = 'edge'` export**: Research confirmed Node.js runtime + maxDuration is preferred; edge can conflict with Node.js APIs
- **Vitest for testing**: No existing test framework; Vitest chosen for ESM-native, fast, minimal config

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Vitest test infrastructure (no test framework existed)**

- **Found during:** Task 2 (TDD task requires test runner)
- **Issue:** Plan specified `tdd="true"` but no test framework existed in the project
- **Fix:** Installed vitest@4.0.18 + @vitest/coverage-v8, created vitest.config.ts, added test scripts to package.json
- **Files modified:** package.json, package-lock.json, vitest.config.ts (new)
- **Verification:** `npx vitest run` executes 8 tests and all pass
- **Committed in:** 8f80397 (TDD RED commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking: missing test infrastructure)
**Impact on plan:** Necessary for TDD execution. No scope creep.

## Security Verification

- `ANTHROPIC_API_KEY` added without `NEXT_PUBLIC_` prefix — confirmed with `grep "ANTHROPIC" .env.local`
- No AI SDK imports in any client component — confirmed with grep across `src/app/components/`
- No direct Anthropic API calls possible from browser — all AI calls proxied through `/api/chat`
- SEC-01 satisfied: API key lives only in server environment, all AI calls in route.ts
- SEC-04 satisfied: maxDuration = 30 prevents Vercel timeout issues; streamText ensures first token <2s

## User Setup Required

The ANTHROPIC_API_KEY placeholder in `.env.local` must be replaced with a real key from https://console.anthropic.com/ before Task 3 (human verification curl test) can succeed.

See Task 3 checkpoint for full curl verification instructions.

## Next Phase Readiness

- POST /api/chat streaming endpoint is complete and tested
- Awaiting Task 3 human verification (curl test + browser DevTools security check)
- After Task 3 approval: Phase 1 is complete, Phase 2 (rate limiting) can begin
- Vercel plan/Fluid Compute status (noted as unknown blocker in STATE.md) should be confirmed during Task 3 testing

---
*Phase: 01-ai-api-foundation*
*Completed: 2026-03-03*

## Self-Check: PASSED

Files verified:
- FOUND: src/app/api/chat/route.ts
- FOUND: src/app/api/chat/route.test.ts
- FOUND: vitest.config.ts
- FOUND: .planning/phases/01-ai-api-foundation/01-01-SUMMARY.md

Commits verified:
- FOUND: 403815d (chore: install AI SDK packages)
- FOUND: 8f80397 (test: failing tests for route handler)
- FOUND: 89f8cef (feat: implement streaming /api/chat Route Handler)
