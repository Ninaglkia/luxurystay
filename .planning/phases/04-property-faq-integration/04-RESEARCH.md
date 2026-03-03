# Phase 04: Property FAQ Integration - Research

**Researched:** 2026-03-03
**Domain:** Supabase property data retrieval + Vercel AI SDK system prompt context injection
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FAQ-01 | User can ask about check-in/check-out and receive real data from the property | Properties table has no `checkin_time`/`checkout_time` columns — these fields do NOT exist in the current schema. Only booking `check_in`/`check_out` date columns exist on `bookings`. The chatbot must either derive times from property description or acknowledge the gap. See Open Questions. |
| FAQ-02 | User can ask about available services (WiFi, parking, pool) with data from Supabase | Properties table has `amenities` column (string array). Lookup map: `wifi`, `tv`, `cucina`, `lavatrice`, `aria`, `piscina`, `parcheggio`, `riscaldamento`, `giardino`, `animali`. Serialize to human-readable list before injecting. |
| FAQ-03 | User can ask about house rules and receive accurate answers from the specific property | Properties table has NO `house_rules` column in current schema. `cancellation_policy` (string: `flessibile`, `moderata`, `rigida`) IS available. House rules beyond cancellation policy do not appear to exist. See Open Questions. |
| FAQ-04 | User can ask for location and directions and receive address and location info | Properties table has `address` (string), `lat` (float), `lng` (float). Full address string is available. Directions must be composed from address (no directions-specific column exists). |
| FAQ-05 | Chatbot responds ONLY with real Supabase data, never inventing information | System prompt must contain explicit null-field instructions. Pattern: check each field for null/undefined, inject only truthy values, and include explicit instruction: "If a field is not provided, say you do not have that information." |
</phase_requirements>

---

## Summary

Phase 4 adds property context injection to the existing streaming chat endpoint (`/api/chat`). The architecture decision is locked from Phase 1: **no RAG, no vector store — inject property data directly into the system prompt per request**. The implementation requires: (1) fetching the relevant property record from Supabase at request time, (2) serializing it into a structured string, and (3) appending it to the system prompt before calling `streamText`.

The key technical challenge is **property identification**: the API route currently has no mechanism to know which property the user is asking about. The chat widget will be embedded on property pages in Phase 8, but for Phase 4 the integration must be designed to accept a `propertyId` from the request body or query params and fetch the corresponding record. This is a design decision that needs to be made and locked.

The Supabase `properties` table schema is fully known from the codebase. The table does NOT have explicit `checkin_time`, `checkout_time`, or `house_rules` columns — these are notable gaps relative to the FAQ requirements. The chatbot must handle missing fields gracefully (FAQ-05) by acknowledging when information is unavailable rather than hallucinating.

**Primary recommendation:** Accept `propertyId` in the POST request body. In the `POST` handler, fetch the property using `@supabase/supabase-js` admin client with the `SUPABASE_SERVICE_ROLE_KEY` (already in `src/lib/admin-supabase.ts`). Build a `PROPERTY_CONTEXT` string and append to the system prompt. Guard every null field before injecting. Add explicit system prompt instruction: "Only use data from the PROPERTY CONTEXT block. If a field is missing or empty, say you do not have that information."

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.98.0 | Fetch property record from DB | Already in project; admin client pattern already exists |
| `ai` (Vercel AI SDK) | ^6.0.108 | `streamText` with enriched system prompt | Already used in route.ts |
| `@ai-sdk/anthropic` | ^3.0.53 | Claude Haiku 4.5 model provider | Already used, locked decision |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `getAdminSupabase()` | (internal) | Bypass RLS to fetch any property | Use in API route — server-side only, never exposed to client |

### No New Installations Required

All required libraries are already present in the project. Phase 4 is purely additive logic inside `route.ts` and the existing Supabase client infrastructure.

**Installation:**
```bash
# No new packages needed
```

---

## Architecture Patterns

### Confirmed Properties Table Schema

From codebase analysis (`add-property-flow.tsx` insert + `property/[id]/page.tsx` Property interface):

