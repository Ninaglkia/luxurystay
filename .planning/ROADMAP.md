# Roadmap: LuxuryStay AI Concierge

## Overview

This roadmap adds a full AI concierge chatbot to an existing LuxuryStay platform (Next.js 16 + Supabase + Stripe). The work is entirely additive — no rewrites. Phases flow from the security perimeter inward: API infrastructure first, then data integration layers, then UI surfaces. Every phase delivers a coherent, independently verifiable capability. The chatbot serves two user tiers (anonymous and authenticated) and must be grounded exclusively in real Supabase data.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: AI API Foundation** - Secure streaming `/api/chat` Route Handler with Anthropic provider, no UI (completed 2026-03-03)
- [ ] **Phase 2: Security Hardening** - Rate limiting, prompt injection protection, and anonymous data boundary
- [ ] **Phase 3: Access Control** - Server-side auth tier detection and middleware route permissions
- [ ] **Phase 4: Property FAQ Integration** - Supabase property context injected into system prompt for grounded FAQ answers
- [ ] **Phase 5: Booking Support** - Auth-gated booking status, payment info, and cancellation policy queries
- [ ] **Phase 6: Concierge Recommendations** - Location-aware restaurant, transport, and local experience suggestions
- [ ] **Phase 7: Chat Persona and UX Behaviors** - Luxury persona, streaming UX, suggested chips, graceful fallback, session history
- [ ] **Phase 8: Chat Bubble Widget** - Lazy-loaded floating bubble present on all pages
- [ ] **Phase 9: Dedicated Chat Page** - Full-screen `/chat` page with optimized conversation layout

## Phase Details

### Phase 1: AI API Foundation
**Goal**: A working, streaming AI endpoint exists that accepts messages and returns streamed responses — testable with curl, with no UI and no user-facing surface
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-04
**Success Criteria** (what must be TRUE):
  1. A POST to `/api/chat` with a messages array returns a streaming text response
  2. The `ANTHROPIC_API_KEY` is never accessible from client code or browser network tab
  3. The response streams progressively (characters arrive over time, not all at once)
  4. The endpoint respects Vercel function timeout limits (streaming configured with correct `maxDuration` and runtime exports)
**Plans**: 1 plan

Plans:
- [~] 01-01-PLAN.md — Install AI SDK packages and create streaming /api/chat Route Handler (automated tasks done, awaiting human verify checkpoint)

### Phase 2: Security Hardening
**Goal**: Anonymous users cannot abuse the endpoint to generate runaway costs, and user input cannot manipulate the system prompt
**Depends on**: Phase 1
**Requirements**: SEC-02, SEC-03, SEC-05
**Success Criteria** (what must be TRUE):
  1. An anonymous user sending more than the configured message limit receives a rate-limit error response, not an AI response
  2. A user sending a prompt-injection attempt (e.g., "ignore previous instructions") receives a normal refusal, not a compromised response
  3. An anonymous user asking for booking details, payment amounts, or personal user data receives no such data in the response
  4. The `max_tokens` ceiling is enforced on every AI call, preventing unbounded token consumption
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Install @upstash/ratelimit, migrate middleware.ts to proxy.ts with rate limiting (15/min anon, 30/min auth)
- [ ] 02-02-PLAN.md — Add prompt injection detection and differentiated system prompt by auth tier in route.ts

### Phase 3: Access Control
**Goal**: The server reliably distinguishes anonymous from authenticated users, and the middleware permits the correct routes without breaking existing auth
**Depends on**: Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. An anonymous visitor can reach `/chat` and `/api/chat` without being redirected to login
  2. An authenticated user's session is detected server-side and their tier is elevated to full access
  3. Auth tier is never determined by a value sent from the client — tampering a client request does not elevate access
  4. Existing authenticated routes (dashboard, booking) continue to require login as before
**Plans**: TBD

### Phase 4: Property FAQ Integration
**Goal**: The chatbot answers property-specific factual questions using only real data fetched from Supabase — no hallucinated answers
**Depends on**: Phase 3
**Requirements**: FAQ-01, FAQ-02, FAQ-03, FAQ-04, FAQ-05
**Success Criteria** (what must be TRUE):
  1. A user asking about check-in or check-out time receives the exact time stored in Supabase for that property, not a generic answer
  2. A user asking about available amenities (WiFi, pool, parking) receives a list matching what is stored in Supabase for that property
  3. A user asking about house rules receives the exact rules from the property record
  4. A user asking for directions or location receives address and location info from the property record
  5. When a property field is null or missing, the chatbot says it does not have that information rather than inventing a plausible answer
