# Project Research Summary

**Project:** LuxuryStay AI Concierge Chatbot
**Domain:** AI chatbot milestone addition to existing Next.js 16 + Supabase vacation rental platform
**Researched:** 2026-03-03
**Confidence:** MEDIUM-HIGH

## Executive Summary

LuxuryStay is adding an AI concierge chatbot to an existing Next.js 16 (App Router) + Supabase + Stripe platform. This is not a greenfield project — the foundation is already deployed on Vercel and all net-new work is additive. The recommended approach is a thin AI layer built around Vercel AI SDK v6 (`ai` package) with Claude Haiku 4.5 via `@ai-sdk/anthropic`, a server-side Route Handler at `/api/chat`, and a lazily-loaded floating bubble widget built from shadcn-chatbot-kit copy-paste components. Property data from Supabase is injected directly into the system prompt on each request — no RAG, no vector store, no fine-tuning. This is the correct architecture for a bounded property catalog and eliminates weeks of over-engineering.

The MVP scope is well-defined and achievable in three focused phases: secure API foundation, auth-aware data integration, and polished UI. The chatbot must serve two user tiers — anonymous visitors (general property info only) and authenticated guests (personalized booking context) — and this access control boundary is the most important correctness invariant in the entire system. The feature set should launch with the 12 table-stakes items (floating bubble, dedicated `/chat` page, property FAQ grounding, streaming responses, booking status lookup, graceful fallback, luxury persona, suggested question chips, mobile-responsive UI) and defer everything else.

The dominant risks are security and cost: API key exposure, prompt injection, and unbounded token costs from anonymous users are all Day 1 concerns, not polish. All three must be addressed in the first phase before any user-facing code is written. Hallucination prevention via strict data grounding and the "only answer from provided data" system prompt constraint must be verified with automated tests before the chatbot goes live. These are not hypothetical risks — hospitality AI hallucination rates without grounded data run 32–58% on factual property questions.

---

## Key Findings

### Recommended Stack

The net-new dependency surface is intentionally small: `ai` (Vercel AI SDK ^6.x) and `@ai-sdk/anthropic` (~3.0.x) for the AI layer, `react-markdown` + `remark-gfm` for response rendering, and shadcn-chatbot-kit (copy-paste, not npm) for the chat UI. The Vercel AI SDK is the correct choice for this stack — it provides the `useChat` hook and `streamText` server function with zero boilerplate, works natively with Next.js App Router, and makes provider switching a one-line change. Claude Haiku 4.5 is recommended over GPT-4o-mini for quality and Anthropic prompt caching — the static portion of the system prompt (property rules, concierge persona) is cached at 0.1x base cost, making repeated-context economics competitive.

**Core technologies:**
- `ai` (Vercel AI SDK ^6.x): Streaming abstraction, `useChat` hook, `streamText` — eliminates all manual SSE plumbing
- `@ai-sdk/anthropic` (~3.0.x): Thin provider adapter for Claude; swap to OpenAI with one line if needed
- Claude Haiku 4.5: Optimal cost/quality for concierge use; prompt caching reduces system prompt token costs by ~90% on repeated requests
- `react-markdown` + `remark-gfm` ^9.x/^4.x: Safe markdown rendering for AI responses in chat bubbles
- shadcn-chatbot-kit (copy-paste): Chat UI components consistent with existing Tailwind CSS 4 + shadcn design system; no extra npm dependency

**Critical version note:** The `ai` package (v6.x) and `@ai-sdk/anthropic` (v3.x) use different version numbers but must be installed from the same release. Always verify paired versions at `github.com/vercel/ai/releases`.

**What NOT to use:** LangChain.js (2MB+ overhead, not needed), WebSockets/Socket.io (Vercel serverless incompatible), Edge Runtime for the chat route (crypto/Node.js API conflicts with `@supabase/ssr`), client-side AI calls (API key exposure), RAG/pgvector (over-engineered for bounded property catalog), or persistent chat history in Supabase for v1 (out of scope per project requirements).

### Expected Features

