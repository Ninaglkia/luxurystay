# Phase 6: Concierge Recommendations - Research

**Researched:** 2026-03-03
**Domain:** LLM system prompt engineering for location-aware recommendations (no external API)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONC-01 | User can ask for restaurant recommendations near the property | System prompt with address, city, lat/lng + Claude Haiku 4.5 training data (reliable through Feb 2025) + concierge context block pattern established in Phase 4 |
| CONC-02 | User can ask about transport options (taxi, car rental, how to arrive) | Same system prompt pattern — transport/transit knowledge well-represented in LLM training data for Italian destinations |
| CONC-03 | User can ask about local activities (beaches, excursions, museums) | Same system prompt pattern — tourist attraction knowledge well-represented, especially for Italian luxury destinations |
| CONC-04 | Chatbot provides contextually relevant suggestions based on property location | `buildConciergeContext()` pure function serializes address + lat/lng + category/area context into system prompt block — wired in route.ts alongside existing property context |
</phase_requirements>

---

## Summary

Phase 6 adds location-aware concierge recommendations to the chatbot. The central architectural question — Google Places API vs. system prompt engineering — has a clear answer for this project's constraints: **use system prompt engineering exclusively.** The property record already contains address, latitude, longitude, and property category (from Phase 4's `PropertyRecord`). These fields, injected into the system prompt, give Claude Haiku 4.5 enough geographic grounding to produce specific, named recommendations for restaurants, transport, and local activities.

Claude Haiku 4.5 has a reliable knowledge cutoff of February 2025 (training data through July 2025). For an Italian luxury vacation rental platform, the model carries substantial training data about major Italian cities, tourist destinations, coastal resorts, and hill towns. This is sufficient for the "specificity" requirement in CONC-04 (names, general distance) without live API calls. The tradeoff is that individual restaurant-level data can be stale or occasionally hallucinated — this is acceptable because: (1) the system prompt pattern already enforces a "do not invent specific facts" instruction, (2) recommendations are framed as "suggestions to explore" not guaranteed live data, and (3) the alternative (Google Places API) introduces API keys, billing, new infrastructure, and significant added complexity.

The implementation pattern mirrors Phase 4 and 5 exactly: a new pure function `buildConciergeContext(property)` serializes location data into a structured prompt block, wired into `route.ts` alongside the existing `propertyContextBlock`. No new libraries, no new Supabase queries, no external API calls. One new file, one small addition to route.ts.

**Primary recommendation:** Implement Phase 6 entirely through system prompt engineering — add a `buildConciergeContext()` pure function that serializes the property's address, coordinates, city/area, and property category into a concierge guidance block, then inject it into the system prompt in route.ts.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | 6.0.108 (installed) | `streamText` — already in use | Already the project's streaming foundation; no change needed |
| `@ai-sdk/anthropic` | 3.0.53 (installed) | Claude Haiku 4.5 provider | Already in use; Haiku 4.5 is the current production model |

### No New Dependencies

This phase requires **zero new npm packages.** The entire implementation is:
- A new pure TypeScript function (`buildConciergeContext`)
- An addition to the existing system prompt assembly in `route.ts`
- Vitest tests for the pure function (following established TDD pattern)

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| System prompt engineering | Google Places API | Places API provides live, verified data (ratings, hours, reviews) but requires API key management, billing setup, per-request cost (~$0.017/request), and a fetch layer in route.ts. For a luxury concierge suggesting "places to explore," LLM knowledge is sufficient and the simpler path. |
| System prompt engineering | Foursquare / Yelp Fusion API | Same tradeoffs as Google Places — adds API infrastructure for marginal accuracy gain at this phase scope |
| Claude Haiku 4.5 | Claude Sonnet 4.6 | Sonnet 4.6 has richer knowledge (training through Jan 2026) but costs 3x more per token. Haiku 4.5 (reliable through Feb 2025) is sufficient for Italian destination knowledge. |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/app/api/chat/
├── property-context.ts        # Phase 4 — property FAQ serializer (exists)
├── property-context.test.ts   # Phase 4 — TDD tests (exists)
├── booking-context.ts         # Phase 5 — booking serializer (exists)
├── booking-context.test.ts    # Phase 5 — TDD tests (exists)
├── concierge-context.ts       # Phase 6 — NEW: concierge serializer
├── concierge-context.test.ts  # Phase 6 — NEW: TDD tests (written first)
└── route.ts                   # Wire concierge block into system prompt
```

### Pattern 1: Pure Serializer Function (Established Project Pattern)

**What:** A pure function that takes a subset of `PropertyRecord` fields and produces a structured string block for injection into the system prompt. Zero side effects, zero Supabase calls, zero external API calls.

**When to use:** Always — this is the established Phase 4/5 pattern. Pure functions are trivially testable, have no async complexity, and degrade gracefully when fields are null.

**Example:**
```typescript
// src/app/api/chat/concierge-context.ts
// Mirrors the structure of property-context.ts and booking-context.ts