**Plans**: TBD

### Phase 5: Booking Support
**Goal**: Authenticated users can ask the chatbot about their booking status, payments, and cancellation options and receive accurate, personalized answers
**Depends on**: Phase 4
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05
**Success Criteria** (what must be TRUE):
  1. A logged-in user asking "what is my booking status?" receives their actual booking dates and status from the database
  2. A logged-in user asking about payments receives the correct deposit paid and outstanding balance for their booking
  3. A user asking about the cancellation policy receives the policy specific to that property
  4. A user asking how to modify or cancel their booking receives a response with a direct link to the relevant page, not a description of how to find it
  5. A user asking whether a property is available for specific dates receives a meaningful answer based on current availability data
**Plans**: TBD

### Phase 6: Concierge Recommendations
**Goal**: The chatbot provides contextually relevant local recommendations (restaurants, transport, activities) based on the property's geographic location
**Depends on**: Phase 4
**Requirements**: CONC-01, CONC-02, CONC-03, CONC-04
**Success Criteria** (what must be TRUE):
  1. A user asking for restaurant recommendations receives suggestions that are geographically near the property, not generic Italy recommendations
  2. A user asking how to get to the property receives transport options (taxi, public transit, car rental) appropriate to the property's location
  3. A user asking about local activities receives experience suggestions (beaches, excursions, museums) relevant to the property's area
  4. Recommendations include enough specificity (names, general distance) to be immediately useful, not vague category lists
**Plans**: TBD

### Phase 7: Chat Persona and UX Behaviors
**Goal**: The chatbot feels like a premium concierge service — a consistent luxury persona, streaming responses, guided conversation, graceful fallback, and session-persistent history
**Depends on**: Phase 4
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05
**Success Criteria** (what must be TRUE):
  1. The chatbot's tone across all responses is consistent with a high-end hospitality brand (formal, warm, never robotic or terse)
  2. At the start of a conversation, suggested question chips appear that guide the user toward common useful queries
  3. When the chatbot cannot answer a question, it explicitly says so and directs the user to contact the host or support — it never fabricates a guess
  4. AI responses appear character-by-character as they are generated, not delivered all at once after a delay
  5. A user who sends several messages, scrolls up, and scrolls back down still sees the full conversation history for that browser session
**Plans**: TBD

### Phase 8: Chat Bubble Widget
**Goal**: A floating chat button is visible on every page of the platform and opens a functional chat overlay without impacting page load performance
**Depends on**: Phase 7
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. A bubble icon is visible in the bottom-right corner of every page including the homepage, listing pages, and dashboard
  2. Clicking the bubble opens a chat overlay where the user can type and receive responses
  3. The bubble component does not appear in the initial page HTML — it is loaded lazily and does not delay first contentful paint
  4. The bubble chat overlay is fully usable on a mobile phone screen (inputs reachable, messages readable, no overflow)
  5. A user who closes the bubble and reopens it without navigating away sees their previous messages still present
**Plans**: TBD

### Phase 9: Dedicated Chat Page
**Goal**: A full-screen `/chat` page exists where users can have extended conversations with the concierge in an optimized layout
**Depends on**: Phase 8
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):
  1. Navigating to `/chat` renders a full-screen chat interface without the floating bubble overlapping it
  2. Both anonymous visitors and logged-in users can access `/chat` without being redirected
  3. As a long conversation accumulates, the message list automatically scrolls to show the latest message
  4. A user can send a message by pressing Enter on desktop or tapping the send button on mobile, and both behave identically
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. AI API Foundation | 1/1 | Complete   | 2026-03-03 |
| 2. Security Hardening | 0/2 | Not started | - |
| 3. Access Control | 0/TBD | Not started | - |
| 4. Property FAQ Integration | 0/TBD | Not started | - |
| 5. Booking Support | 0/TBD | Not started | - |
| 6. Concierge Recommendations | 0/TBD | Not started | - |
| 7. Chat Persona and UX Behaviors | 0/TBD | Not started | - |
| 8. Chat Bubble Widget | 0/TBD | Not started | - |
| 9. Dedicated Chat Page | 0/TBD | Not started | - |
