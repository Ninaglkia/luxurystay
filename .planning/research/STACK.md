# Stack Research

**Domain:** AI Chatbot — Luxury Vacation Rental Concierge (added to existing Next.js 16 + Supabase platform)
**Researched:** 2026-03-03
**Confidence:** MEDIUM-HIGH (core stack HIGH, UI library choice MEDIUM)

---

## Context

This is a *milestone addition*, not a greenfield project. The existing platform is:
- Next.js 16.1.6 (App Router) + React 19.2.3 + TypeScript
- Supabase (auth + PostgreSQL) + Stripe + Tailwind CSS 4
- Deployed on Vercel (Pro or Hobby tier matters — see constraints)

Do not re-research what already exists. This document covers only the **net-new** dependencies for the AI chatbot layer.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `ai` (Vercel AI SDK) | ^4.x (latest: ~6.0.x) | Streaming abstraction, provider-agnostic chat primitives | Industry standard for Next.js AI. Provides `useChat` hook + `streamText` server function. Works seamlessly with App Router Route Handlers. One unified API across OpenAI, Anthropic, and others — avoids vendor lock-in at the SDK level. **Confidence: HIGH** |
| `@ai-sdk/anthropic` | ^3.0.x (latest: ~3.0.50) | Anthropic Claude provider for Vercel AI SDK | Thin provider adapter; lets you swap to OpenAI with one line change later |
| Claude Haiku 4.5 | API model (not a package) | AI model for chatbot responses | Optimal cost/performance for concierge use case. $1/$5 per million tokens (input/output). Fast enough for streaming. Long 1M token context. Prompt caching reduces costs 90% for repeated system prompts. **Confidence: MEDIUM** |

**Why Anthropic over OpenAI:** For a luxury concierge chatbot, Claude Haiku 4.5 at $1/$5 per MTok beats GPT-4o-mini at $0.15/$0.60 per MTok on quality (not cost). The critical advantage for this project is Anthropic's **prompt caching**: the system prompt injecting property data from Supabase is large and repeated on every turn. With caching, cache reads cost 0.1× base — making the effective cost competitive while delivering better conversational quality. Claude models also rank higher for instruction-following on open-ended concierge tasks.

**Why NOT OpenAI as primary:** GPT-4o-mini is cheaper per token but has no caching advantage for large repeated contexts. GPT-4o is higher quality but 2.5× the cost with no caching benefit for this pattern.

**Why NOT a self-hosted model (Ollama, local LLM):** The existing platform deploys to Vercel — no persistent GPU compute available. Latency and cost of third-party GPU hosts (Replicate, Modal) exceed API costs at the usage volumes this platform will see.

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@ai-sdk/anthropic` | ^3.0.x | Anthropic provider adapter for Vercel AI SDK | Always — needed to connect `ai` package to Anthropic API |
| `shadcn-chatbot-kit` (copy-paste, not npm) | latest CLI | Pre-built chat bubble, message list, input components — Tailwind + Radix based | Use for the chat UI. Already consistent with project's existing shadcn/ui patterns and Tailwind CSS 4. Provides: floating bubble widget, message bubbles (user/assistant), auto-scroll, markdown rendering. **Confidence: MEDIUM** |
| `react-markdown` | ^9.x | Render AI markdown responses safely in chat bubbles | When assistant responses include formatted lists, bold text, links |
| `remark-gfm` | ^4.x | GitHub-flavored Markdown plugin for react-markdown | Use with react-markdown for tables, strikethrough in AI responses |

**Note on chat UI library choice:** Three options were evaluated:

1. **shadcn-chatbot-kit / shadcn/ui AI components** — Copy-paste components via CLI (no npm package). Best fit because the project already uses Tailwind CSS 4 and shadcn/ui patterns. Full control, no dependency to maintain. Consistent design system.
2. **`@assistant-ui/react`** (v0.12.x) — Full-featured headless library. Better if you want maximal out-of-box functionality (tool call rendering, branching conversations). Overhead is a real npm dependency you must maintain.
3. **Build from scratch** — Unnecessary given the quality of shadcn-chatbot-kit.

**Recommendation:** Use **shadcn-chatbot-kit** (copy-paste) for the chat UI. It aligns with the existing codebase's design system, avoids an npm dependency, and provides all needed components: floating bubble, message list, message input, auto-scroll.

---

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| shadcn CLI | Scaffold chat components via copy-paste | `npx shadcn@latest add` — no version lock |
| Anthropic Playground | Test system prompts and context injection before coding | Use to tune the concierge system prompt with real property data |

---

## Installation

```bash
# Core AI layer
npm install ai @ai-sdk/anthropic