import { PropertyRecord } from './property-context'

/**
 * Serializes property location data into a concierge guidance block
 * for injection into the AI system prompt.
 *
 * - Pure function: no Supabase calls, no external API calls, no side effects
 * - Only uses location fields: address, lat, lng, category, title
 * - Instructs the AI to draw on its training knowledge for the area
 * - Appends framing instruction ("suggestions to explore, not guaranteed facts")
 */
export function buildConciergeContext(property: PropertyRecord): string {
  const lines: string[] = [
    'CONCIERGE CONTEXT (location-aware recommendations):',
  ]

  // Address gives the city/region — the most useful grounding signal
  if (property.address) {
    lines.push(`Property address: ${property.address}`)
  }

  // Coordinates allow precise distance reasoning
  if (property.lat != null && property.lng != null) {
    lines.push(`Coordinates: ${property.lat}, ${property.lng}`)
  }

  // Category helps tailor recommendations (villa vs. apartment vs. beach house)
  if (property.category) {
    lines.push(`Property type: ${property.category}`)
  }

  lines.push('')
  lines.push(
    'Based on the property location above, you may recommend nearby restaurants, ' +
    'transport options (taxi, trains, car rental, ferries where applicable), ' +
    'and local activities (beaches, excursions, museums, local markets, etc.).'
  )
  lines.push(
    'Draw on your knowledge of this area. Provide specific names when you know them. ' +
    'Frame all recommendations as suggestions to explore — not guaranteed current facts ' +
    '(hours, prices, and availability may have changed). ' +
    'For restaurants: mention the general area/neighborhood and type of cuisine. ' +
    'For transport: mention the most practical options for reaching the property and exploring the region. ' +
    'For activities: mention what the area is known for and specific well-known attractions.'
  )

  if (!property.address && property.lat == null) {
    lines.push(
      'Location data is not available for this property — acknowledge this if asked ' +
      'for local recommendations and suggest the guest contact the host directly.'
    )
  }

  return lines.join('\n')
}
```

### Pattern 2: System Prompt Assembly in route.ts

**What:** The concierge context block is assembled alongside the existing property context block and injected into the system prompt. No new fetch calls required — the property data is already fetched in route.ts.

**When to use:** The concierge block is built from the same `property` object already fetched from Supabase. It's built in the same `if (property)` branch.

**Example:**
```typescript
// In route.ts — inside the existing `if (property)` branch:
if (property) {
  propertyContextBlock = '\n\n' + buildPropertyContext(property as PropertyRecord)
  // NEW: Add concierge context using the same property object (no extra fetch)
  propertyContextBlock += '\n\n' + buildConciergeContext(property as PropertyRecord)
}
```

The final system prompt assembly remains unchanged:
```typescript
const systemPrompt =
  SYSTEM_PROMPT_BASE +
  (isAuthenticated ? AUTH_ADDITIONS : ANON_ADDITIONS) +
  propertyContextBlock +      // now includes concierge block
  bookingContextBlock
```

### Pattern 3: TDD Test Structure (Established Project Pattern)

**What:** Tests written before implementation. Each test covers a specific serialization behavior, null field handling, and the framing instruction.

**Example:**
```typescript
// src/app/api/chat/concierge-context.test.ts
import { describe, it, expect } from 'vitest'
import { buildConciergeContext } from './concierge-context'
import { PropertyRecord } from './property-context'

function makeFullProperty(overrides?: Partial<PropertyRecord>): PropertyRecord {
  return {
    title: 'Villa Amalfi',
    description: null,
    address: 'Via Marina Grande 12, Amalfi, SA',
    lat: 40.6342,
    lng: 14.6026,
    price: 500,
    category: 'villa',
    space_type: 'entire_place',
    guests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    amenities: ['wifi', 'piscina'],
    cancellation_policy: 'moderata',
    checkin_time: '15:00',
    checkout_time: '11:00',
    house_rules: null,
    ...overrides,
  }
}