```
properties table columns (confirmed):
  id                  uuid (PK)
  user_id             uuid (FK to auth.users)
  category            string   -- "casa", "appartamento", "villa", "baita", "bb", "barca", "camper", "castello", "loft"
  space_type          string   -- "entire", "private", "shared"
  address             string   -- full address string e.g. "Via Roma 1, Milano, MI, 20100, Italia"
  lat                 float
  lng                 float
  guests              integer
  bedrooms            integer
  beds                integer
  bathrooms           integer
  amenities           string[] -- array: ["wifi","tv","cucina","lavatrice","aria","piscina","parcheggio","riscaldamento","giardino","animali"]
  photos              string[] -- array of storage URLs
  title               string
  description         string
  price               integer  -- per night, in EUR
  cancellation_policy string   -- "flessibile", "moderata", "rigida"
  created_at          timestamptz

MISSING (not in schema):
  checkin_time        -- DOES NOT EXIST
  checkout_time       -- DOES NOT EXIST
  house_rules         -- DOES NOT EXIST
```

**Amenity ID to label mapping (from property/[id]/page.tsx):**
```
wifi        -> "Wi-Fi"
tv          -> "TV"
cucina      -> "Cucina"
lavatrice   -> "Lavatrice"
aria        -> "Aria condizionata"
piscina     -> "Piscina privata"
parcheggio  -> "Garage gratuito in loco"
riscaldamento -> "Riscaldamento"
giardino    -> "Giardino"
animali     -> "Animali domestici ammessi"
```

**Cancellation policy ID to description:**
```
flessibile -> "Cancellazione gratuita fino a 24 ore prima del check-in. Rimborso del 50% nelle ultime 24 ore."
moderata   -> "Cancellazione gratuita fino a 5 giorni prima. Rimborso del 50% tra 5 giorni e 24 ore prima."
rigida     -> "Rimborso del 50% solo fino a 7 giorni prima del check-in. Nessun rimborso dopo."
```

### Recommended Project Structure

No new files/folders required. Changes are limited to:

```
src/
├── app/
│   └── api/
│       └── chat/
│           ├── route.ts          # Modified: add property fetch + context injection
│           ├── route.test.ts     # Modified: add tests for FAQ scenarios
│           └── property-context.ts   # NEW: pure function buildPropertyContext(property)
└── lib/
    └── supabase/
        └── server.ts             # Unchanged (uses cookie-based session)
    └── admin-supabase.ts         # Unchanged (service role client — use for property fetch)
```

### Pattern 1: Property Context Injection via System Prompt Append

**What:** Fetch property record server-side before calling `streamText`. Serialize to structured string. Append to system prompt. The AI then uses ONLY that data.

**When to use:** Every request that includes a `propertyId` in the body.

**Example:**
```typescript
// src/app/api/chat/property-context.ts
// Pure serialization — no I/O, easy to unit test

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi',
  tv: 'TV',
  cucina: 'Cucina',
  lavatrice: 'Lavatrice',
  aria: 'Aria condizionata',
  piscina: 'Piscina privata',
  parcheggio: 'Garage gratuito in loco',
  riscaldamento: 'Riscaldamento',
  giardino: 'Giardino',
  animali: 'Animali domestici ammessi',
}

const CANCELLATION_LABELS: Record<string, string> = {
  flessibile:
    'Cancellazione gratuita fino a 24 ore prima del check-in. Rimborso del 50% nelle ultime 24 ore.',
  moderata:
    'Cancellazione gratuita fino a 5 giorni prima. Rimborso del 50% tra 5 giorni e 24 ore prima.',
  rigida:
    'Rimborso del 50% solo fino a 7 giorni prima del check-in. Nessun rimborso dopo.',
}

interface PropertyRecord {
  title: string | null
  description: string | null
  address: string | null
  lat: number | null
  lng: number | null
  price: number | null
  category: string | null
  space_type: string | null
  guests: number | null
  bedrooms: number | null
  beds: number | null
  bathrooms: number | null
  amenities: string[] | null
  cancellation_policy: string | null
}

export function buildPropertyContext(property: PropertyRecord): string {
  const lines: string[] = ['PROPERTY CONTEXT (use ONLY this data to answer property questions):']

  if (property.title) lines.push(`Name: ${property.title}`)
  if (property.address) lines.push(`Address: ${property.address}`)
  if (property.lat && property.lng)
    lines.push(`Coordinates: ${property.lat}, ${property.lng}`)
  if (property.price) lines.push(`Price per night: €${property.price}`)
  if (property.guests) lines.push(`Maximum guests: ${property.guests}`)
  if (property.bedrooms) lines.push(`Bedrooms: ${property.bedrooms}`)
  if (property.beds) lines.push(`Beds: ${property.beds}`)
  if (property.bathrooms) lines.push(`Bathrooms: ${property.bathrooms}`)

  if (property.amenities && property.amenities.length > 0) {
    const labels = property.amenities
      .map((id) => AMENITY_LABELS[id] ?? id)
      .join(', ')
    lines.push(`Amenities: ${labels}`)
  } else {
    lines.push('Amenities: not specified')
  }

  if (property.cancellation_policy) {
    const policyLabel =
      CANCELLATION_LABELS[property.cancellation_policy] ??
      property.cancellation_policy
    lines.push(`Cancellation policy: ${policyLabel}`)
  }

  if (property.description) lines.push(`Description: ${property.description}`)

  lines.push('')
  lines.push(
    'IMPORTANT: If a property field is not listed above, say "I don\'t have that information for this property." NEVER invent or guess.'
  )
  lines.push(
    'Check-in/check-out times and house rules are not available for this property — acknowledge this honestly if asked.'
  )

  return lines.join('\n')
}
```

