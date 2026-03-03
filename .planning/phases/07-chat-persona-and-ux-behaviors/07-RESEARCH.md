# Phase 7: Chat Persona and UX Behaviors - Research

**Researched:** 2026-03-03
**Domain:** Vercel AI SDK `useChat` hook, React chat UI, streaming UX, session persistence
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-01 | Il chatbot ha una persona luxury coerente con il brand LuxuryStay | System prompt refinement in `route.ts` + tone guidelines documented below |
| UX-02 | Il chatbot mostra suggested chips/quick replies per guidare la conversazione | Hand-rolled chip component using React state; no SDK primitive needed |
| UX-03 | Il chatbot ha un fallback graceful quando non può rispondere (suggerisce contatto diretto) | System prompt instruction pattern + existing graceful degradation in route.ts |
| UX-04 | Le risposte sono in streaming (appaiono progressivamente, non tutto insieme) | Already implemented via `toUIMessageStreamResponse()` + `useChat` — requires client component wiring only |
| UX-05 | La cronologia chat persiste durante la sessione del browser | `useChat` maintains in-memory state; component must not unmount between navigations — OR use `initialMessages` + sessionStorage for cross-navigation persistence |
</phase_requirements>

---

## Summary

Phase 7 is primarily a **client-side React component phase**. The server-side infrastructure (streaming endpoint, system prompt, property/booking context) is already complete through Phases 1-6. The work here is: (1) wiring the `useChat` hook to the existing `/api/chat` endpoint, (2) refining the system prompt tone to be more precisely "luxury concierge," (3) building a chat UI React component with streaming-aware rendering, suggested question chips, and graceful fallback display, and (4) persisting conversation state for the browser session.

The Vercel AI SDK `useChat` hook (from `@ai-sdk/react`, already a dependency as part of the `ai` package) handles all streaming complexity. It consumes the `toUIMessageStreamResponse()` format already returned by `route.ts`. No new server-side changes are needed except optional system prompt text refinements. The `useChat` hook maintains messages in React component state automatically — session persistence for UX-05 requires keeping the component mounted or saving/restoring from `sessionStorage`.

Suggested question chips (UX-02) are not a built-in SDK primitive — they are a hand-rolled UI pattern: an array of strings rendered as clickable buttons that call `sendMessage()` when clicked, visible only when `messages.length === 0`. Graceful fallback (UX-03) is implemented at the system prompt layer, not the UI layer: the AI is instructed to say "I don't know" and provide a contact link rather than guess.

**Primary recommendation:** Build a single `ChatWidget` client component that uses `useChat` from `@ai-sdk/react`, passes `propertyId` via `DefaultChatTransport`'s `body` option, renders messages using `message.parts`, shows chips when conversation is empty, and uses `sessionStorage` to save/restore `messages` across navigation events for UX-05.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@ai-sdk/react` | included in `ai ^6.0.108` | `useChat` hook for chat state, streaming, message management | Official Vercel AI SDK React integration; already a dependency |
| `ai` | `^6.0.108` | `DefaultChatTransport`, `UIMessage` types, streaming primitives | Already installed; provides `DefaultChatTransport` for custom body |
| `tailwindcss` | `^4` | Chat bubble, chip, input styling | Already the project's CSS framework |
| `framer-motion` | `^12.34.3` | Smooth chip fade-in, message entry animation | Already installed; use sparingly for premium feel |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sessionStorage` (Web API) | Native | Persist serialized `UIMessage[]` across navigation | Restoring chat history when component remounts (UX-05) |
| React `useEffect` + `useState` | React 19 | Load/save messages from sessionStorage | Component mount and on every new message |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `sessionStorage` for UX-05 | Keep component mounted in layout | Mounting in root layout is Phase 8 concern (bubble widget); for now sessionStorage is simpler |
| Hand-rolled chips | Third-party chip/badge library | No need — Tailwind buttons are sufficient, avoid dependency |
| Custom streaming parser | `useChat` hook | Never hand-roll SSE parsing; `useChat` handles all protocol details |

**Installation:** No new packages needed. All dependencies already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure

```
src/app/components/
├── chat-widget.tsx        # 'use client' — useChat wrapper, full chat UI
│                          # Used in Phase 8 (bubble) and Phase 9 (page)
├── chat-messages.tsx      # Message list renderer (role-based bubbles, streaming)
├── chat-input.tsx         # Input form with Enter-to-send and send button
└── chat-chips.tsx         # Suggested question chips (visible when messages empty)
```

Note: Phase 7 delivers the component architecture. Phase 8 will wrap `chat-widget.tsx` in a floating bubble. Phase 9 will embed it in a full-screen `/chat` page.

### Pattern 1: `useChat` Hook Wiring

**What:** Connect React component to `/api/chat` with `useChat`, passing `propertyId` in every request body.

**When to use:** Any client component that needs the chat stream.

**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/transport
'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

interface ChatWidgetProps {
  propertyId?: string
}

export default function ChatWidget({ propertyId }: ChatWidgetProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        // propertyId is sent with every request — route.ts already handles this
        propertyId: propertyId ?? null,
      }),
    }),
  })

  const isStreaming = status === 'streaming'
  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {isEmpty && <ChatChips onSelect={(q) => sendMessage({ text: q })} />}
      <ChatMessages messages={messages} isStreaming={isStreaming} />
      <ChatInput onSend={(text) => sendMessage({ text })} disabled={isStreaming} />
    </div>
  )
}
```

