# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Guests receive immediate, contextual answers grounded in real property data, reducing manual support load
**Current focus:** Phase 1 — AI API Foundation

## Current Position

Phase: 1 of 9 (AI API Foundation)
Plan: 1 of 1 in current phase (awaiting human verify checkpoint)
Status: Checkpoint — awaiting human verification (Task 3)
Last activity: 2026-03-03 — Phase 1 Plan 1 automated tasks complete, checkpoint reached

Progress: [█░░░░░░░░░] ~11% (1/9 phases in progress)

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (Plan 01-01 pending human verify checkpoint)
- Average duration: —
- Total execution time: ~15 min (automated tasks only)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-ai-api-foundation | 1 (in progress) | ~15 min | — |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Pre-Phase 1 - ACTIVE]: Vercel plan tier unknown — Hobby plan has 10-second timeout making unstreamed responses impossible. Resolve during Task 3 human verification curl test.
- [Pre-Phase 2]: Upstash Redis version-specific patterns for Vercel middleware rate limiting — verify `@upstash/ratelimit` integration at implementation time.
- [Pre-Phase 4]: Actual Supabase schema (table/column names for `properties`, `bookings`) unknown — retrieve with `\d properties` and `\d bookings` before writing Phase 4 code.
- [Pre-Phase 7]: shadcn-chatbot-kit is a community project (MEDIUM confidence) — verify CLI command and available components at `shadcn-chatbot-kit.vercel.app` before Phase 7.

## Session Continuity

Last session: 2026-03-03
Stopped at: 01-01-PLAN.md automated tasks complete (Tasks 1 and 2). Checkpoint Task 3 (human-verify: curl streaming test + DevTools security check) reached.
Resume file: .planning/phases/01-ai-api-foundation/01-01-PLAN.md (Task 3)