### Pattern 2: Property Fetch in Route Handler

**What:** Use the admin Supabase client (service role, bypasses RLS) to fetch a property by ID received from the request body.

**When to use:** When `propertyId` is present and is a valid UUID string in the request body.

**Example:**
```typescript
// In route.ts POST handler — add before streamText call

const propertyId = typeof body.propertyId === 'string' ? body.propertyId : null
let propertyContextBlock = ''

if (propertyId) {
  // Validate UUID format before querying — prevent injection into Supabase query
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (UUID_RE.test(propertyId)) {
    const adminClient = getAdminSupabase()
    const { data: property } = await adminClient
      .from('properties')
      .select('title, description, address, lat, lng, price, category, space_type, guests, bedrooms, beds, bathrooms, amenities, cancellation_policy')
      .eq('id', propertyId)
      .single()

    if (property) {
      propertyContextBlock = '\n\n' + buildPropertyContext(property)
    }
  }
}

const systemPrompt = SYSTEM_PROMPT_BASE
  + (isAuthenticated ? AUTH_ADDITIONS : ANON_ADDITIONS)
  + propertyContextBlock
```

### Anti-Patterns to Avoid

- **Fetching with the SSR client (cookie-based):** The `createClient()` from `src/lib/supabase/server.ts` requires cookie context and respects RLS. Use `getAdminSupabase()` from `src/lib/admin-supabase.ts` in the API route for reliable property reads. Properties need to be readable regardless of who is asking.
- **Injecting raw database row:** Do not dump the entire row object as JSON into the prompt. Serialize to a human-readable format — the model responds better and it avoids exposing internal fields (e.g., `user_id`, raw `photos` URLs).
- **Trusting `propertyId` from client without validation:** Always validate UUID format before using in a Supabase `.eq()` query. Malformed values can cause unexpected query behavior.
- **Skipping null guards:** Properties may have null fields (e.g., a newly created property with no description). Never inject `undefined`, `null`, or empty strings into the context block — skip the line entirely.
- **Blocking request if property fetch fails:** If the Supabase call fails or returns null (property not found / deleted), continue with the base system prompt only. Do not return an error — the chatbot can still help with general questions.
- **Fetching inside `convertToModelMessages`:** Property fetch must happen before `streamText`, not inside message conversion. Keep I/O outside pure functions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID validation | Custom regex from scratch | Inline UUID regex (well-known pattern) | One-liner, no library needed |
| Supabase admin access | Custom fetch to REST API | `getAdminSupabase()` from existing `src/lib/admin-supabase.ts` | Already implemented, tested pattern |
| Property serialization | Inline template string in route.ts | `buildPropertyContext()` pure function in separate file | Testable in isolation, keeps route.ts clean |
| Hallucination prevention | Complex output parsing | System prompt instruction ("NEVER invent") | Proven LLM alignment technique; no parsing overhead |

**Key insight:** The entire "don't hallucinate" requirement is solved by system prompt design, not code. The code's job is to ensure the prompt contains accurate, complete data and explicit instructions for the null case.

---

## Common Pitfalls

### Pitfall 1: Using the SSR Supabase Client in the API Route

**What goes wrong:** `createClient()` from `src/lib/supabase/server.ts` uses `cookies()` from `next/headers`. Inside a Route Handler, cookie context is available but the client respects Row Level Security (RLS). If RLS policies restrict property reads to the owner, the fetch will return null for properties owned by other users.

**Why it happens:** Developers assume the server client = admin access. It does not.

**How to avoid:** Use `getAdminSupabase()` from `src/lib/admin-supabase.ts` for all server-side property reads in the API route. This uses the service role key and bypasses RLS.

**Warning signs:** Property fetch returns `null` for valid property IDs during testing.

---