### Pattern 2: Message Rendering with Parts API

**What:** Render `UIMessage[]` using the `parts` property (not deprecated `content`).

**When to use:** Always — the parts API is the current standard in AI SDK v6.

**Example:**
```typescript
// Source: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
import type { UIMessage } from 'ai'

function ChatMessages({ messages }: { messages: UIMessage[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              message.role === 'user'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-900'
            }`}
          >
            {message.parts.map((part, i) => {
              if (part.type === 'text') {
                return <span key={i}>{part.text}</span>
              }
              return null
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Pattern 3: Suggested Question Chips

**What:** Clickable buttons shown only before first message; clicking sends the question directly.

**When to use:** When `messages.length === 0` (empty state).

**Example:**
```typescript
const LUXURY_CHIPS = [
  'What are the check-in and check-out times?',
  'What amenities are available?',
  'Tell me about the house rules',
  'What local restaurants do you recommend?',
  'How do I get to the property?',
]

function ChatChips({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="p-4">
      <p className="text-xs text-neutral-500 mb-3 font-medium tracking-wide uppercase">
        How can I assist you?
      </p>
      <div className="flex flex-wrap gap-2">
        {LUXURY_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onSelect(chip)}
            className="text-sm px-3 py-1.5 rounded-full border border-neutral-200
                       text-neutral-700 hover:border-neutral-900 hover:text-neutral-900
                       transition-colors bg-white"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Pattern 4: Session Persistence with sessionStorage (UX-05)

**What:** Save `UIMessage[]` to `sessionStorage` on every message update; restore on mount.

**When to use:** When the chat component may unmount during navigation (before Phase 8 mounts it persistently in layout).

**Example:**
```typescript
// Source: useChat setMessages API - https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
import { useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'

const SESSION_KEY = 'luxurystay_chat_history'

export default function ChatWidget({ propertyId }: { propertyId?: string }) {
  // Load persisted messages synchronously before first render
  const storedMessages = (): UIMessage[] => {
    if (typeof window === 'undefined') return []
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  const { messages, sendMessage, setMessages, status } = useChat({
    // initialMessages restores session on mount
    messages: storedMessages(),
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({ propertyId: propertyId ?? null }),
    }),
  })

  // Persist on every message change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages))
    }
  }, [messages])

  // ...rest of component
}
```

### Pattern 5: Graceful Fallback (UX-03) — System Prompt Layer

**What:** System prompt instruction that forces the AI to admit ignorance rather than guess.

**When to use:** This is a server-side concern in `route.ts`, not a UI concern.

**Implementation:** Add to `SYSTEM_PROMPT_BASE` in `route.ts`:

```
FALLBACK INSTRUCTIONS:
- If you do not have specific information to answer a question, say clearly:
  "I don't have that specific information available. For the most accurate answer,
  I recommend contacting the host directly via the booking platform."
- NEVER invent or guess details (prices, availability, amenities) not in your context.
- Always offer what you CAN help with after a fallback response.
```

The existing system prompt already has partial coverage. Phase 7 refines it into a formal luxury-tone paragraph.

### Pattern 6: Luxury Persona Tone (UX-01)

**What:** Consistent, premium hospitality voice across all AI responses.

**Characteristics:**
- Formal but warm ("I'd be delighted to assist" not "Sure!")
- Never terse, never robotic — full sentences
- Uses hospitality vocabulary ("Your stay," "our property," "I'd be happy to arrange")
- Doesn't use emojis or exclamation marks
- Acknowledges the guest's request before answering

**System prompt addition for `route.ts`:**
```
TONE AND VOICE:
You are a sophisticated personal concierge for a premier luxury vacation rental.
Your communication style is:
- Warm and attentive: Address the guest's need directly and graciously
- Formal: Use complete sentences; avoid casual phrases ("sure", "yep", "no worries")
- Precise: Give specific information, never vague generalizations
- Hospitable: Frame every interaction as a service, not a transaction