Research confirms the MVP feature set is well-scoped. The 12 P1 items are universally expected by users of any hospitality chatbot; skipping any of them creates a broken-feeling product. The anti-feature list is equally important — live human agent handoff, voice input, multilingual auto-detection, real-time booking modification via chat, and proactive push notifications all look desirable but introduce operational complexity, compliance risk, or misalignment with the luxury brand that outweighs their value for v1.

**Must have (table stakes) — P1 for launch:**
- Floating bubble widget on all pages — entry point for all users
- Dedicated `/chat` page for full-screen conversation
- Property-specific FAQ answers grounded in Supabase data (check-in, rules, amenities, WiFi)
- Auth-aware access: anonymous users get general info; logged-in users get booking context
- Booking status lookup for authenticated users (dates, check-in time, status)
- Graceful fallback with explicit escalation path when the bot cannot answer
- Tone-matched luxury persona via system prompt engineering
- Streaming responses with typing indicator (one configuration flag in Vercel AI SDK)
- Suggested question chips to reduce first-use friction
- Session-only conversation history (no database persistence required)
- Mobile-responsive widget and chat UI
- Clear bot identity disclosure

**Should have (competitive differentiators) — P2 post-launch:**
- Contextual local concierge recommendations (location-aware prompting with Mapbox context)
- Upsell suggestions woven into natural conversation
- Transport and logistics recommendations
- Property availability and pricing queries via Supabase (significant integration work)

**Defer to v2+:**
- Multilingual support (validate Italian thoroughly first)
- Proactive pre-arrival messaging (requires scheduling infrastructure)
- Booking initiation from chat (deep Stripe integration)
- Persistent chat history with GDPR-compliant storage

### Architecture Approach

The architecture is a clean three-layer system: a lazily-loaded React client (`useChat` hook + shadcn components), a single Next.js API Route Handler at `/app/api/chat/route.ts` that handles auth detection, Supabase context assembly, and `streamText()` calls, and the Supabase + Anthropic service layer. No new infrastructure is needed — this integrates fully into the existing Vercel deployment. The build order is dictated by dependency graph: API route first (testable with curl), then system prompt builder + tools (unit-testable in isolation), then ChatPanel (testable at `/chat`), then the dedicated `/chat` page, and finally the floating bubble widget.

**Major components:**
1. `/api/chat` Route Handler — auth gating, system prompt assembly, `streamText()` call, SSE streaming response; ALL AI calls happen here, never on the client
2. `build-system-prompt.ts` — assembles LLM prompt from user tier and Supabase property data; this is the hallucination prevention boundary
3. `ChatPanel` — conversation UI consuming `useChat` hook; shared by both the bubble and the `/chat` page
4. `ChatBubble` — floating toggle widget, lazy-loaded with `next/dynamic { ssr: false }` from root layout; critical for page load performance
5. `/chat` page — thin wrapper around ChatPanel for full-screen conversation
6. `tools.ts` — Zod-validated AI SDK tool definitions for authenticated DB lookups (booking queries)

**Key architectural decisions:**
- System prompt assembly is server-side only — client sends only the messages array
- Auth is resolved server-side via `supabase.auth.getUser()` — never trust client-sent auth claims
- Conversation history is session-only, managed by `useChat` in-memory — no Supabase persistence for v1
- Property context is injected via direct Supabase query, not RAG — correct for a bounded dataset
- ChatBubble uses `next/dynamic { ssr: false }` — non-negotiable for page load performance

### Critical Pitfalls

1. **API key exposed in client code** — Use `ANTHROPIC_API_KEY` (no `NEXT_PUBLIC_` prefix); all AI calls through `/api/chat` Route Handler only. Check before every deployment: `grep -r "NEXT_PUBLIC_" .env*` and `grep -r "sk-ant" src/`. Add pre-commit hook. Recovery cost: HIGH.

2. **No rate limiting on anonymous access** — Implement IP-based rate limiting from day one (5 messages/session for anon, 50/day for auth). Use Vercel middleware with Upstash Redis. Set `max_tokens` on every AI call. Configure billing alerts at $50/$100/$200 thresholds on Anthropic dashboard. Unbounded anonymous access can generate $3,000–$7,000+/month API bills.