### Pitfall 2: Property ID Not Passed from Client

**What goes wrong:** The chat widget embeds on pages that may or may not know the property ID. If no `propertyId` is sent, the chatbot answers in generic mode with no property data — FAQ requirements fail.

**Why it happens:** The `/api/chat` endpoint was built without property context in mind. The client (Phase 7/8 chat widget) must pass `propertyId` in the request body alongside `messages`.

**How to avoid:** Document the API contract clearly. The `propertyId` field in the body is optional (backward-compatible) — when absent, chatbot works without property context. When present, property data is injected. The Vercel AI SDK `useChat` hook supports passing `body` extra fields.

**Warning signs:** Tests pass but integration with the actual property page shows generic (not property-specific) answers.

---

### Pitfall 3: Missing Fields Cause AI Hallucination

**What goes wrong:** Properties created before certain fields were added, or with incomplete data, have `null` amenities or missing description. Without explicit null guards + system prompt instruction, Claude will fill in plausible-sounding but fabricated data.

**Why it happens:** Language models are trained to be helpful and will generate plausible completions even when told not to hallucinate.

**How to avoid:**
1. Skip null/empty fields entirely from the context block (don't write "Amenities: null")
2. Include explicit instruction at the end of the context block: "If a field is not listed above, say you don't have that information. NEVER invent."
3. The check-in/checkout time and house rules columns DO NOT EXIST in the schema — add an explicit note in the context: "Check-in/check-out times and house rules are not available."

**Warning signs:** Chatbot answers "check-in is at 3pm" even when no such field exists in the property record.

---

### Pitfall 4: Property Context Grows Too Large

**What goes wrong:** The description field can be long. Injecting it verbatim into every system prompt token-costs every request. With `maxOutputTokens: 500` already set, input token count matters.

**Why it happens:** No truncation strategy.

**How to avoid:** Truncate `description` to a reasonable length (e.g., 500 chars) in `buildPropertyContext`. The raw description is rarely needed in full for FAQ answers. Keep total property context block under ~300 tokens.

**Warning signs:** API call latency increases; Anthropic bill grows faster than expected.

---

### Pitfall 5: `getAdminSupabase()` Called Outside Server Context

**What goes wrong:** `getAdminSupabase()` uses `SUPABASE_SERVICE_ROLE_KEY` — a secret env var. If this function is ever called in client-side code, the key would be exposed in the browser bundle.

**Why it happens:** Confusion between client and server modules in Next.js App Router.

**How to avoid:** `route.ts` is already server-only. Do not export `buildPropertyContext` or property fetch logic to any client component. Keep `property-context.ts` as a server-only module (no `'use client'` directive needed — it's not a React component).

**Warning signs:** Next.js build warning about server-only modules being bundled for client.

---

## Code Examples

Verified patterns from the existing codebase:

### Admin Supabase Client (from src/lib/admin-supabase.ts)
```typescript
// Source: /Users/ninomarianolai/luxurystay/src/lib/admin-supabase.ts
import { createClient } from "@supabase/supabase-js";

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### Fetch Property by ID (target pattern)
```typescript
// Source: adapted from /Users/ninomarianolai/luxurystay/src/app/dashboard/property/[id]/page.tsx
const { data: property } = await adminClient
  .from('properties')
  .select('title, description, address, lat, lng, price, category, space_type, guests, bedrooms, beds, bathrooms, amenities, cancellation_policy')
  .eq('id', propertyId)
  .single()
// Returns null if not found — handle gracefully
```

### Existing System Prompt Construction (from route.ts)
```typescript
// Source: /Users/ninomarianolai/luxurystay/src/app/api/chat/route.ts
const systemPrompt = SYSTEM_PROMPT_BASE
  + (isAuthenticated ? AUTH_ADDITIONS : ANON_ADDITIONS)
// Phase 4 adds: + propertyContextBlock
```

### Test Pattern for Supabase Mocking (target pattern for route.test.ts)
```typescript
// Pattern: mock getAdminSupabase in vitest
vi.mock('@/lib/admin-supabase', () => ({
  getAdminSupabase: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          title: 'Villa Roma',
          address: 'Via Appia 1, Roma',
          amenities: ['wifi', 'piscina', 'parcheggio'],
          cancellation_policy: 'flessibile',
          // ...
        },
        error: null,
      }),
    }),
  }),
}))
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vector store / RAG for property data | Direct system prompt injection (decided at project init) | Project kickoff | Simpler, faster, no vector infra; fine for single-property context per request |
| `toDataStreamResponse()` | `toUIMessageStreamResponse()` | Phase 1 (decision locked) | Required for `useChat` hook compatibility |
| `request.ip` for client IP | `ipAddress()` from `@vercel/functions` | Phase 2 (decision locked) | Next.js 15 removed `request.ip` |