# Markdown rendering for AI responses
npm install react-markdown remark-gfm
```

```bash
# Chat UI — shadcn-chatbot-kit (copy-paste, not npm)
# After confirming the components you need from shadcn-chatbot-kit.vercel.app,
# use the shadcn CLI or manually copy the component files into src/components/chat/
```

**Environment variable to add:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vercel AI SDK (`ai`) | Raw `@anthropic-ai/sdk` direct calls | Never for this project — Vercel AI SDK adds `useChat` hook and streaming without boilerplate; raw SDK only makes sense for non-React backends |
| Vercel AI SDK (`ai`) | LangChain.js | Only if you need complex multi-step agent chains, RAG pipelines with vector stores, or tool orchestration beyond simple function calling. LangChain adds 2MB+ bundle overhead and complexity not needed for this concierge chatbot |
| Anthropic (Claude Haiku 4.5) | OpenAI (GPT-4o-mini) | If cost is the absolute primary concern (GPT-4o-mini is $0.15/$0.60 vs Haiku $1/$5 per MTok). Switch if property data context is small and caching advantage disappears |
| Anthropic (Claude Haiku 4.5) | Google Gemini Flash 2.0 | If latency is critical and quality acceptable — Gemini Flash is fast but Google's API ecosystem is less mature for this stack |
| shadcn-chatbot-kit (copy-paste) | `@assistant-ui/react` | If you need advanced features: tool call rendering, conversation branching, reasoning traces |
| shadcn-chatbot-kit (copy-paste) | Building from scratch | Never — reinventing message bubbles and auto-scroll is pure waste |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| LangChain.js | Massive overhead (~2MB+), complex abstractions for simple context injection. The Vercel AI SDK `system` parameter handles Supabase data injection natively. | Vercel AI SDK `streamText` with `system` param |
| WebSockets / Socket.io for streaming | Vercel serverless functions don't support persistent WebSocket connections. SSE (Server-Sent Events) via Route Handlers is the correct pattern and what Vercel AI SDK uses natively. | Vercel AI SDK streaming (SSE via Route Handlers) |
| `react-chatbot-kit` (npm) | Last meaningful update in 2022. Not designed for LLM streaming. Requires wrestling with its internal state model. | shadcn-chatbot-kit or `@assistant-ui/react` |
| Edge Runtime for the chat Route Handler | Edge Runtime doesn't support the Node.js `crypto` module needed by `@ai-sdk/anthropic` in some versions. The Supabase SSR client also requires Node.js APIs. | Node.js Runtime (default) for the chat API route |
| Storing chat history in Supabase (for v1) | PROJECT.md explicitly defines this as out of scope for v1: "Persistenza cronologia chat su database — non richiesta, solo sessione." Adds schema, RLS policies, and storage costs with no v1 requirement. | In-memory state via `useChat` hook (session-only) |
| Client-side AI API calls (exposing API key) | Anthropic API key must never be in the browser. System prompts with property data would also be exposed. | Next.js Route Handler on the server (`/api/chat`) |
| RAG / pgvector embeddings for v1 | Over-engineered for the concierge use case. Direct Supabase query + context injection into system prompt covers 95% of the chatbot's knowledge needs at a fraction of the complexity. | Direct `supabase` query in Route Handler, inject as system prompt context |

---

## Stack Patterns by Variant

**For anonymous users (non-logged-in guests):**
- Route Handler detects no session via `@supabase/ssr`
- System prompt omits sensitive data (booking details, payment info)
- Returns generic property info + pre-scripted welcome responses
- Same `useChat` hook, server-side filtering of context

**For authenticated users (logged-in guests):**
- Route Handler fetches user's bookings + relevant property data from Supabase
- Injects full context into system prompt: property details, check-in info, their booking dates, local recommendations
- Enable Anthropic prompt caching on the static portion of the system prompt (property rules, concierge persona) to reduce token costs

**For the floating bubble widget:**
- Lazy-load the entire chat component tree with `next/dynamic` + `{ ssr: false }`
- This is critical: PROJECT.md constraint states "Il chatbot non deve rallentare il caricamento delle pagine"
- The bubble renders client-side only after page hydration

**For the full `/chat` page:**
- Same `useChat` hook, same Route Handler
- Wider layout, full message history visible
- Can share the same component primitives as the bubble

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `ai` ^6.x | React 19.x | Verified — AI SDK 6 targets React 18+ |
| `ai` ^6.x | Next.js 16.x (App Router) | Verified — Vercel AI SDK is developed alongside Next.js |
| `@ai-sdk/anthropic` ^3.x | `ai` ^6.x | Paired release cadence — use matching major versions |
| `react-markdown` ^9.x | React 19.x | Compatible |
| shadcn-chatbot-kit | Tailwind CSS 4.x | Uses standard Tailwind classes — compatible |
| `@supabase/ssr` 0.8.x | `ai` ^6.x | No conflicts — different domains (auth vs AI) |

**Critical version note:** The `ai` package uses an unusual versioning scheme where the public npm version (6.x) and provider adapter versions (3.x for `@ai-sdk/anthropic`) differ. Always install them together from the same release. Check `github.com/vercel/ai/releases` for the current paired versions.

---

## Architecture Notes (for implementation)

**Route Handler pattern:**

```
POST /api/chat
  ├── Validate session (Supabase SSR)
  ├── Fetch property/booking context from Supabase (server-side)
  ├── Build system prompt with injected context
  ├── Call anthropic(...).stream() via Vercel AI SDK streamText()
  └── Return StreamingTextResponse
