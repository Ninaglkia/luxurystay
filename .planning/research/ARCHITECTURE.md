# Architecture Research

**Domain:** AI Chatbot integration into existing Next.js + Supabase application
**Researched:** 2026-03-03
**Confidence:** MEDIUM-HIGH (core patterns HIGH from official sources; AI SDK v5 migration details MEDIUM due to rapid versioning)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  ChatBubble      │  │  /chat page      │                     │
│  │  (floating       │  │  (full-screen    │                     │
│  │   widget)        │  │   conversation)  │                     │
│  │  useChat hook    │  │  useChat hook    │                     │
│  └────────┬─────────┘  └────────┬─────────┘                     │
│           │                     │                               │
│    ← dynamic import →    ← direct import →                      │
│    (lazy, ssr:false)     (page-level, normal)                   │
└───────────┬─────────────────────┬───────────────────────────────┘
            │ POST /api/chat       │ POST /api/chat
            ↓                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                     API ROUTE LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /app/api/chat/route.ts                                  │   │
│  │  - Read user session (Supabase SSR)                      │   │
│  │  - Determine access tier (anon vs. authenticated)        │   │
│  │  - Assemble system prompt with injected property data    │   │
│  │  - Call streamText() with tools for DB lookups           │   │
│  │  - Stream SSE chunks back to client                      │   │
│  └───────────┬──────────────────────────────────────────────┘   │
└──────────────┼──────────────────────────────────────────────────┘
               │
       ┌───────┴──────────────────┐
       │                          │
       ↓                          ↓
┌─────────────────┐    ┌──────────────────────────────────────────┐
│  AI PROVIDER    │    │  DATA ACCESS LAYER                       │
│  LAYER          │    │  ┌───────────────┐  ┌───────────────┐    │
│                 │    │  │ Supabase      │  │ Supabase      │    │
│  OpenAI / Ant  │    │  │ server client │  │ admin client  │    │
│  via AI SDK    │    │  │ (RLS-enforced │  │ (service role │    │
│  streamText()  │    │  │  property     │  │  for anon     │    │
│                 │    │  │  queries)     │  │  property     │    │
└─────────────────┘    │  └───────────────┘  │  lookups)     │    │
                       │                     └───────────────┘    │
                       │  Properties, Bookings, Profiles tables   │
                       └──────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| ChatBubble | Floating toggle button + collapsed chat panel | `use client`, fixed position, `next/dynamic` lazy import in root layout |
| ChatPanel | Conversation UI: message list, input, typing indicator | Client component, uses `useChat` from `ai/react` |
| `/chat` page | Full-screen dedicated chat view | Next.js page at `src/app/chat/page.tsx` wrapping ChatPanel |
| `/api/chat` route | Streaming AI endpoint, auth gating, context assembly | `src/app/api/chat/route.ts`, POST handler |
| System prompt builder | Assembles LLM prompt from user tier and Supabase property data | Utility function `src/lib/chat/build-system-prompt.ts` |
| AI tool definitions | Typed Zod-validated tools for DB lookups the LLM can call | `src/lib/chat/tools.ts` |
| Context assembler | Fetches relevant property data to inject into system prompt | Runs server-side before streamText call |

## Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Streaming AI endpoint (POST)
│   ├── chat/
│   │   └── page.tsx              # Full-screen /chat page
│   ├── components/
│   │   └── chat/
│   │       ├── chat-bubble.tsx   # Floating toggle widget (lazy loaded)
│   │       ├── chat-panel.tsx    # Conversation UI (useChat consumer)
│   │       ├── message-list.tsx  # Renders conversation history
│   │       ├── message-item.tsx  # Individual message bubble
│   │       └── typing-indicator.tsx
│   └── layout.tsx                # Mounts ChatBubble via dynamic import
├── lib/
│   └── chat/
│       ├── build-system-prompt.ts  # Composes system prompt from context
│       ├── tools.ts                # AI SDK tool definitions (Zod schemas)
│       └── fetch-property-context.ts  # Supabase queries for prompt context
```

### Structure Rationale

- **`app/api/chat/`:** Isolated from other API routes. All AI provider calls happen here, never on the client.
- **`app/components/chat/`:** Co-located UI components separate from existing app components to avoid coupling.
- **`lib/chat/`:** Business logic for context assembly and tool definitions extracted from the route handler to keep it thin and testable.
- **`app/chat/page.tsx`:** Thin page wrapper — renders the same ChatPanel used in the bubble, avoiding duplication.

## Architectural Patterns

### Pattern 1: Streaming via Vercel AI SDK (streamText + useChat)

**What:** The API route calls `streamText()` from the `ai` package and returns its result as a streaming response. The client uses the `useChat` hook from `ai/react` to consume the stream, automatically managing messages state and appending tokens as they arrive.

**When to use:** This is the standard pattern for all real-time chat interactions. Use it for every message exchange in this project.

**Trade-offs:** Requires Vercel AI SDK (adds ~40KB) but eliminates all manual SSE/stream plumbing. SDK abstracts provider switching (OpenAI ↔ Anthropic) cleanly.

**Example:**
```typescript
// src/app/api/chat/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/chat/build-system-prompt'
import { chatTools } from '@/lib/chat/tools'

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Resolve auth tier server-side — never trust client claims
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  const systemPrompt = await buildSystemPrompt({ user, supabase })

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages,
    tools: isAuthenticated ? chatTools : {},  // no tools for anon
    maxSteps: 3,
  })

  return result.toDataStreamResponse()
}
```

```typescript
// src/app/components/chat/chat-panel.tsx
'use client'
import { useChat } from 'ai/react'

export function ChatPanel() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: '/api/chat',
  })
  // render messages + form
}
```

### Pattern 2: Server-Side System Prompt Assembly (Context Injection)

**What:** Property data and user context are fetched server-side inside the API route and injected into the system prompt before calling the LLM. The client never sends property data — it only sends the conversation messages.

**When to use:** Always. This is how the chatbot gets knowledge about LuxuryStay properties, prices, and booking rules without needing RAG or fine-tuning.

**Trade-offs:** Adds a Supabase query on every request (keep it fast: a single query fetching 5–10 properties max). Token overhead is predictable and controllable. Simpler than RAG for a bounded property dataset.

**Example:**
```typescript
// src/lib/chat/build-system-prompt.ts
export async function buildSystemPrompt({ user, supabase }) {
  // Fetch real property data from Supabase
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name, price_per_night, location, rules, check_in_time, check_out_time')
    .limit(10)

  const propertiesSummary = properties?.map(p =>
    `- ${p.name} (${p.location}): €${p.price_per_night}/night. Check-in: ${p.check_in_time}, Check-out: ${p.check_out_time}. Rules: ${p.rules}`
  ).join('\n') ?? ''

  const userContext = user
    ? `The user is authenticated (ID: ${user.id}). You can help with their bookings, payments, and account.`
    : `The user is browsing anonymously. Provide property info and encourage them to sign up. Do NOT discuss booking details, payment history, or personal data.`

  return `You are the LuxuryStay AI concierge. You help guests discover properties, plan stays, and get local recommendations.

PROPERTIES AVAILABLE:
${propertiesSummary}

USER CONTEXT:
${userContext}

RULES:
- Never invent prices or availability not listed above
- For availability checks, use the check_availability tool
- Recommend signing up to complete bookings
- Reply in the same language as the user`
}
```

### Pattern 3: Auth-Gated Access Tiers

**What:** The API route reads the Supabase session server-side to determine the user's access tier. Anonymous users get a restricted system prompt and no tool access. Authenticated users get full context including booking queries.

**When to use:** Required for this project (PROJECT.md explicitly requires differentiated anonymous vs. authenticated access).

**Trade-offs:** No extra middleware needed — the existing Supabase SSR client already handles session extraction in API routes. Simple if/else branching in the route handler.

**Example:**
```typescript
// The auth check mirrors the existing pattern in other API routes
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// Anonymous: restricted prompt, no tools, no booking data
// Authenticated: full prompt, tools enabled, can query bookings
const tier = user ? 'authenticated' : 'anonymous'
```

### Pattern 4: Lazy-Loaded Floating Bubble

**What:** The ChatBubble component is mounted in `src/app/layout.tsx` using `next/dynamic` with `ssr: false`. It only loads after the page becomes interactive, keeping the initial JS bundle lean.

**When to use:** Always for the floating bubble — it must not block page load on any route.

**Trade-offs:** Introduces a small flash-of-no-content on first load, acceptable because the bubble is non-critical UI. The `/chat` page imports ChatPanel directly (no lazy load needed — it's the primary content there).

**Example:**
```typescript
// src/app/layout.tsx
import dynamic from 'next/dynamic'