describe('buildConciergeContext', () => {
  it('includes CONCIERGE CONTEXT header', () => {
    const result = buildConciergeContext(makeFullProperty())
    expect(result).toContain('CONCIERGE CONTEXT')
  })

  it('includes address when present', () => {
    const result = buildConciergeContext(makeFullProperty())
    expect(result).toContain('Via Marina Grande 12, Amalfi, SA')
  })

  it('includes coordinates when both lat and lng are present', () => {
    const result = buildConciergeContext(makeFullProperty())
    expect(result).toContain('40.6342')
    expect(result).toContain('14.6026')
  })

  it('omits coordinates when lat is null', () => {
    const result = buildConciergeContext(makeFullProperty({ lat: null }))
    expect(result).not.toContain('Coordinates')
  })

  it('includes property category when present', () => {
    const result = buildConciergeContext(makeFullProperty({ category: 'villa' }))
    expect(result).toContain('villa')
  })

  it('includes the recommendation framing instruction', () => {
    const result = buildConciergeContext(makeFullProperty())
    expect(result).toContain('suggestions to explore')
  })

  it('includes guidance for restaurants, transport, activities', () => {
    const result = buildConciergeContext(makeFullProperty())
    expect(result).toContain('restaurants')
    expect(result).toContain('transport')
    expect(result).toContain('activities')
  })

  it('acknowledges missing location when both address and lat are null', () => {
    const result = buildConciergeContext(makeFullProperty({ address: null, lat: null, lng: null }))
    expect(result).toContain('Location data is not available')
  })

  it('does not crash on fully null property', () => {
    const minimal: PropertyRecord = {
      title: null, description: null, address: null, lat: null, lng: null,
      price: null, category: null, space_type: null, guests: null,
      bedrooms: null, beds: null, bathrooms: null, amenities: null,
      cancellation_policy: null, checkin_time: null, checkout_time: null, house_rules: null,
    }
    expect(() => buildConciergeContext(minimal)).not.toThrow()
  })
})
```

### Anti-Patterns to Avoid

- **Fetching from Google Places API inside route.ts**: Adds latency, API key surface area, billing, and error handling complexity. Not needed for this requirement scope.
- **Adding a new Supabase query for location data**: Location data is already in the `property` object fetched by the existing query in route.ts. Do not add a second fetch.
- **Making `buildConciergeContext` async**: It must be a pure synchronous function, matching `buildPropertyContext` and `buildBookingContext`. No I/O in the serializer.
- **Injecting concierge block outside the `if (property)` branch**: The concierge block only makes sense when a property is known. Without a property, there's no location data.
- **Asserting facts without the "suggestions to explore" framing**: The model's training data may be slightly stale. The framing instruction protects against the chatbot presenting outdated business info as guaranteed current facts.
- **Using a separate concierge system prompt instead of a block**: The established pattern appends blocks to a single system prompt. Maintain this pattern for consistency.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured recommendation output | Custom JSON schema + parser for places | Plain-text system prompt instructions | The AI's text output IS the recommendation — no need to parse or structure it for display |
| Location geocoding | Custom geocoding from address to city | Address field already contains city/region as text | The `address` field (e.g., "Via Roma 1, Amalfi, SA") already gives the model the city context it needs |
| Freshness checking | Logic to detect if restaurant data is stale | Framing instruction in prompt ("suggestions to explore, not guaranteed facts") | Prompt-level framing is sufficient; user expectation management is the correct layer |
| Category-to-area mapping | Lookup table mapping property category to recommendation style | Direct injection of `category` field with instruction text | The model already understands "villa in Amalfi" implies coastal luxury; no mapping needed |

**Key insight:** The LLM is both the knowledge base AND the recommendation engine. The only engineering needed is the correct context injection — everything else is handled by the model's training.

---

## Common Pitfalls

### Pitfall 1: Over-specifying location format in the prompt

**What goes wrong:** Injecting `Coordinates: 40.6342, 14.6026` without also injecting the human-readable address causes the model to reason well about geographic proximity but produce awkward outputs ("near coordinate 40.6"). The model needs the named location to produce named recommendations.

**Why it happens:** Developers assume lat/lng is the definitive location signal for AI, but the model's restaurant knowledge is indexed by city/region name, not coordinates.

**How to avoid:** Always inject BOTH address (for named-location grounding) AND coordinates (for distance reasoning). The address is the primary signal; coordinates are supplementary.

**Warning signs:** Model outputs responses like "near your coordinates" instead of "near Amalfi" — indicates missing address field.

---

### Pitfall 2: Missing "suggestions to explore" framing leads to hallucinated facts

**What goes wrong:** Without explicit framing, Claude may state specific restaurant hours, prices, or phone numbers with false confidence. Users who rely on this data and find it wrong will lose trust in the chatbot.

**Why it happens:** Claude's training data includes restaurant listings that may have changed since the training cutoff (Feb 2025 reliable). The model doesn't know which data is stale.

**How to avoid:** Always include the framing instruction: "Frame all recommendations as suggestions to explore — not guaranteed current facts (hours, prices, and availability may have changed)." This is in the `buildConciergeContext()` template above.

**Warning signs:** Review AI responses for specific hours ("open until 22:00") or prices ("€25 per person") — if present without framing, the prompt instruction is missing.

---

### Pitfall 3: Building concierge block when no property is loaded

**What goes wrong:** If `buildConciergeContext()` is called outside the `if (property)` branch, it receives a null-heavy PropertyRecord and produces a block that says "Location data is not available" — but this block still gets injected and occupies token budget for no benefit.

**Why it happens:** Developer adds the concierge block at the top of route.ts before the property fetch logic.

**How to avoid:** The concierge block MUST be built inside `if (property)`, after the property is confirmed non-null. Only a confirmed property record contains real location data.

**Warning signs:** Concierge block appears in system prompt even when no `propertyId` is sent in the request body.

---

### Pitfall 4: Token budget violation from large concierge block

**What goes wrong:** The system prompt grows with each phase. The concierge block adds approximately 100-150 tokens. The existing `maxOutputTokens: 500` cap is on output, not input. However, if the total system prompt grows too large it erodes the 200K context window budget.

**Why it happens:** Each phase adds a context block; without tracking, the cumulative prompt can become very long.

**How to avoid:** The concierge block in this phase is deliberately short — 5-8 lines. The instruction text is a fixed overhead (~100 tokens). This is well within budget. Do NOT add verbose examples or extensive lists to the concierge block.

**Warning signs:** Total system prompt exceeds ~2000 tokens — use `console.log(systemPrompt.length)` in dev to check.

---

### Pitfall 5: Testing route.ts integration instead of pure function

**What goes wrong:** Writing integration tests for the concierge feature in route.test.ts instead of unit tests in concierge-context.test.ts creates tests that mock Supabase, the AI SDK, and HTTP — expensive and brittle.

**Why it happens:** Developer wants to verify end-to-end behavior.

**How to avoid:** Follow Phase 4/5 pattern: unit test the pure `buildConciergeContext()` function exhaustively in `concierge-context.test.ts`. The route.ts integration is mechanically simple (one function call, one string concatenation) and does not require its own test suite for Phase 6.

**Warning signs:** Test file imports from Supabase or AI SDK — wrong level of abstraction.

---

## Code Examples

### Complete buildConciergeContext() Implementation

```typescript
// Source: project pattern from property-context.ts (Phase 4)
// src/app/api/chat/concierge-context.ts

