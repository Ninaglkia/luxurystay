# Phase 1: AI API Foundation - Research

**Researched:** 2026-03-03
**Domain:** Vercel AI SDK streaming endpoint — Next.js App Router API route
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | API key AI mai esposta lato client — tutte le chiamate AI passano per server-side API route | Confirmed: `ANTHROPIC_API_KEY` (no NEXT_PUBLIC_ prefix) lives only in server env. All AI calls happen exclusively inside `src/app/api/chat/route.ts`. Client code never imports AI SDK directly. |
| SEC-04 | Edge runtime con streaming per rispettare timeout Vercel e garantire risposte fluide | Confirmed: `export const maxDuration = 30` in the route file. If Fluid Compute is disabled (Hobby plan without it), need `export const runtime = 'edge'` to reach longer timeouts. Use `streamText` + `toUIMessageStreamResponse()` so first token arrives <2s. |
</phase_requirements>

---

## Summary

Phase 1 establishes a working streaming AI endpoint at `POST /api/chat` that accepts a messages array and returns a streamed text response. It is intentionally infrastructure-only: no UI, no Supabase queries, no auth gating — just a minimal but correctly configured Route Handler that proves the pipeline end-to-end.

The critical technical concern in this phase is Vercel's function timeout. Without streaming, an LLM response takes 10-30+ seconds — beyond what Vercel's defaults allow, especially on a Hobby plan without Fluid Compute (10-second default). Streaming solves this by sending the first token within 1-2 seconds, keeping the HTTP connection alive. Two config exports in the route file (`maxDuration` and optionally `runtime`) are required to be explicit; relying on defaults is a silent failure risk.

The secondary concern is API key hygiene. The Anthropic API key must be a server-only environment variable (no `NEXT_PUBLIC_` prefix). `ANTHROPIC_API_KEY` does not currently exist in the project's `.env.local` — it must be added there and in the Vercel project's environment variables before deployment. The existing codebase sets a clear precedent with `STRIPE_SECRET_KEY` (server-only) vs `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client-safe); follow that exact pattern.

**Primary recommendation:** Create `src/app/api/chat/route.ts` using `streamText` from `ai` with the `@ai-sdk/anthropic` provider, export `maxDuration = 30`, and return `result.toUIMessageStreamResponse()`. Test with curl before touching any UI code.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | ^4.x (npm latest ~4.x, note: docs show v6.x API surface) | `streamText` function + streaming response utilities | Official Vercel SDK. Provides `streamText`, `convertToModelMessages`, `UIMessage`, and response helpers. Works natively with Next.js App Router Route Handlers. |
| `@ai-sdk/anthropic` | ^1.x paired with `ai` version | Anthropic provider adapter | Thin adapter that connects `ai` package to Anthropic's API. Uses `ANTHROPIC_API_KEY` env var automatically. |

> **Version note (MEDIUM confidence):** The project's `package.json` does not yet have `ai` or `@ai-sdk/anthropic`. The STACK.md research references `ai ^4.x / ^6.x` and `@ai-sdk/anthropic ^3.x` — these version numbers are ambiguous. The Anthropic provider page confirms `npm install @ai-sdk/anthropic` is the correct package. Verify exact paired versions with `npm info ai version` and `npm info @ai-sdk/anthropic version` at install time. Always install them together.

### No Additional Supporting Libraries for Phase 1

Phase 1 is infrastructure only. `react-markdown`, shadcn-chatbot-kit, and other UI dependencies are out of scope until later phases. No Supabase queries in this phase.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@ai-sdk/anthropic` + `ai` | Raw `@anthropic-ai/sdk` | Raw SDK requires manual SSE plumbing, no `streamText` abstraction, no future provider portability. Never for this project. |
| `ai` package | LangChain.js | LangChain adds 2MB+ bundle weight and architectural complexity for a feature this simple. Not needed until Phase 4+ tool orchestration if ever. |

**Installation:**
```bash
npm install ai @ai-sdk/anthropic
```

**Environment variable to add to `.env.local` and Vercel:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Architecture Patterns

### Recommended File Structure for Phase 1

