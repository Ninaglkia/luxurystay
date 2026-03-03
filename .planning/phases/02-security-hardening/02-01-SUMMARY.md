---
phase: 02-security-hardening
plan: 01
subsystem: api
tags: [rate-limiting, upstash, redis, proxy, next16, serverless]

requires:
  - phase: 01-ai-api-foundation
    provides: POST /api/chat endpoint and middleware.ts auth guards
provides:
  - Rate limiting for /api/chat (anon: 15/min, auth: 30/min) via Upstash Redis
  - Next.js 16 proxy.ts migration (replaces middleware.ts)
  - x-user-id header forwarding for authenticated /api/chat requests
affects: [02-security-hardening, 07-chat-ui]

tech-stack:
  added: [@upstash/ratelimit, @upstash/redis, @vercel/functions]
  patterns: [sliding-window-rate-limiting, server-side-header-injection, proxy-pattern]

key-files:
  created: [src/lib/ratelimit.ts, src/proxy.ts, src/proxy.test.ts]
  modified: [package.json, package-lock.json]

key-decisions:
  - "Sliding window algorithm chosen over fixed window — prevents burst attacks at window boundaries"
  - "ipAddress() from @vercel/functions used instead of request.ip — removed in Next.js 15"
  - "x-user-id header set server-side by proxy — cannot be forged by clients"
  - "Module-scope Ratelimit instances — never inside functions (breaks Upstash ephemeral caching)"

patterns-established:
  - "Proxy pattern: export async function proxy() in src/proxy.ts for Next.js 16"
  - "Rate limit identifier pattern: auth:{userId} for authenticated, anon:{ip} for anonymous"

requirements-completed: [SEC-02]

duration: 3min
completed: 2026-03-03
---

# Phase 02 Plan 01: Rate Limiting and Proxy Migration Summary

**IP-based rate limiting via Upstash Redis (anon: 15/min, auth: 30/min) with Next.js 16 proxy migration and x-user-id header forwarding**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-03T12:06:07Z
- **Completed:** 2026-03-03T12:09:00Z
- **Tasks:** 2 (auto) + 1 checkpoint (pending human verification)
- **Files modified:** 5

## Accomplishments
- Migrated middleware.ts to proxy.ts for Next.js 16 compatibility
- Added IP-based rate limiting for /api/chat with Upstash Redis sliding window
- Anonymous users limited to 15 req/min, authenticated to 30 req/min
- x-user-id header forwarded server-side for authenticated /api/chat requests
- 8 comprehensive proxy tests passing alongside 8 existing route tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages and create ratelimit module** - `8594447` (chore)
2. **Task 2 (RED): Failing proxy tests** - `717bf9d` (test)
3. **Task 2 (GREEN): Proxy implementation + middleware deletion** - `8fefca8` (feat)
4. **Task 3: Human verification** - checkpoint (pending)

## Files Created/Modified
- `src/lib/ratelimit.ts` - Two Ratelimit instances (anonRatelimit, authRatelimit) at module scope
- `src/proxy.ts` - Next.js 16 proxy with rate limiting, x-user-id forwarding, auth guards
- `src/proxy.test.ts` - 8 tests covering proxy behavior
- `src/middleware.ts` - DELETED (replaced by proxy.ts)
- `package.json` - Added @upstash/ratelimit, @upstash/redis, @vercel/functions

## Decisions Made
- Sliding window algorithm over fixed window to prevent burst attacks at boundaries
- ipAddress() from @vercel/functions (request.ip removed in Next.js 15)
- Module-scope Ratelimit instances (function-scope breaks Upstash ephemeral caching)
- x-user-id header set server-side in proxy — cannot be forged by clients

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
**External services require manual configuration.** See [02-USER-SETUP.md](./02-USER-SETUP.md) for:
- UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables
- Upstash Redis database creation

## Next Phase Readiness
- x-user-id header is now available for Plan 02-02 to differentiate anonymous vs authenticated system prompts
- Rate limiting operational once Upstash Redis credentials are configured

---
*Phase: 02-security-hardening*
*Completed: 2026-03-03*