Opening examples:
WRONG: "Sure! Check-in is at 3pm."
RIGHT: "Your check-in time is 3:00 PM. Should you require an early arrival, I'd be
happy to note your preference for the host."
```

### Anti-Patterns to Avoid

- **Rendering `message.content` instead of `message.parts`:** The `content` property is deprecated in AI SDK v6. Always use `message.parts` and filter by `part.type === 'text'`.
- **Passing UIMessage[] directly to streamText:** The server-side `route.ts` must call `convertToModelMessages(messages)` before passing to `streamText`. This is already done in the codebase.
- **Using `toDataStreamResponse()` instead of `toUIMessageStreamResponse()`:** The existing `route.ts` correctly uses `toUIMessageStreamResponse()`. Never change this — `useChat` requires this format.
- **Storing the entire messages array in a single localStorage key across page reloads:** The requirement is session-only (UX-05 says "sessione del browser"). `sessionStorage` is cleared on tab close, matching the spec. `localStorage` would survive tab close (out of scope per PROJECT.md).
- **Resetting sessionStorage key every time the component mounts:** Only restore if `messages.length === 0`; let the hook's in-memory state take precedence if it already has messages.
- **Building custom SSE parsing:** Never. `useChat` handles the entire UI message stream protocol transparently.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming response display | Manual SSE/fetch streaming loop | `useChat` from `@ai-sdk/react` | Handles protocol, reconnection, state, partial renders automatically |
| Chat state management | Custom `useState` + fetch logic | `useChat` hook | Race conditions, abort handling, message IDs — all handled |
| SSE protocol parsing | Custom ReadableStream parser | `useChat` (consumes `toUIMessageStreamResponse`) | The protocol has 10+ event types; `useChat` handles all |
| Message format conversion | Custom `UIMessage` → model format | `convertToModelMessages()` from `ai` | Already in route.ts; format is non-trivial |

**Key insight:** The server-side is already built correctly. Phase 7 is about the client consumer. `useChat` is a complete abstraction — never bypass it with raw fetch.

---

## Common Pitfalls

### Pitfall 1: Stale Body in DefaultChatTransport

**What goes wrong:** When using `body: { propertyId }` as a static object, if `propertyId` changes (e.g., user navigates to a different property page), the old value is sent.

**Why it happens:** Static object is captured at hook initialization time.

**How to avoid:** Use the function form: `body: () => ({ propertyId: currentPropertyId })`. This re-evaluates on every request.

**Warning signs:** All requests send the same `propertyId` regardless of navigation.

### Pitfall 2: message.content vs message.parts

**What goes wrong:** Rendering `message.content` shows nothing or undefined in AI SDK v6+.

**Why it happens:** The `content` property was the v4/v5 API. v6 uses `parts` exclusively for `UIMessage`.

**How to avoid:** Always render `message.parts.filter(p => p.type === 'text').map(p => p.text)`.

**Warning signs:** Messages appear blank in the UI; no TypeScript error because `content` may still exist as a deprecated field.

### Pitfall 3: sessionStorage Serialization of UIMessage

**What goes wrong:** `UIMessage` objects with complex `parts` don't round-trip through `JSON.stringify`/`JSON.parse` if they contain non-serializable values.

**Why it happens:** Tool invocations or binary file parts can contain non-JSON-safe values.

**How to avoid:** In this project, all messages are text-only (no tools, no files in Phase 7). The round-trip is safe. Add a `try/catch` around the parse call as shown in Pattern 4.

**Warning signs:** `JSON.parse` throws, wiping chat history silently.

### Pitfall 4: Chips Reappearing After First Message

**What goes wrong:** If the `messages` state is reset (e.g., component unmounts), chips reappear mid-conversation.

**Why it happens:** `messages.length === 0` check is true again after remount without persistence.

**How to avoid:** Combine the sessionStorage restore pattern (Pattern 4) with the chip visibility check. If restored messages exist, chips stay hidden.

**Warning signs:** User sees chips again after navigating away and back.

### Pitfall 5: Streaming Status Not Used for UX Feedback

**What goes wrong:** Input appears enabled during streaming, user double-sends, response corrupts.

**Why it happens:** Not wiring `status === 'streaming'` to disable the input.

**How to avoid:** Pass `disabled={status === 'streaming' || status === 'submitted'}` to the input component. The `useChat` hook returns `status` for exactly this purpose.

**Warning signs:** User can submit multiple messages while the first streams.

---

## Code Examples

Verified patterns from official sources:

### Complete useChat with DefaultChatTransport and custom body
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/transport
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

const { messages, sendMessage, status, stop } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({
      propertyId: propertyId ?? null,
    }),
  }),
})
```