```
src/
└── app/
    └── api/
        └── chat/
            └── route.ts    # The only file created in Phase 1
```

Phase 1 creates exactly one file. All other structure (`src/lib/chat/`, `src/app/chat/`, `src/app/components/chat/`) is deferred to later phases.

### Pattern 1: Streaming Route Handler with maxDuration

**What:** A Next.js App Router Route Handler that imports `streamText` from `ai`, calls it with the Anthropic provider and the incoming messages, and returns `result.toUIMessageStreamResponse()`. Two exports control Vercel behavior: `maxDuration` sets the function timeout; optionally `runtime = 'edge'` enables edge streaming.

**When to use:** This is the complete and only pattern for this phase.

**Critical detail — Fluid Compute vs. no Fluid Compute:**

Vercel's timeout behavior changed with Fluid Compute (default for new projects since April 2025):

| Situation | Default timeout | Max settable |
|-----------|----------------|--------------|
| Hobby plan, Fluid Compute ON | 300s | 300s |
| Hobby plan, Fluid Compute OFF | 10s | 60s |
| Pro plan, Fluid Compute ON | 300s | 800s |
| Pro plan, Fluid Compute OFF | 15s | 300s |

**Action:** Always set `export const maxDuration = 30` explicitly in the route. This is safe for Hobby+Fluid (well within 300s limit) and enough for most streaming responses. Do not rely on defaults — the default varies per plan and Fluid Compute status.