import { PropertyRecord } from './property-context'

export function buildConciergeContext(property: PropertyRecord): string {
  const lines: string[] = [
    'CONCIERGE CONTEXT (location-aware recommendations):',
  ]

  if (property.address) {
    lines.push(`Property address: ${property.address}`)
  }

  if (property.lat != null && property.lng != null) {
    lines.push(`Coordinates: ${property.lat}, ${property.lng}`)
  }

  if (property.category) {
    lines.push(`Property type: ${property.category}`)
  }

  lines.push('')
  lines.push(
    'Based on the property location above, you may recommend nearby restaurants, ' +
    'transport options (taxi, trains, car rental, ferries where applicable), ' +
    'and local activities (beaches, excursions, museums, local markets, etc.).'
  )
  lines.push(
    'Draw on your knowledge of this area. Provide specific names when you know them. ' +
    'Frame all recommendations as suggestions to explore — not guaranteed current facts ' +
    '(hours, prices, and availability may have changed). ' +
    'For restaurants: mention the general area/neighborhood and type of cuisine. ' +
    'For transport: mention the most practical options for reaching the property and exploring the region. ' +
    'For activities: mention what the area is known for and specific well-known attractions.'
  )

  if (!property.address && property.lat == null) {
    lines.push(
      'Location data is not available for this property — acknowledge this if asked ' +
      'for local recommendations and suggest the guest contact the host directly.'
    )
  }

  return lines.join('\n')
}
```

### route.ts Wiring (minimal change)

```typescript
// Source: existing route.ts pattern (Phase 4/5 established)
// In route.ts — add import and one line inside if (property) branch

import { buildConciergeContext } from './concierge-context'  // NEW IMPORT