const ChatBubble = dynamic(
  () => import('@/app/components/chat/chat-bubble'),
  { ssr: false, loading: () => null }  // null loading — don't show skeleton for a bubble
)

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatBubble />   {/* loads after hydration, doesn't block anything */}
      </body>
    </html>
  )
}
```

## Data Flow

### Chat Request Flow

```
User types message
    ↓
ChatPanel (useChat hook) accumulates messages in local state
    ↓
POST /api/chat  { messages: [...] }
    ↓
Route handler:
  1. createClient() → supabase.auth.getUser()  (reads cookie session)
  2. buildSystemPrompt({ user, supabase })      (Supabase property query)
  3. streamText({ system, messages, tools })    (AI provider call)
  4. result.toDataStreamResponse()              (returns SSE stream)
    ↓
SSE stream → useChat hook appends tokens to messages state
    ↓
MessageList re-renders with new tokens as they arrive
```

### Tool Call Flow (authenticated users only)

```
LLM decides to call check_availability tool
    ↓
AI SDK extracts tool call from stream
    ↓
tools.check_availability.execute({ property_id, check_in, check_out })
    ↓
Supabase query: SELECT * FROM bookings WHERE ...
    ↓
Result injected back into LLM context
    ↓
LLM generates final response incorporating availability data
    ↓
Streamed to client
```

### State Management

```
Server-side (API route, per request):
  - User session         → Supabase cookie (existing middleware manages)
  - Property context     → Assembled fresh each request from Supabase
  - Conversation history → Sent by client in POST body, NOT stored server-side

Client-side (useChat hook, in-memory):
  - messages[]           → React state via useChat (session-only, resets on page reload)
  - input                → Controlled input state
  - status               → 'idle' | 'loading' | 'streaming' | 'error'