3. **AI hallucinating property data** — Inject only verified Supabase data; include explicit system prompt instruction "If the answer is not in the provided property data, say so and direct the user to contact the host." Test with properties that have null fields. Hallucination rates without grounding run 32–58% on factual property questions.

4. **Sensitive booking data accessible to anonymous users** — Scope ALL Supabase queries via user JWT (RLS enforced); never use service-role key for chat context assembly. Anonymous context must contain zero booking records, PII, or payment data. Write integration tests for adversarial anonymous prompts.

5. **Prompt injection via user input** — Structure system prompt to explicitly state the role cannot be changed. Never include table names, schema, or internal URLs in system prompt. Add input sanitization layer for injection keywords. Log inputs and monitor for injection patterns in production.

---

## Implications for Roadmap

Based on the combined research, a three-phase structure is strongly recommended. The dependency graph from ARCHITECTURE.md (API route before UI), the pitfall-to-phase mapping from PITFALLS.md (security must be Phase 1), and the feature dependency tree from FEATURES.md (auth detection required before any personalization) all converge on the same ordering.

### Phase 1: Secure API Foundation

**Rationale:** Every client component depends on the `/api/chat` endpoint. Security mistakes made here are the hardest to remediate post-launch. Rate limiting and API key isolation must exist before any user can reach the chatbot. This phase has zero UI and is entirely testable with curl and unit tests.

**Delivers:** A working, secure, streaming AI endpoint with auth detection, rate limiting, cost controls, and a minimal system prompt with static property context.

**Features implemented:**
- Natural language understanding (via LLM)
- Streaming responses with typing indicator
- Auth-aware access tier detection (anonymous vs. authenticated baseline)
- Graceful fallback / escalation path (initial system prompt engineering)

**Architecture built:** `/api/chat/route.ts`, `build-system-prompt.ts` skeleton, Anthropic provider setup, `maxDuration` + `runtime` exports configured for Vercel

**Pitfalls avoided:**
- API key exposure (server-only env var, no client imports)
- Unbounded anonymous costs (rate limiting + `max_tokens` configured from day one)
- Streaming truncation on Vercel (correct `maxDuration` and runtime configuration)
- Prompt injection foundation (initial input sanitization + system prompt defensive instructions)

### Phase 2: Auth-Aware Data Integration

**Rationale:** Property FAQ grounding and booking status lookup are the two highest-value features for users (P1 priority) and both depend on Supabase integration with correct auth scoping. This phase turns the generic chatbot into a property-specific concierge. The hallucination prevention layer is also completed here.

**Delivers:** A fully-functional concierge that answers property-specific questions accurately, serves personalized booking context to authenticated users, and refuses to answer questions for which it lacks data.

**Features implemented:**
- Property-specific FAQ answers grounded in Supabase data
- Booking status lookup for authenticated users
- Full auth-aware response differentiation (anon: general info only; auth: personalized booking context)
- Tone-matched luxury persona (system prompt fully engineered with real property data)
- AI tool definitions for authenticated DB lookups

**Architecture built:** `fetch-property-context.ts`, `tools.ts`, full `build-system-prompt.ts`, auth-gated Supabase queries using user JWT (RLS-enforced)

**Pitfalls avoided:**
- Hallucinated property data (strict data grounding + "only answer from provided data" constraint + tests against null-field properties)
- Sensitive data to anonymous users (RLS-scoped queries, integration tests for adversarial anonymous prompts)
- Service-role key misuse (user JWT used for all chat context queries)

### Phase 3: UI — Chat Widget and Dedicated Page

**Rationale:** UI is built last because it has no backend dependencies that don't already exist after Phase 2. Building UI before the API is stable wastes rework cycles. The floating bubble is the most UI-complex component (open/close state, positioning, animation) and is deferred to end of this phase.

**Delivers:** A polished, mobile-responsive chat experience accessible from every page (bubble) and via a dedicated full-screen conversation page, consistent with the platform's luxury design system.