// Inside the existing if (property) branch — after buildPropertyContext:
if (property) {
  propertyContextBlock = '\n\n' + buildPropertyContext(property as PropertyRecord)
  propertyContextBlock += '\n\n' + buildConciergeContext(property as PropertyRecord)  // NEW LINE
}
```

### Vitest Test Run Commands

```bash
# Unit tests for the new pure function only (fast, no mocks needed)
npx vitest run src/app/api/chat/concierge-context.test.ts

# Full test suite
npx vitest run
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External Places API for recommendations | LLM training knowledge + location context injection | 2023-2025 (LLM capability maturation) | For hospitality recommendations, LLM-grounded prompts are sufficient and eliminate API infrastructure |
| claude-3-haiku-20240307 | claude-haiku-4-5 (api alias: claude-haiku-4-5) | Released 2025, deprecated old Haiku April 2026 | Project already uses correct alias; no change needed for Phase 6 |
| Separate context fetch per feature | Single property fetch reused across context blocks | Phase 4 established | Route.ts fetches property once; all context builders receive the same object |

**Deprecated/outdated:**
- `claude-3-haiku-20240307`: Deprecated by Anthropic, retirement April 19, 2026. Project already uses `claude-haiku-4-5` alias — no action needed.
- Google Places API "new" vs "legacy": The "Places API (New)" launched 2023 with per-field billing. Irrelevant for Phase 6 since we are not using Places API at all.

---

## Open Questions

1. **Should anonymous users receive concierge recommendations, or only authenticated users?**
   - What we know: `AUTH-01` explicitly states "anonymous users receive base responses (general property info, concierge)" — concierge is in scope for anonymous users.
   - What's clear: The concierge block goes into `propertyContextBlock`, which is built before the auth tier check. It applies to all users when a property is loaded.
   - Recommendation: No special auth gating needed. The concierge block is injected for all users when a property ID is present.

2. **What happens when the property is outside Italy (future international properties)?**
   - What we know: The codebase has Italian amenity labels and Italian cancellation policy text — clearly Italian-first. Claude Haiku 4.5 has broad international knowledge.
   - What's unclear: Whether the concierge context framing needs localization hints.
   - Recommendation: The current design is location-agnostic. The model will adapt its recommendations based on the address regardless of country. No special handling needed for Phase 6.

3. **Token budget: how large does the system prompt get with all blocks?**
   - What we know: SYSTEM_PROMPT_BASE (~200 tokens) + auth additions (~100 tokens) + property context (~300 tokens) + concierge block (~150 tokens) + booking context (~400 tokens for authenticated users) = ~1150 tokens total.
   - What's clear: Well within the 200K context window. No concern.
   - Recommendation: No action needed, but log system prompt length in development for tracking.

---

## Sources

### Primary (HIGH confidence)
- Official Anthropic model docs (https://platform.claude.com/docs/en/about-claude/models/overview) — Claude Haiku 4.5 reliable knowledge cutoff Feb 2025, training cutoff Jul 2025; `claude-haiku-4-5` is the correct alias
- Project source code (`property-context.ts`, `booking-context.ts`, `route.ts`) — confirmed pure-function pattern, PropertyRecord interface, system prompt assembly approach, existing Supabase fetch structure
- `package.json` — confirmed: ai@6.0.108, @ai-sdk/anthropic@3.0.53, vitest@4.0.18 installed

### Secondary (MEDIUM confidence)
- WebSearch: Google Places API vs. LLM for recommendations — multiple sources confirm that LLM-grounded recommendations are an accepted industry pattern for hospitality (coaxsoft.com, medium.com/@paulotaylor); hybrid approach (LLM + Places API) exists but is overkill for this project's scope
- Anthropic deprecation notice: `claude-3-haiku-20240307` deprecated April 2026 — confirmed in official model docs

### Tertiary (LOW confidence)
- Implicit claim: Claude Haiku 4.5 has sufficient knowledge of Italian destinations for named restaurant/activity recommendations — plausible given training data scope, but not directly verified with a live query. The "suggestions to explore" framing in the prompt mitigates any risk.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all existing infrastructure reused
- Architecture: HIGH — directly mirrors Phase 4/5 established patterns, verified in codebase
- Pitfalls: HIGH — derived from examining the actual code and the implications of the LLM knowledge cutoff
- Key recommendation (no Places API): HIGH — confirmed by requirements scope, project constraints, and AUTH-01 which already scopes concierge to anonymous users

**Research date:** 2026-03-03
**Valid until:** 2026-06-03 (stable domain — system prompt patterns and Claude Haiku 4.5 API are stable; Google Places API pricing/availability irrelevant since we are not using it)