```

**Client hook pattern:**

```typescript
const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  body: { propertyId: currentPropertyId }, // extra context if on a property page
})
```

**Vercel timeout constraint:** Vercel Pro plan allows 60-second function timeout (300s with Fluid Compute). For a chatbot, streaming responses handle this — the first token arrives in <2s, keeping the connection alive. Do NOT set `maxDuration` below 30 seconds. On Hobby plan the 10-second limit is a real risk for complex responses.

---

## Sources

- [Vercel AI SDK docs — Introduction](https://ai-sdk.dev/docs/introduction) — HIGH confidence (official docs)
- [Vercel AI SDK — Next.js App Router guide](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) — HIGH confidence (official docs)
- [AI SDK 6 release announcement](https://vercel.com/blog/ai-sdk-6) — HIGH confidence (official Vercel blog)
- [@ai-sdk/anthropic on npm](https://www.npmjs.com/package/@ai-sdk/anthropic?activeTab=versions) — HIGH confidence (registry data, latest: 3.0.50)
- [Anthropic pricing docs](https://platform.claude.com/docs/en/about-claude/pricing) — HIGH confidence (official docs)
- [OpenAI GPT-4o-mini pricing](https://openai.com/api/pricing/) — HIGH confidence (official docs)
- [Vercel Functions duration limits](https://vercel.com/docs/functions/configuring-functions/duration) — HIGH confidence (official docs)
- [shadcn/ui AI components](https://www.shadcn.io/ai) — MEDIUM confidence (official shadcn docs)
- [shadcn-chatbot-kit](https://shadcn-chatbot-kit.vercel.app/) — MEDIUM confidence (community project, actively maintained)
- [supabase-community/vercel-ai-chatbot](https://github.com/supabase-community/vercel-ai-chatbot) — MEDIUM confidence (official community repo demonstrating the integration pattern)
- [Vercel AI SDK useChat body param discussion](https://github.com/vercel/ai/discussions/2662) — MEDIUM confidence (GitHub discussion, context injection pattern)
- [Anthropic API pricing comparison 2026](https://llmgateway.io/blog/openai-vs-anthropic-vs-google-cost-comparison) — MEDIUM confidence (third-party analysis, verified against official pricing)
- [assistant-ui npm package](https://www.npmjs.com/package/@assistant-ui/react) — MEDIUM confidence (registry data)

---

*Stack research for: LuxuryStay AI Concierge Chatbot (milestone addition)*
*Researched: 2026-03-03*