### Sending a message programmatically (chip click)
```typescript
// Source: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
sendMessage({ text: 'What are the check-in times?' })
```

### Status-aware UI
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
// status: 'ready' | 'submitted' | 'streaming' | 'error'
const isLoading = status === 'submitted' || status === 'streaming'

<button disabled={isLoading} onClick={stop}>Stop</button>
<input disabled={isLoading} />
```

### Restore messages from sessionStorage via initialMessages
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
// 'messages' param on useChat sets the initial messages
const { messages, sendMessage, setMessages } = useChat({
  messages: loadFromSessionStorage(), // UIMessage[] or []
  transport: new DefaultChatTransport({ api: '/api/chat' }),
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `message.content` (string) | `message.parts` (array of typed parts) | AI SDK v5/v6 | Must render parts, not content |
| `handleSubmit` / `handleInputChange` | `sendMessage({ text })` | AI SDK v5 | Simpler API, no synthetic event needed |
| `toDataStreamResponse()` | `toUIMessageStreamResponse()` | AI SDK v5 | Required for `useChat` UI protocol compatibility |
| Import from `'ai'` | Import `useChat` from `'@ai-sdk/react'` | AI SDK v5 | Framework-specific imports; `'ai'` exports types and `DefaultChatTransport` |
| `body` object (static) | `body: () => ({})` function | AI SDK v6 | Prevents stale closure issue with dynamic values |

**Deprecated/outdated:**
- `message.content` property: Use `message.parts` instead
- `handleSubmit` + `handleInputChange` pattern: Use `sendMessage({ text })` instead
- `input` state from `useChat`: Manage input state locally with `useState`

---

## Open Questions

1. **Where does ChatWidget live for Phase 7?**
   - What we know: Phase 8 is the bubble widget (requires lazy loading), Phase 9 is the `/chat` page. Phase 7 only needs to build the component itself.
   - What's unclear: Should Phase 7 create a minimal test page at `/chat` to prove the component works, or leave that to Phase 9?
   - Recommendation: Create a minimal `/chat/page.tsx` in Phase 7 as a development harness. Phase 9 will replace it with the full design. This lets us verify streaming + session persistence without depending on Phase 8.

2. **Chip text language: Italian or English?**
   - What we know: The platform is Italian (`lang="it"`, Italian text throughout). The existing system prompt is in English. The chatbot likely responds in the user's language.
   - What's unclear: Should chips be in Italian, English, or both?
   - Recommendation: Italian chips for UI consistency with the platform; the AI will respond in Italian automatically based on the question language.

3. **Should `sessionStorage` key include `propertyId`?**
   - What we know: If a guest chats about Property A, then visits Property B, the stored history is about the wrong property.
   - What's unclear: Whether a single session key is acceptable UX.
   - Recommendation: Namespace the key: `luxurystay_chat_${propertyId ?? 'general'}`. This ensures property-specific history doesn't bleed across properties.

---

## Sources

### Primary (HIGH confidence)
- `https://ai-sdk.dev/docs/ai-sdk-ui/chatbot` — useChat hook parameters, message format, sendMessage API
- `https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat` — Full API reference, status values, setMessages
- `https://ai-sdk.dev/docs/ai-sdk-ui/transport` — DefaultChatTransport, body function form, prepareSendMessagesRequest
- `https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol` — toUIMessageStreamResponse protocol, SSE format
- `https://ai-sdk.dev/docs/getting-started/nextjs-app-router` — Complete working example of useChat with parts rendering
- `https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence` — initialMessages / messages restore pattern

### Secondary (MEDIUM confidence)
- `https://vercel.com/blog/ai-sdk-5` — Verified API changes (parts vs content, sendMessage, transport)
- `https://github.com/vercel/ai/issues/7819` — Confirmed stale body issue with static `body` object; function form is the fix

### Tertiary (LOW confidence)
- WebSearch results on luxury hospitality chatbot tone — general patterns, not SDK-specific; used only for persona guidance

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; verified against official docs
- Architecture: HIGH — `useChat` API verified against ai-sdk.dev official reference
- Pitfalls: HIGH (stale body, parts/content) verified via GitHub issues + official docs; MEDIUM (sessionStorage serialization) based on general JavaScript knowledge
- Persona guidance: MEDIUM — derived from existing system prompt in route.ts + general hospitality AI best practices

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (AI SDK is fast-moving; re-verify if any breaking changes in `ai` package before planning)
