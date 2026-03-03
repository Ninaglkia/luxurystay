---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-03T13:59:56.000Z"
progress:
  total_phases: 8
  completed_phases: 8
  total_plans: 12
  completed_plans: 12
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Guests receive immediate, contextual answers grounded in real property data, reducing manual support load
**Current focus:** Phase 8 — Chat Bubble Widget

## Current Position

Phase: 8 of 9 (Chat Bubble Widget)
Plan: 1 of 1 in current phase (complete)
Status: Phase 08 execution complete — awaiting verification
Last activity: 2026-03-03 — Phase 08 Plan 01 complete

Progress: [████████░░] ~89% (8/9 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 12 (01-01, 02-01, 02-02, 03-01, 04-01, 04-02, 05-01, 05-02, 06-01, 07-01, 07-02, 08-01 complete)
- Average duration: ~3 min
- Total execution time: ~35 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-ai-api-foundation | 1/1 | ~15 min | ~15 min |
| 02-security-hardening | 2/2 | ~6 min | ~3 min |
| 03-access-control | 1/1 | ~2 min | ~2 min |
| 04-property-faq-integration | 2/2 | ~4 min | ~2 min |
| 05-booking-support | 2/2 | ~8 min | ~4 min |
| 06-concierge-recommendations | 1/1 | ~2 min | ~2 min |
| 07-chat-persona-and-ux-behaviors | 2/2 | ~5 min | ~2.5 min |
| 08-chat-bubble-widget | 1/1 | ~1 min | ~1 min |

**Recent Trend:**
- Last 5 plans: 05-02 (4 min), 06-01 (2 min), 07-01 (2 min), 07-02 (3 min), 08-01 (1 min)
- Trend: consistently fast

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Vercel AI SDK v6 + Claude Haiku 4.5 via `@ai-sdk/anthropic` — optimal cost/quality, prompt caching available
- [Init]: No RAG or vector store — property context injected directly into system prompt per request
- [Init]: Session-only chat history — no Supabase persistence for v1
- [Init]: ChatBubble lazy-loaded with `next/dynamic { ssr: false }` — non-negotiable for page load performance
- [01-01]: convertToModelMessages is async in ai@6.0.108 — await required when calling it
- [01-01]: toUIMessageStreamResponse() used (not toDataStreamResponse()) for useChat hook compatibility in Phase 7
- [01-01]: No runtime = edge export — Node.js runtime + maxDuration = 30 is sufficient (edge can conflict with Node.js APIs)
- [01-01]: Vitest chosen as test framework — ESM-native, minimal config, works with Next.js App Router
- [02-01]: Sliding window rate limiting (not fixed window) — prevents burst attacks at window boundaries
- [02-01]: ipAddress() from @vercel/functions — request.ip removed in Next.js 15
- [02-01]: x-user-id header set server-side by proxy — cannot be forged by clients
- [02-01]: Module-scope Ratelimit instances — function-scope breaks Upstash ephemeral caching
- [02-02]: Injection refusal returns HTTP 200 (not 4xx) — error status signals detection to attacker
- [02-02]: UIMessage uses parts[] not content in ai@6.x — type-safe extraction required
- [02-02]: Auth tier from x-user-id header (proxy-set, unforgeable) not session/cookie
- [03-01]: Strip x-user-id at top of proxy() before supabaseResponse construction — ensures strippedHeaders propagate to all three NextResponse.next() call sites
- [03-01]: Build authenticated user headers from strippedHeaders (not request.headers) — no forged value can leak through
- [04-01]: buildPropertyContext is a pure function with no Supabase dependency — testable without mocking
- [04-01]: Null fields omitted entirely rather than showing "N/A" — cleaner system prompt
- [04-01]: Amenity and cancellation labels kept in Italian to match existing UI patterns
- [04-02]: UUID regex validation before any Supabase query — prevents injection and unnecessary DB calls
- [04-02]: Property fetch wrapped in try/catch with console.error — never fails the request
- [04-02]: propertyContextBlock appended after auth tier additions — layered system prompt
- [06-01]: System prompt engineering over Google Places API — LLM training knowledge sufficient for Italian destination recommendations
- [06-01]: Concierge block applies to all users (anon + auth) when property loaded — no auth gating per AUTH-01
- [06-01]: "Suggestions to explore" framing mitigates stale training data risk
- [07-01]: TONE AND VOICE block with WRONG/RIGHT examples in SYSTEM_PROMPT_BASE — formal, warm, no exclamation marks or emojis
- [07-01]: FALLBACK INSTRUCTIONS block prohibits "I believe"/"I think" guessing — explicit "I don't know" + dual redirect to host and support
- [07-02]: @ai-sdk/react installed separately — not bundled with ai package in v6
- [07-02]: sessionStorage key namespaced by propertyId — prevents cross-property history bleed
- [07-02]: DefaultChatTransport body function form — prevents stale closure when propertyId changes
- [07-02]: Italian UI text for chips, placeholder, labels — matches platform language consistency
- [08-01]: Inline SVG icons for FAB — no icon library dependency for two simple shapes
- [08-01]: dvh units for overlay height — adapts to iOS keyboard without JS resize listeners
- [08-01]: Client wrapper shim pattern — thin 'use client' component holds next/dynamic call so Server Component layout can use ssr:false

### Pending Todos

None yet.

### Blockers/Concerns

- [Pre-Phase 1 - ACTIVE]: Vercel plan tier unknown — Hobby plan has 10-second timeout making unstreamed responses impossible. Resolve during Task 3 human verification curl test.
- [Pre-Phase 2 - RESOLVED]: Upstash Redis @upstash/ratelimit integration verified and implemented in 02-01.
- [Pre-Phase 4]: Actual Supabase schema (table/column names for `properties`, `bookings`) unknown — retrieve with `\d properties` and `\d bookings` before writing Phase 4 code.
- [Pre-Phase 7 - RESOLVED]: shadcn-chatbot-kit not used — hand-rolled components with useChat + Tailwind are simpler and sufficient for Phase 7.

## Session Continuity

Last session: 2026-03-03
Stopped at: Completed 08-01-PLAN.md — Phase 08 complete
Resume file: None