**Features implemented:**
- Floating bubble widget (lazy-loaded with `next/dynamic { ssr: false }`)
- Dedicated `/chat` page
- Suggested question chips to reduce first-use friction
- Mobile-responsive widget and chat UI
- Clear bot identity disclosure
- Conversation reset mechanism

**Architecture built:** `chat-bubble.tsx` (lazy-loaded in root layout), `chat-panel.tsx`, `message-list.tsx`, `message-item.tsx`, `typing-indicator.tsx`, `/app/chat/page.tsx`, root layout integration

**Stack used:** shadcn-chatbot-kit (copy-paste), `react-markdown` + `remark-gfm`, Tailwind CSS 4

**Pitfalls avoided:**
- ChatBubble blocking page load (lazy-load with `ssr: false`)
- Chat bubble obscuring critical mobile UI (suppress on `/checkout` and `/payment` routes)
- No streaming UX (typing indicator + streaming from Phase 1 wired into UI)
- No message length limit (500-char frontend limit + server-side validation)

### Phase Ordering Rationale

- **Security-first ordering** is mandated by PITFALLS.md: API key exposure and unbounded cost risks cannot be retrofitted after UI is built and users are present. Phase 1 exists specifically to establish the security perimeter before anything else.
- **Backend-before-UI** ordering follows ARCHITECTURE.md's build order recommendations: the API route and system prompt builder are independently testable and have no UI dependency. Building them first means Phase 3 UI work is never blocked on backend state.
- **Data integration before UI** (Phase 2 before Phase 3) means the UI is built against a fully-functional backend with real data, not stubs. This prevents a full rework of the UI when real data shapes emerge.
- **Feature groupings** follow the dependency tree from FEATURES.md: everything in Phase 2 depends on auth session detection (Phase 1), and everything in Phase 3 depends on the API being stable (Phases 1 + 2).

### Research Flags

**Phases needing deeper research during planning:**

- **Phase 2 (Supabase tool definitions):** The exact Zod schema for AI SDK tool definitions interacting with the existing Supabase schema (bookings, properties tables) needs to be verified against the actual database structure. Research the live schema before writing `tools.ts`.
- **Phase 1 (Rate limiting implementation):** Upstash Redis integration for Vercel middleware rate limiting is well-documented but has version-specific patterns. Verify the current `@upstash/ratelimit` + Vercel middleware integration against current package versions.
- **Phase 3 (shadcn-chatbot-kit component set):** shadcn-chatbot-kit is a community project (MEDIUM confidence). Verify the exact CLI command and available components against `shadcn-chatbot-kit.vercel.app` at implementation time — the copy-paste component set may have changed.

**Phases with standard patterns (can skip research-phase):**

- **Phase 1 (Vercel AI SDK setup):** Fully documented in official Vercel AI SDK docs with Next.js App Router guide. `streamText` + `useChat` pattern is stable and well-established.
- **Phase 3 (Next.js lazy loading):** `next/dynamic { ssr: false }` is a standard Next.js pattern with official docs. No research needed.
- **Phase 1 (Anthropic provider setup):** Installing `ai` + `@ai-sdk/anthropic` and configuring `ANTHROPIC_API_KEY` is straightforward from official docs.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack (Vercel AI SDK, Anthropic provider, shadcn) verified against official docs. Version compatibility confirmed. The only MEDIUM-confidence item is the UI library choice — shadcn-chatbot-kit is a community project, not an official package. |
| Features | MEDIUM | Feature landscape verified across 10+ industry sources (Hotel Tech Report, Voiceflow, Canary, Enso Connect, etc.), but no single authoritative hospitality AI chatbot specification exists. MVP scope is well-supported by competitive analysis. Anti-feature reasoning is strong. |
| Architecture | MEDIUM-HIGH | Core patterns (streamText + useChat, server-side auth, lazy bubble) are HIGH confidence from official Vercel AI SDK and Next.js docs. AI SDK migration details (v5/v6) are MEDIUM due to rapid versioning cadence. |
| Pitfalls | MEDIUM-HIGH | Security pitfalls (OWASP LLM Top 10, API key exposure) are HIGH confidence from authoritative sources. Cost abuse numbers are MEDIUM confidence (single third-party estimate for exact dollar figures, HIGH confidence that unbounded access creates runaway costs). |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Existing Supabase schema:** The exact table and column names for `properties`, `bookings`, and related tables are unknown at research time. `build-system-prompt.ts` and `tools.ts` must be written against the actual schema. Retrieve with `\d properties` and `\d bookings` in Supabase SQL editor before writing Phase 2 code.
- **Vercel plan tier:** The README/PROJECT.md notes the deployment is on Vercel, but does not specify Hobby vs. Pro. This matters because the Hobby plan has a 10-second function timeout that makes unstreamed AI responses impossible. Confirm the plan before Phase 1 implementation; streaming must be configured and tested on the actual deployment target.
- **Anthropic prompt caching activation:** Prompt caching for Claude requires specific `cache_control` blocks in the API request. The Vercel AI SDK support for this via `@ai-sdk/anthropic` should be verified at implementation time — caching may require manual construction of the request rather than relying on the SDK abstraction.
- **Rate limiting quota values:** The suggested quotas (5 messages/session for anonymous, 50/day for authenticated) are research-based estimates. Actual values should be tuned based on observed usage patterns after launch and reviewed against the actual Anthropic billing structure.