**Source:** [Vercel Docs — Configuring Function Duration](https://vercel.com/docs/functions/configuring-functions/duration) — HIGH confidence (official docs)

**Example:**
```typescript
// src/app/api/chat/route.ts
// Source: https://ai-sdk.dev/docs/getting-started/nextjs-app-router + Vercel duration docs

import { streamText, UIMessage, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

// Required: explicit timeout declaration for Vercel
// 30 seconds is safe for Hobby+Fluid and Pro plans
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: anthropic('claude-haiku-4-5'),
    system: 'You are a helpful AI concierge for LuxuryStay.',
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 500,
  })

  return result.toUIMessageStreamResponse()
}
```

**Note on `convertToModelMessages`:** The AI SDK distinguishes `UIMessage` (client format, includes metadata) from `ModelMessage` (what the model expects). `convertToModelMessages` handles this transformation. This is required — passing raw `UIMessage[]` directly to `streamText` will cause a type error.

**Note on model ID:** The Anthropic provider docs list `claude-haiku-4-5` as the model ID for Claude Haiku 4.5. Verify the exact string at implementation time against [Anthropic provider docs](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic).

### Pattern 2: Server-Only Environment Variable

**What:** `ANTHROPIC_API_KEY` is declared without `NEXT_PUBLIC_` prefix. The `@ai-sdk/anthropic` provider reads it automatically from `process.env.ANTHROPIC_API_KEY` — no manual extraction needed.

**When to use:** Always. Never prefix AI API keys with `NEXT_PUBLIC_`.

**Example:**
```bash
# .env.local — CORRECT
ANTHROPIC_API_KEY=sk-ant-...

# NEVER DO THIS
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...  # Exposes key to browser bundle
```

The codebase already follows this pattern correctly for `STRIPE_SECRET_KEY`. Apply the same convention.

### Pattern 3: Testing with curl Before Any UI

**What:** The route is fully testable with a curl command before any React components are written.

**When to use:** After creating `route.ts`, immediately verify streaming works end-to-end.

**Example:**
```bash
# Start dev server first: npm run dev
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"id": "1", "role": "user", "parts": [{"type": "text", "text": "Hello"}]}]}' \
  --no-buffer
```

Characters should appear progressively in the terminal — not all at once. If the response appears all at once, streaming is not working.

**Note on message format:** The AI SDK's `UIMessage` type uses a `parts` array, not a simple `content` string. The curl test must use the correct format. Alternatively, test with the simpler `messages` format and let `convertToModelMessages` normalize it.

### Anti-Patterns to Avoid

- **Calling Anthropic SDK from a client component:** Any import of `ai`, `@ai-sdk/anthropic`, or `@anthropic-ai/sdk` in `src/app/components/` or any file under `'use client'` is a security failure. All AI calls go through the Route Handler.
- **Using `NEXT_PUBLIC_ANTHROPIC_API_KEY`:** This ships the key in the browser JS bundle. Check `grep -r "NEXT_PUBLIC_" .env*` before every deployment.
- **Omitting `maxDuration` and relying on defaults:** On Hobby plan without Fluid Compute, the default 10s timeout will kill streaming responses for complex questions. Be explicit.
- **Using `export const runtime = 'edge'`:** The PITFALLS.md flags that Edge Runtime can conflict with Node.js APIs used by some AI SDK versions. The current docs do NOT require `runtime = 'edge'` for streaming — use Node.js runtime (the default) with just `maxDuration`. Only add `runtime = 'edge'` if testing reveals a specific timeout issue on Hobby without Fluid Compute.
- **Returning `toDataStreamResponse()` instead of `toUIMessageStreamResponse()`:** For `useChat` hook compatibility (used in later phases), always use `toUIMessageStreamResponse()`. `toDataStreamResponse()` is for different streaming patterns.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming SSE to client | Manual `ReadableStream`, `TextEncoder`, SSE event formatting | `streamText().toUIMessageStreamResponse()` | The AI SDK handles chunking, SSE protocol, keep-alive, error propagation, and abort signal plumbing. Manual SSE has dozens of edge cases (client disconnect, backpressure, encoding). |
| Anthropic API calls | `fetch('https://api.anthropic.com/v1/messages', ...)` with manual stream parsing | `@ai-sdk/anthropic` + `streamText` | Raw API calls require handling Anthropic's binary stream format, authentication headers, error codes, and retry logic. The provider adapter handles all of this. |
| Message format transformation | Custom transform of `messages` array between client and model formats | `convertToModelMessages(messages)` | The AI SDK's `UIMessage` format (used by `useChat`) differs from the `ModelMessage` format that `streamText` expects. The SDK provides this conversion. |

**Key insight:** The Vercel AI SDK was specifically built to eliminate streaming boilerplate in Next.js. Every custom solution in this domain either misses edge cases or duplicates what the SDK already handles correctly.

---

## Common Pitfalls

### Pitfall 1: API Key in Client Bundle

**What goes wrong:** Developer prefixes `ANTHROPIC_API_KEY` with `NEXT_PUBLIC_` for convenience, or imports AI SDK code into a client component. The key ships in the browser JS bundle. Automated scanners find it within hours. Bill arrives at end of month.

**Why it happens:** Next.js convention uses `NEXT_PUBLIC_` for anything the client needs. Developers who are used to client-side APIs apply this habit incorrectly.

**How to avoid:** `ANTHROPIC_API_KEY` has no `NEXT_PUBLIC_` prefix. All AI code lives in `src/app/api/chat/route.ts` only. Add `grep -r "NEXT_PUBLIC_ANTHROPIC" src/` to your pre-deploy checklist.

**Warning signs:** Network inspector in the browser shows direct requests to `api.anthropic.com`. Any import of `ai` or `@ai-sdk/anthropic` in a file that has `'use client'` at the top.

### Pitfall 2: Streaming Truncation on Vercel

**What goes wrong:** Streaming works locally but responses are cut off or never arrive on the Vercel deployment. This is the most common "works on my machine" failure for AI streaming routes.

**Why it happens:** The local dev server has no timeout. On Vercel, without an explicit `maxDuration` declaration, the function uses the plan's default (10s on Hobby without Fluid Compute). An LLM response that takes 12 seconds to fully stream gets killed at 10 seconds.

**How to avoid:** Always export `export const maxDuration = 30` in `src/app/api/chat/route.ts`. Test streaming on a Vercel preview deployment (not just locally) before marking Phase 1 done.

**Warning signs:** Route returns 504 or the response stops abruptly in production. Full response in dev, truncated response on Vercel preview.

### Pitfall 3: Wrong Message Format in curl Test

**What goes wrong:** Testing with `{"messages": [{"role": "user", "content": "hello"}]}` fails because the AI SDK's `UIMessage` type uses a `parts` array, not `content`. The endpoint returns a 500 or the model sees empty messages.

**Why it happens:** OpenAI's API format uses `{ role, content }`. The Vercel AI SDK's UI message format is different.

**How to avoid:** Use the correct `UIMessage` format in curl tests:
```json
{
  "messages": [{
    "id": "test-1",
    "role": "user",
    "parts": [{"type": "text", "text": "Hello, are you there?"}]
  }]
}
```

**Warning signs:** 400 errors or empty responses when testing via curl.

### Pitfall 4: Vercel Plan Unknown — Fluid Compute Status Unknown

**What goes wrong:** The STATE.md explicitly flags this: "Vercel plan tier unknown — Hobby plan has 10-second timeout making unstreamed responses impossible." If Fluid Compute is disabled on a Hobby plan, the non-streaming default timeout is 10 seconds.

**Why it happens:** The plan tier and Fluid Compute status were not confirmed during the roadmap phase.

**How to avoid:** At the start of Phase 1 implementation, confirm in the Vercel dashboard:
1. What plan is the project on? (Hobby vs. Pro)
2. Is Fluid Compute enabled? (Project Settings > Functions)

With `maxDuration = 30` and streaming, even Hobby+Fluid Compute = 300s max is sufficient. The risk is only if Fluid Compute is OFF on Hobby, which limits maxDuration to 60s maximum — but streaming at 30s is still fine for this use case.

**Warning signs:** 504 errors on Vercel with responses that work locally. Check Vercel function logs for timeout messages.

---

## Code Examples

Verified patterns from official sources:

### Complete Route Handler (Phase 1 target)
```typescript
// src/app/api/chat/route.ts
// Source: https://ai-sdk.dev/docs/getting-started/nextjs-app-router (HIGH confidence)
// Source: https://vercel.com/docs/functions/configuring-functions/duration (HIGH confidence)

import { streamText, UIMessage, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

// Explicit timeout — required for Vercel streaming to work reliably
// 30s is safe for all plans with Fluid Compute (Hobby max 300s, Pro max 800s)
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: anthropic('claude-haiku-4-5'),
    system: 'You are a helpful AI concierge for LuxuryStay vacation rentals.',
    // convertToModelMessages transforms UIMessage[] → ModelMessage[]
    messages: await convertToModelMessages(messages),
    // Limit response length — important for cost control from day one
    maxOutputTokens: 500,
  })

  // toUIMessageStreamResponse() is required for useChat hook compatibility (later phases)
  return result.toUIMessageStreamResponse()
}
```

### curl Test Command
```bash
# Test progressive streaming — characters should appear one by one
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "id": "test-1",
      "role": "user",
      "parts": [{"type": "text", "text": "Say hello and count to 5 slowly."}]
    }]
  }' \
  --no-buffer
```

### Anthropic Provider Configuration
```typescript
// Source: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic (HIGH confidence)

import { anthropic } from '@ai-sdk/anthropic'
// @ai-sdk/anthropic reads ANTHROPIC_API_KEY from process.env automatically
// No manual configuration needed unless using custom baseURL

const model = anthropic('claude-haiku-4-5')
// or for explicit configuration:
import { createAnthropic } from '@ai-sdk/anthropic'
const customAnthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // explicit, but automatic by default
})
```

### Environment Variable Pattern (mirroring existing codebase convention)
```bash
# .env.local additions for Phase 1
# Pattern: matches STRIPE_SECRET_KEY convention already in .env.local

ANTHROPIC_API_KEY=sk-ant-api03-...   # Server-only, no NEXT_PUBLIC_ prefix
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `StreamingTextResponse` class | `result.toUIMessageStreamResponse()` | AI SDK v4/v5 | `StreamingTextResponse` is deprecated; new method supports tool calls and richer message formats |
| `useChat` with `content` string messages | `useChat` with `UIMessage` (parts array) | AI SDK v4+ | Messages now have `parts: [{type, text}]` structure, not flat `content` string |
| `import { useChat } from 'ai/react'` | `import { useChat } from '@ai-sdk/react'` | AI SDK v5 | Package path changed; old import may still work but new path is canonical |
| `runtime = 'edge'` required for streaming | `maxDuration = 30` only, Node.js runtime | 2024-2025 | Edge runtime caused compatibility issues with Node.js APIs; Node.js + Fluid Compute is now preferred |

**Deprecated/outdated:**
- `StreamingTextResponse`: replaced by `result.toUIMessageStreamResponse()` or `result.toDataStreamResponse()`
- `import { useChat } from 'ai/react'`: use `import { useChat } from '@ai-sdk/react'` (relevant for later phases)

---

## Open Questions

1. **Vercel plan and Fluid Compute status**
   - What we know: Hobby plan without Fluid Compute has 10s default timeout, max 60s. With Fluid Compute (default for new projects since April 2025): 300s max on Hobby. Project plan is unknown.
   - What's unclear: Is this project on Hobby or Pro? Is Fluid Compute enabled?
   - Recommendation: Check Vercel dashboard at the start of Phase 1 implementation. Set `maxDuration = 30` regardless — it works on any plan+Fluid combination. If Hobby+no Fluid Compute, consider 30s is still achievable with streaming.

2. **Exact paired versions of `ai` and `@ai-sdk/anthropic`**
   - What we know: STACK.md references `ai ^6.x` and `@ai-sdk/anthropic ^3.x` but these version numbers are not confirmed against current npm registry.
   - What's unclear: Current published versions at implementation time.
   - Recommendation: Run `npm info ai version && npm info @ai-sdk/anthropic version` at implementation time. Install together: `npm install ai @ai-sdk/anthropic`.

3. **Exact `claude-haiku-4-5` model ID string**
   - What we know: Anthropic provider docs list `claude-haiku-4-5` in the capabilities table.
   - What's unclear: Whether the API accepts `claude-haiku-4-5` or requires a date-stamped variant like `claude-haiku-4-5-20251001`.
   - Recommendation: Verify at [Anthropic provider docs](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) at implementation time. Anthropic typically supports `claude-{model}-latest` aliases — use the versioned ID for production stability.

---

## Sources

### Primary (HIGH confidence)
- [ai-sdk.dev/docs/getting-started/nextjs-app-router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) — Official Vercel AI SDK getting started guide. Route handler pattern, `streamText`, `convertToModelMessages`, `toUIMessageStreamResponse` verified here.
- [vercel.com/docs/functions/configuring-functions/duration](https://vercel.com/docs/functions/configuring-functions/duration) — Official Vercel docs for `maxDuration` export. Duration limits per plan and Fluid Compute status verified here.
- [ai-sdk.dev/docs/ai-sdk-ui/chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) — Official useChat docs confirming `toUIMessageStreamResponse()` is the correct method for useChat integration.
- [ai-sdk.dev/providers/ai-sdk-providers/anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) — Official Anthropic provider docs. Package name, import path, model IDs, `ANTHROPIC_API_KEY` auto-detection confirmed.
- [ai-sdk.dev/docs/reference/ai-sdk-core/stream-text](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) — Official `streamText` reference. All parameters verified.

### Secondary (MEDIUM confidence)
- [vercel.com/changelog/fluid-compute-is-now-the-default-for-new-projects](https://vercel.com/changelog/fluid-compute-is-now-the-default-for-new-projects) — Fluid Compute became default for new projects April 2025.
- [ai-sdk.dev/docs/ai-sdk-ui/stream-protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) — Stream protocol documentation. Confirms `useChat` uses data stream protocol by default.

### Tertiary (LOW confidence)
- STATE.md project decisions (project-internal) — `claude-haiku-4-5` model choice, session-only history, no RAG.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `ai` + `@ai-sdk/anthropic` confirmed via official docs; exact versions to verify at install time
- Architecture: HIGH — Route Handler pattern confirmed via official Next.js + AI SDK docs; `maxDuration` export verified against official Vercel docs
- Pitfalls: HIGH — Key exposure and timeout pitfalls verified against official Vercel and AI SDK documentation

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days — Vercel AI SDK releases frequently; verify version pairing at install time)