**Deprecated/outdated:**
- `toDataStreamResponse()`: Use `toUIMessageStreamResponse()` — locked decision from Phase 1
- Function-scope `Ratelimit` instances: Use module-scope — locked decision from Phase 2

---

## Open Questions

1. **Check-in/check-out time columns do not exist in the schema**
   - What we know: The `properties` table has no `checkin_time` or `checkout_time` columns. The booking-level `check_in`/`check_out` are guest-specific dates, not property-level time-of-day.
   - What's unclear: Should the schema be extended with `checkin_time`/`checkout_time` columns? Or should FAQ-01 be fulfilled by instructing the chatbot to acknowledge the gap?
   - Recommendation: **Add `checkin_time` and `checkout_time` columns to the `properties` table as part of Phase 4.** These are core FAQ data (FAQ-01 is explicit about "exact time stored in Supabase"). Without them, FAQ-01 CANNOT be satisfied. This requires a Supabase migration. Alternatively, if adding columns is out of scope, the phase can fulfill FAQ-01 partially with "check-in/check-out time is not available for this property."

2. **House rules column does not exist in the schema**
   - What we know: The `properties` table has no `house_rules` column. `cancellation_policy` exists and is the closest proxy.
   - What's unclear: Should `house_rules` (a text field) be added? Or is `cancellation_policy` sufficient for FAQ-03?
   - Recommendation: **Add `house_rules` text column to the `properties` table.** FAQ-03 explicitly requires "exact rules from the property record." Without the column, FAQ-03 cannot be satisfied. The column can be nullable — the chatbot will acknowledge when it's not filled.

3. **How does the client know the propertyId to send?**
   - What we know: In Phase 4, there is no chat UI yet (that's Phase 7+). Testing will be via curl or unit tests. The propertyId needs to come from somewhere.
   - What's unclear: Is Phase 4 tested only via unit tests (mocked property), or does it require a real propertyId?
   - Recommendation: Design the API to accept `propertyId` in the body. Unit tests use mocked Supabase. Integration testing can use a known seeded property ID. The feature will be wired to the actual property page in Phase 8.

4. **Should property fetch failure (network error) block the response?**
   - What we know: Supabase calls can fail transiently.
   - Recommendation: On fetch error, log the error server-side and continue with base system prompt (no property context). Never return 500 to the client due to property fetch failure — degrade gracefully.

---

## Sources

### Primary (HIGH confidence)
- Codebase: `/Users/ninomarianolai/luxurystay/src/app/api/chat/route.ts` — current system prompt structure, auth tier pattern
- Codebase: `/Users/ninomarianolai/luxurystay/src/lib/admin-supabase.ts` — admin client pattern
- Codebase: `/Users/ninomarianolai/luxurystay/src/app/dashboard/components/add-property-flow.tsx` — confirmed `properties` table insert columns
- Codebase: `/Users/ninomarianolai/luxurystay/src/app/dashboard/property/[id]/page.tsx` — confirmed `Property` interface (all columns)
- Codebase: `/Users/ninomarianolai/luxurystay/.planning/STATE.md` — locked decisions: no RAG, system prompt injection, admin client
- Codebase: `/Users/ninomarianolai/luxurystay/vitest.config.ts` — test framework config
- Codebase: `/Users/ninomarianolai/luxurystay/src/app/api/chat/route.test.ts` — confirmed Vitest mocking pattern

### Secondary (MEDIUM confidence)
- Supabase JS docs (supabase.com/docs/reference/javascript) — `.from().select().eq().single()` query pattern; confirmed standard usage
- Vercel AI SDK docs (ai-sdk.dev) — `streamText` with `system` param accepts string concatenation

### Tertiary (LOW confidence — not verified against current docs)
- Supabase RLS behavior with service role key: assumed to bypass RLS (standard behavior), not re-verified for v2.98

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, confirmed versions
- Schema: HIGH — derived from actual TypeScript interface and insert statement in codebase
- Architecture: HIGH — derived from existing route.ts patterns and STATE.md locked decisions
- Missing schema fields: HIGH — confirmed by absence in insert statement and Property interface
- Pitfalls: HIGH — derived from code analysis and prior phase learnings in STATE.md

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days — stable stack, no external dependencies added)