```

Note: SESSION-ONLY history is the correct approach for this project (PROJECT.md explicitly rules out database persistence). The `useChat` hook manages this correctly out of the box with no additional work.

## Anti-Patterns

### Anti-Pattern 1: Calling the AI Provider from Client Components

**What people do:** Import OpenAI SDK directly in a React component and call it from `useEffect` or event handlers.

**Why it's wrong:** Exposes API keys in the browser bundle. CORS issues. No streaming possible via this path. Security disaster.

**Do this instead:** All AI provider calls happen exclusively in `/api/chat/route.ts`. The client only talks to your own API route.

### Anti-Pattern 2: Building Custom Streaming Infrastructure

**What people do:** Manually create `ReadableStream`, handle SSE events, write custom client-side stream parsers.

**Why it's wrong:** Vercel AI SDK handles all of this. Manual SSE is error-prone and significantly more code than needed.

**Do this instead:** Use `streamText().toDataStreamResponse()` on the server and `useChat` on the client. Done.

### Anti-Pattern 3: Trusting Client-Sent User Context

**What people do:** Pass `userId` or `isAuthenticated: true` in the POST body from the client, then use that in the API route to determine what data to show.

**Why it's wrong:** Any user can send `isAuthenticated: true` in the POST body. This grants anonymous users access to booking data, payment details, and other sensitive information.

**Do this instead:** Always resolve auth server-side via `supabase.auth.getUser()` inside the API route. This matches the existing pattern in all other API routes in this codebase.

### Anti-Pattern 4: Mounting ChatBubble with SSR

**What people do:** Import ChatBubble as a normal import in layout.tsx, allowing it to server-render.

**Why it's wrong:** `useChat` requires a browser environment. SSR of the bubble adds JS to every page's initial payload, slowing Time to Interactive. The bubble is non-critical content.

**Do this instead:** `next/dynamic` with `ssr: false`. The bubble initializes post-hydration.

### Anti-Pattern 5: RAG Before It's Needed

**What people do:** Set up pgvector, embed all property descriptions, build a similarity search pipeline because "that's how AI chatbots work."

**Why it's wrong:** LuxuryStay has a bounded, small property dataset. Direct system prompt injection is faster to build, cheaper to run, and sufficient. RAG adds significant infrastructure complexity for no benefit at this scale.

**Do this instead:** Inject property data directly into the system prompt via a Supabase query. Re-evaluate RAG only if the property catalog grows to hundreds of listings.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI (gpt-4o-mini) | `@ai-sdk/openai` provider in API route | Recommended: gpt-4o-mini balances quality/cost. API key in env var, never in client code. |
| Anthropic (claude-haiku) | `@ai-sdk/anthropic` provider | Alternative provider; AI SDK makes switching trivial |
| Supabase | Existing `createClient()` from `@/lib/supabase/server` | Reuse existing server client — no new auth setup needed |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| ChatPanel ↔ /api/chat | HTTP POST via useChat hook | Messages array is the only client-to-server payload |
| /api/chat ↔ Supabase | Direct server client query | Uses existing RLS-enforced client for auth'd users; admin client not needed for chat |
| /api/chat ↔ AI Provider | Vercel AI SDK | Provider-agnostic; swapping OpenAI for Anthropic = one line change |
| ChatBubble ↔ /chat page | Both render ChatPanel | Share component, no shared state needed (each has its own useChat instance) |
| Existing middleware ↔ /chat | Middleware must NOT redirect /chat to login | /chat must be accessible to anonymous users — add to public routes in middleware.ts |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users | Current architecture is fine. API routes auto-scale on Vercel. |
| 1k–10k users | Add caching layer for system prompts (property data doesn't change per-request). Cache with `unstable_cache` or Redis. |
| 10k+ users | Move to AI provider with higher rate limits. Consider response caching for common questions (property hours, check-in info). |

### Scaling Priorities

1. **First bottleneck:** AI provider rate limits. Mitigation: use token limits (`maxTokens`), consider response caching for frequent questions.
2. **Second bottleneck:** Supabase property queries on every request. Mitigation: cache property context with Next.js `unstable_cache` with a 5-minute TTL.

## Build Order Implications

The component dependency graph dictates this build order:

1. **`/api/chat` route first** — all client components depend on this endpoint existing. Can be tested with curl before any UI exists.
2. **`build-system-prompt.ts` + `tools.ts`** — these feed the route. Build and test them in isolation with unit tests.
3. **`chat-panel.tsx`** — core conversation UI. Testable in isolation at `/chat` before the bubble exists.
4. **`/chat` page** — thin wrapper around ChatPanel. Trivial once ChatPanel works.
5. **`chat-bubble.tsx`** — floating widget. Build last because it's the most UI-complex part (open/close state, positioning, animation) but has no new backend dependencies.
6. **Root layout integration** — mount ChatBubble via dynamic import. One-line change, done last to avoid breaking layout during development.

## Sources

- [Vercel AI SDK — Getting Started: Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) (official docs, HIGH confidence)
- [AI SDK UI: Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) (official docs, HIGH confidence)
- [AI SDK 5 Release — Vercel Blog](https://vercel.com/blog/ai-sdk-5) (official announcement, HIGH confidence)
- [AI SDK 5 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0) (official docs, HIGH confidence)
- [Supabase + Vercel AI Chatbot template](https://github.com/supabase-community/vercel-ai-chatbot) (reference implementation, MEDIUM confidence)
- [Building RAG Chatbot with Supabase pgvector and Next.js](https://noqta.tn/en/tutorials/building-a-rag-chatbot-with-supabase-pgvector-and-nextjs) (tutorial, LOW confidence — not needed for this project scope)
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/pages/guides/lazy-loading) (official docs, HIGH confidence)
- [OWASP LLM Top 10: Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) (security reference, HIGH confidence)
- [How to Add Context to useChat Without Exposing it](https://github.com/vercel/ai/discussions/1869) (Vercel AI GitHub discussion, MEDIUM confidence)
- [Vercel AI SDK: streamText reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) (official docs, HIGH confidence)

---
*Architecture research for: AI Chatbot integration into LuxuryStay (Next.js 16 + Supabase)*
*Researched: 2026-03-03*