---

## Sources

### Primary (HIGH confidence)
- [Vercel AI SDK docs — Introduction](https://ai-sdk.dev/docs/introduction) — stack selection, streaming patterns
- [Vercel AI SDK — Next.js App Router guide](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) — Route Handler pattern, useChat hook
- [AI SDK 6 release announcement](https://vercel.com/blog/ai-sdk-6) — version confirmation
- [Anthropic pricing docs](https://platform.claude.com/docs/en/about-claude/pricing) — Claude Haiku 4.5 cost and caching economics
- [Vercel Functions duration limits](https://vercel.com/docs/functions/limitations) — timeout constraints
- [OWASP LLM Top 10 2025 — LLM01: Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) — security requirements
- [Vercel AI SDK — Rate Limiting](https://ai-sdk.dev/docs/advanced/rate-limiting) — rate limiting pattern
- [Vercel AI SDK — Timeout Troubleshooting](https://ai-sdk.dev/docs/troubleshooting/timeout-on-vercel) — deployment configuration
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/pages/guides/lazy-loading) — ChatBubble dynamic import pattern
- [Vercel AI SDK: streamText reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) — streaming API

### Secondary (MEDIUM confidence)
- [shadcn-chatbot-kit](https://shadcn-chatbot-kit.vercel.app/) — UI component selection
- [supabase-community/vercel-ai-chatbot](https://github.com/supabase-community/vercel-ai-chatbot) — integration reference pattern
- [Wiz Blog — 1.5M API Keys Exposed](https://www.wiz.io/blog/exposed-moltbook-database-reveals-millions-of-api-keys) — API key exposure risk
- [10 Best Hotel Chatbots in 2026 — Hotel Tech Report](https://hoteltechreport.com/marketing/hotel-chatbots) — feature landscape
- [AI in Hospitality: The 2025 Reality and the 2026 Horizon — HFTP](https://www.hftp.org/news/4130826/ai-in-hospitality-the-2025-reality-and-the-2026-horizon) — feature expectations
- [AI Travel Hallucinations — SingleGrain](https://www.singlegrain.com/artificial-intelligence/how-hotels-can-prevent-ai-hallucinations-about-amenities-or-pricing/) — hallucination risk quantification
- [How to Add Context to useChat Without Exposing it](https://github.com/vercel/ai/discussions/1869) — context injection pattern
- [Securing AI Apps with Rate Limiting — Vercel](https://vercel.com/kb/guide/securing-ai-app-rate-limiting) — rate limiting implementation

### Tertiary (LOW confidence — needs validation)
- [LLM Security Risks 2026 — Sombrainc](https://sombrainc.com/blog/llm-security-risks-2026) — general LLM security context, single source
- [AI Chatbot Mistakes — Sparkout Tech](https://www.sparkouttech.com/ai-chatbot-mistakes/) — general (not hospitality-specific), informational only

---
*Research completed: 2026-03-03*
*Ready for roadmap: yes*
