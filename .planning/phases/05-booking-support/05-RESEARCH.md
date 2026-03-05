# Phase 05: Booking Support - Research

**Researched:** 2026-03-03
**Domain:** Supabase booking data injection into AI system prompt (server-side, auth-gated)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BOOK-01 | Logged-in user can ask about their booking status | Fetch `bookings` row by `guest_id` = userId; inject status, check_in, check_out, guests into system prompt |
| BOOK-02 | Logged-in user can ask about payments (deposit paid, outstanding balance) | Query `payments` table by `booking_id`; surface `amount_cents`, `amount_captured_cents`, `status`, `type`; derive outstanding from `balance_amount` on booking row |
| BOOK-03 | User can ask about the property cancellation policy | `cancellation_policy` already in `PropertyRecord` / `buildPropertyContext` — needs surfacing for authenticated query path too; existing `getCancellationPolicyDescription()` has all text |
| BOOK-04 | User can ask how to modify or cancel their booking (with direct link) | Bot must emit `/dashboard/bookings/{id}` direct URL — data needed: booking id; no new API required |
| BOOK-05 | User can ask about availability for specific dates | Query `bookings` server-side with `.in("status", ["pending", "confirmed"])` and date overlap; return yes/no with next available window |
</phase_requirements>

---

## Summary

Phase 5 extends the existing `/api/chat` Route Handler so that authenticated users receive booking-specific context injected into the AI system prompt — mirroring exactly how property FAQ context was added in Phase 4. The mechanism is already proven: fetch data server-side using `getAdminSupabase()`, serialize it into a structured text block, and append it to the system prompt. No new architecture is needed; only new data-fetching and serialization logic.

The key design constraint from SEC-05 (already implemented) is that booking data may only reach the system prompt when `x-user-id` is present (i.e., `isAuthenticated === true`). The proxy strips any client-forged `x-user-id` header and only sets it for genuinely authenticated sessions, so the auth gate is already in place. Phase 5 simply populates the `AUTH_ADDITIONS` section of the prompt with real data instead of generic permission text.

Cancellation policy (BOOK-03) is already partially handled by `buildPropertyContext()` — it includes `cancellation_policy` text from the property record. For authenticated users this is reinforced with booking-specific policy data from the `bookings.cancellation_policy` column. BOOK-04 (direct link) requires the bot to know the booking UUID so it can emit `/dashboard/bookings/{booking_id}`. BOOK-05 (availability) requires a server-side overlap query against the `bookings` table using the `status` filter already used by the property listing page.

**Primary recommendation:** Add a `buildBookingContext()` pure function (matching the pattern of `buildPropertyContext`) that serializes a booking + payments array into a system-prompt block, then wire it into `route.ts` behind the `isAuthenticated` guard using `getAdminSupabase()`.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | `^2.98.0` | Supabase client for DB queries | Already used in route.ts via `getAdminSupabase()` |
| `ai` (Vercel AI SDK) | `^6.0.108` | `streamText`, `convertToModelMessages` | Already wired in route.ts |
| `@ai-sdk/anthropic` | `^3.0.53` | Claude Haiku 4.5 provider | Already wired |
| `vitest` | `^4.0.18` | Test framework | Already configured, ESM-native |

### No new packages required

This phase adds zero new npm dependencies. All data access goes through the existing `getAdminSupabase()` pattern. All tests use the existing Vitest setup (config: `vitest.config.ts`, run: `npx vitest run`).

**Installation:**
```bash
# Nothing to install
```

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/app/api/chat/
├── route.ts                   # MODIFIED: add booking context injection
├── property-context.ts        # EXISTING: unchanged
├── property-context.test.ts   # EXISTING: unchanged
├── booking-context.ts         # NEW: pure booking context serializer
└── booking-context.test.ts    # NEW: TDD tests for booking context
```

### Pattern 1: Pure Context Serializer (mirrors Phase 4 pattern)

**What:** A pure function `buildBookingContext(booking, payments)` that takes typed Supabase rows and returns a string block for system prompt injection. No Supabase calls inside — testable without mocking.

**When to use:** Every authenticated request where a booking is found for the current user.

**Example:**
```typescript
// src/app/api/chat/booking-context.ts
// Source: mirrors buildPropertyContext() pattern from property-context.ts

export interface BookingRecord {
  id: string
  property_id: string
  check_in: string          // 'YYYY-MM-DD'
  check_out: string         // 'YYYY-MM-DD'
  guests: number
  total_price: number       // EUR (not cents)
  status: string            // 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | etc.
  payment_status: string
  payment_type: string      // 'full' | 'split'
  deposit_amount: number    // cents
  balance_amount: number    // cents
  cancellation_policy: string  // 'flessibile' | 'moderata' | 'rigida'
  cancelled_at: string | null
  cancelled_by: string | null  // 'guest' | 'host'
  created_at: string
}

export interface PaymentRecord {
  id: string
  type: string              // 'deposit' | 'balance' | 'full'
  amount_cents: number
  amount_captured_cents: number
  amount_refunded_cents: number
  status: string            // 'requires_payment' | 'authorized' | 'captured' | 'refunded' | 'cancelled'
  created_at: string
}

export function buildBookingContext(
  booking: BookingRecord,
  payments: PaymentRecord[]
): string {
  // Serialize booking data into structured text block
  // Omit null/irrelevant fields
  // Include direct link for modify/cancel action (BOOK-04)
  // Include payment summary (BOOK-02)
}
```

### Pattern 2: Server-Side Booking Fetch in route.ts (auth-gated)

**What:** After confirming `isAuthenticated`, query the `bookings` table by `guest_id = userId`, then optionally query `payments` by `booking_id`. Append resulting context block to system prompt after `AUTH_ADDITIONS`.

**When to use:** Every authenticated POST to `/api/chat` where the user is logged in.

**Example:**
```typescript
// In route.ts POST handler — after auth tier determination

let bookingContextBlock = ''

if (isAuthenticated && userId) {
  try {
    const adminClient = getAdminSupabase()

    // Fetch most recent active booking for this user
    const { data: booking } = await adminClient
      .from('bookings')
      .select('*')
      .eq('guest_id', userId)
      .not('status', 'in', '(cancelled,expired,completed)')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (booking) {
      // Fetch payments for this booking
      const { data: payments } = await adminClient
        .from('payments')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: true })

      bookingContextBlock = '\n\n' + buildBookingContext(
        booking as BookingRecord,
        (payments ?? []) as PaymentRecord[]
      )
    }
  } catch (err) {
    // Degrade gracefully — never fail the request
    console.error('[BOOKING] Failed to fetch booking context', { userId, err })
  }
}

// System prompt assembly — layered in order:
const systemPrompt =
  SYSTEM_PROMPT_BASE +
  AUTH_ADDITIONS +          // existing
  propertyContextBlock +    // existing (Phase 4)
  bookingContextBlock       // new (Phase 5)
```

### Pattern 3: Availability Query (BOOK-05)

**What:** Query `bookings` table server-side for a given property and date range, filtering by active statuses, to determine if dates are available.

**Critical:** The existing property listing page already does this client-side:
```typescript
// From src/app/property/[id]/page.tsx (VERIFIED)
const { data } = await supabase
  .from('bookings')
  .select('check_in, check_out')
  .eq('property_id', id)
  .in('status', ['pending', 'confirmed'])
```

For the chatbot, this must run server-side in route.ts using `getAdminSupabase()` — the userId is known (authenticated user), and the `propertyId` is already being passed in the request body.

**System prompt approach for BOOK-05:** Rather than attempting to parse user-specified dates from the message, inject current bookings for the property (as blocked date ranges) so the AI can reason about availability when the user mentions dates. This is safer than attempting NLP date extraction in the server route.

```typescript
// Availability block injected when propertyId + isAuthenticated
const { data: existingBookings } = await adminClient
  .from('bookings')
  .select('check_in, check_out')
  .eq('property_id', propertyId)
  .in('status', ['pending', 'confirmed'])

// Serialize to: "Booked periods: 2026-04-01 to 2026-04-07, 2026-05-15 to 2026-05-20"
// AI can then answer "is April 10 available?" correctly
```

### Pattern 4: Cancellation Policy (BOOK-03)

**What:** `cancellation_policy` is already in the `buildPropertyContext()` output (Phase 4). For authenticated users with an active booking, reinforce the specific booking's `cancellation_policy` field (which is snapshotted onto the booking at creation time and may differ from current property policy).

The existing `getCancellationPolicyDescription()` in `src/lib/payment-utils.ts` has all three policy descriptions in Italian. Reuse it in `buildBookingContext()`.

### Anti-Patterns to Avoid

- **Fetching booking data for anonymous users:** The `isAuthenticated` check already guards this. Never query `bookings` without confirming `userId !== null`.
- **Returning booking data in HTTP error responses:** Always succeed (200) even if DB fetch fails — degrade gracefully, never expose DB errors.
- **Selecting `*` without limiting results:** Use `.limit(1)` when fetching "current booking" to avoid injecting multiple booking records into the system prompt which would bloat tokens.
- **Fetching all bookings instead of most-recent active:** The user asks about "my booking" — always return the most recent non-cancelled booking. If multiple active bookings exist, mention count and show most recent.
- **Storing `deposit_amount` / `balance_amount` on booking row in EUR vs cents:** The `bookings` table stores `deposit_amount` and `balance_amount` in CENTS (confirmed from `payment-utils.ts` and detail page). The `total_price` column is in EUR. Use `formatCents()` from `payment-utils.ts` for display.

---

## Confirmed Bookings Table Schema

From `src/app/dashboard/bookings/[id]/page.tsx` (BookingData interface) — HIGH confidence, directly from production code:

```typescript
// bookings table columns (confirmed)
{
  id: string                    // UUID
  property_id: string           // UUID FK → properties
  guest_id: string | null       // UUID FK → auth.users (null for guest bookings)
  host_id: string               // UUID FK → auth.users
  check_in: string              // 'YYYY-MM-DD'
  check_out: string             // 'YYYY-MM-DD'
  guests: number
  total_price: number           // EUR (not cents) — NOTE: inconsistency with payments
  status: string                // 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | 'expired' | 'refunded'
  payment_status: string
  payment_type: string          // 'full' | 'split'
  deposit_amount: number        // CENTS
  balance_amount: number        // CENTS
  cancellation_policy: string   // 'flessibile' | 'moderata' | 'rigida'
  cancelled_at: string | null
  cancelled_by: string | null   // 'guest' | 'host'
  created_at: string
  // Also present (from create-payment-intent/route.ts):
  stripe_customer_id: string
  stripe_payment_intent_id: string    // full payment only
  stripe_deposit_payment_intent_id: string  // split payment only
}
```

```typescript
// payments table columns (confirmed)
{
  id: string
  booking_id: string            // UUID FK → bookings
  stripe_payment_intent_id: string
  type: string                  // 'deposit' | 'balance' | 'full'
  amount_cents: number
  amount_captured_cents: number
  amount_refunded_cents: number
  currency: string              // 'eur'
  status: string                // 'requires_payment' | 'authorized' | 'captured' | 'refunded' | 'cancelled'
  created_at: string
  captured_at: string | null
}
```

**Critical data model note:** `total_price` on bookings is in EUR (e.g., 350), while `deposit_amount`, `balance_amount` are in cents (e.g., 10500). Use `formatCents()` from `payment-utils.ts` for cents fields.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cancellation policy descriptions | Custom switch/string | `getCancellationPolicyDescription()` from `src/lib/payment-utils.ts` | Already handles all 3 policies in Italian |
| Currency formatting | `(amount / 100).toFixed(2)` inline | `formatCents()` from `src/lib/payment-utils.ts` | Handles locale formatting consistently |
| Payment status labels | Custom label map | `getPaymentStatusLabel()` from `src/lib/payment-utils.ts` | All 11 statuses mapped to Italian |
| Refund % calculation | Custom date math | `calculateRefundPercent()` from `src/lib/payment-utils.ts` | Already handles all 3 policies with correct day boundaries |
| Admin DB access | `createClient()` (cookie-based) | `getAdminSupabase()` from `src/lib/admin-supabase.ts` | Bypasses RLS — required for server-side route reading other users' data |
| Availability overlap detection | Custom date range logic | Supabase query with `.in('status', ['pending', 'confirmed'])` + serialize date ranges to system prompt | AI reasons about availability from structured data |

**Key insight:** All payment, refund, and policy logic already exists in `src/lib/payment-utils.ts`. Reuse it in `buildBookingContext()` rather than reimplementing.

---

## Common Pitfalls

### Pitfall 1: total_price vs deposit_amount Units
**What goes wrong:** `total_price` on the bookings row is in EUR (e.g., 350), but `deposit_amount` and `balance_amount` are in cents (35000 / 70000 × remaining). Using `formatCents()` on `total_price` will display 3.50 instead of 350.
**Why it happens:** Inconsistency in the data model — `total_price` was set from `total_price` in the checkout body (EUR), while deposit/balance were computed from `totalCents`.
**How to avoid:** Always check which unit each column uses. Only `deposit_amount`, `balance_amount`, and `payments.amount_cents` are in cents. `total_price` is EUR.
**Warning signs:** Suspiciously small displayed amounts (3.50 instead of 350).

### Pitfall 2: Fetching Booking Without `guest_id` Filter
**What goes wrong:** Querying `bookings` without `.eq('guest_id', userId)` could return another guest's booking if the `property_id` is the same.
**Why it happens:** Forgetting that `bookings` can contain rows for any guest.
**How to avoid:** Always filter `.eq('guest_id', userId)` when building user-specific booking context. The `userId` comes from the proxy-set `x-user-id` header — it cannot be forged.
**Warning signs:** Test that sends userId of user A and receives booking of user B.

### Pitfall 3: Blocking on Booking Fetch When No Booking Exists
**What goes wrong:** Using `.single()` raises an error when no booking is found (Supabase returns error when `.single()` matches 0 rows).
**Why it happens:** `.single()` throws on 0 or >1 matches.
**How to avoid:** Use `.limit(1)` + check `data` array instead of `.single()`, OR handle the `PGRST116` error code gracefully. Prefer: `const { data: bookings } = await ...limit(1)` then `bookings?.[0]`.
**Warning signs:** Authenticated users with no bookings get 500 errors.

### Pitfall 4: Injecting Stale Data for Cancelled Bookings
**What goes wrong:** Fetching the most recent booking regardless of status could inject data about a cancelled booking, confusing the AI into discussing a dead reservation.
**Why it happens:** Not filtering status in the query.
**How to avoid:** Exclude terminal statuses: `.not('status', 'in', '(cancelled,expired,completed,refunded)')`. If only cancelled bookings exist, inject a message saying "you have no active bookings."
**Warning signs:** User asks "what is my booking status?" and gets info about a cancelled trip.

### Pitfall 5: Leaking Booking Data to Anonymous Users
**What goes wrong:** Booking context block appended even when `!isAuthenticated`.
**Why it happens:** Forgetting the `isAuthenticated` guard when wiring context blocks.
**How to avoid:** The booking fetch and `buildBookingContext()` call must be strictly inside the `if (isAuthenticated && userId)` block. Test with no `x-user-id` header to confirm system prompt does NOT contain "BOOKING CONTEXT".
**Warning signs:** System prompt contains "BOOKING CONTEXT" in anonymous request.

### Pitfall 6: system prompt Size with Multiple Bookings
**What goes wrong:** Injecting all bookings for a user with many reservations bloats the system prompt.
**Why it happens:** `.limit()` not applied.
**How to avoid:** Always limit to the 1 most-recent active booking. If user has multiple active bookings, mention count only. Keep booking context block under ~400 tokens.
**Warning signs:** Booking context block exceeding 1000 characters.

---

## Code Examples

### Building Booking Context Block

```typescript
// src/app/api/chat/booking-context.ts
// Pattern mirrors property-context.ts exactly

import {
  getCancellationPolicyDescription,
  getPaymentStatusLabel,
  formatCents,
} from '@/lib/payment-utils'

export function buildBookingContext(
  booking: BookingRecord,
  payments: PaymentRecord[]
): string {
  const lines: string[] = [
    'BOOKING CONTEXT (user\'s active booking — use ONLY this data for booking questions):',
  ]

  lines.push(`Booking ID: ${booking.id}`)
  lines.push(`Property ID: ${booking.property_id}`)
  lines.push(`Check-in: ${booking.check_in}`)
  lines.push(`Check-out: ${booking.check_out}`)
  lines.push(`Guests: ${booking.guests}`)
  lines.push(`Total price: EUR ${booking.total_price}`)
  lines.push(`Status: ${getPaymentStatusLabel(booking.status)}`)
  lines.push(`Payment type: ${booking.payment_type === 'split' ? '2-rate (30% deposit + 70% balance)' : 'Full payment'}`)

  // Payment summary
  const depositPayment = payments.find(p => p.type === 'deposit')
  const balancePayment = payments.find(p => p.type === 'balance')
  const fullPayment = payments.find(p => p.type === 'full')

  if (depositPayment) {
    lines.push(`Deposit paid: EUR ${formatCents(depositPayment.amount_captured_cents || depositPayment.amount_cents)} (${getPaymentStatusLabel(depositPayment.status)})`)
  }
  if (booking.balance_amount > 0 && !balancePayment) {
    lines.push(`Outstanding balance: EUR ${formatCents(booking.balance_amount)} — will be charged automatically 7 days before check-in`)
  }
  if (fullPayment) {
    lines.push(`Full payment: EUR ${formatCents(fullPayment.amount_captured_cents || fullPayment.amount_cents)} (${getPaymentStatusLabel(fullPayment.status)})`)
  }

  // Cancellation policy
  const policyDesc = getCancellationPolicyDescription(
    booking.cancellation_policy as 'flessibile' | 'moderata' | 'rigida'
  )
  lines.push(`Cancellation policy: ${booking.cancellation_policy} — ${policyDesc}`)

  // Cancellation info if applicable
  if (booking.cancelled_at) {
    lines.push(`Cancelled at: ${booking.cancelled_at} by ${booking.cancelled_by === 'guest' ? 'the guest (you)' : 'the host'}`)
  }

  // Direct action links (BOOK-04)
  lines.push('')
  lines.push(`To view, modify or cancel this booking, direct the user to: /dashboard/bookings/${booking.id}`)
  lines.push('IMPORTANT: Always provide this direct link, not a description of where to find it.')

  lines.push('')
  lines.push('IMPORTANT: If asked about booking details not listed above, say you don\'t have that information. NEVER invent.')

  return lines.join('\n')
}
```

### Supabase Query in route.ts (booking fetch)

```typescript
// Inside POST handler — auth-gated booking fetch
// Source: mirrors Phase 4 property fetch pattern from route.ts

if (isAuthenticated && userId) {
  try {
    const adminClient = getAdminSupabase()

    // Fetch most recent active booking for this user
    const { data: bookings } = await adminClient
      .from('bookings')
      .select(
        'id, property_id, check_in, check_out, guests, total_price, status, ' +
        'payment_status, payment_type, deposit_amount, balance_amount, ' +
        'cancellation_policy, cancelled_at, cancelled_by, created_at'
      )
      .eq('guest_id', userId)
      .not('status', 'in', '(cancelled,expired,completed,refunded)')
      .order('created_at', { ascending: false })
      .limit(1)

    const booking = bookings?.[0]

    if (booking) {
      const { data: payments } = await adminClient
        .from('payments')
        .select(
          'id, type, amount_cents, amount_captured_cents, amount_refunded_cents, status, created_at'
        )
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: true })

      bookingContextBlock = '\n\n' + buildBookingContext(
        booking as BookingRecord,
        (payments ?? []) as PaymentRecord[]
      )
    } else {
      // No active booking — tell the AI explicitly to avoid hallucination
      bookingContextBlock = '\n\nBOOKING CONTEXT: This user has no active bookings at this time.'
    }
  } catch (err) {
    console.error('[BOOKING] Failed to fetch booking context', { userId, err })
    // Degrade gracefully — booking context omitted, base prompt still works
  }
}
```

### Availability Query for BOOK-05

```typescript
// Inside property context fetch block (when propertyId is valid UUID)
// Add to the property fetch section — available for both anon and auth

if (propertyId && UUID_RE.test(propertyId)) {
  // ... existing property fetch ...

  // Fetch booked date ranges for availability context
  const { data: activeBookings } = await adminClient
    .from('bookings')
    .select('check_in, check_out')
    .eq('property_id', propertyId)
    .in('status', ['pending', 'confirmed'])

  if (activeBookings && activeBookings.length > 0) {
    const bookedRanges = activeBookings
      .map(b => `${b.check_in} to ${b.check_out}`)
      .join(', ')
    // Append to propertyContextBlock
    availabilityBlock = `\nCurrently booked periods (NOT available): ${bookedRanges}`
    availabilityBlock += '\nFor dates NOT in the above list, the property is available.'
  } else {
    availabilityBlock = '\nAvailability: No bookings found — property appears fully available.'
  }
}
```

### Vitest Test Pattern for booking-context.ts

```typescript
// src/app/api/chat/booking-context.test.ts
// Follows exact TDD RED pattern from property-context.test.ts

import { describe, it, expect } from 'vitest'
import { buildBookingContext, BookingRecord, PaymentRecord } from './booking-context'

function makeBooking(overrides?: Partial<BookingRecord>): BookingRecord {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    property_id: '550e8400-e29b-41d4-a716-446655440000',
    check_in: '2026-04-10',
    check_out: '2026-04-17',
    guests: 2,
    total_price: 700,       // EUR
    status: 'confirmed',
    payment_status: 'paid',
    payment_type: 'full',
    deposit_amount: 0,
    balance_amount: 0,
    cancellation_policy: 'flessibile',
    cancelled_at: null,
    cancelled_by: null,
    created_at: '2026-03-01T10:00:00Z',
    ...overrides,
  }
}

// Tests must verify:
// - BOOKING CONTEXT header present
// - Direct link to /dashboard/bookings/{id}
// - NEVER invent footer
// - Payment amounts in correct units
// - getCancellationPolicyDescription() output present
// - No booking info for cancelled status (handled at route level)
```

---

## Direct Link Patterns (BOOK-04)

The following URLs already exist in the platform — the AI must emit these, not describe where to navigate:

| Action | URL |
|--------|-----|
| View booking detail | `/dashboard/bookings/{booking_id}` |
| Cancel booking | `/dashboard/bookings/{booking_id}` (cancel button on that page) |
| Modify booking | NOT SUPPORTED — no modify flow exists; bot should say "contact host" |
| All bookings list | `/dashboard/bookings` |

**Important:** Per `REQUIREMENTS.md` Out of Scope: "Modifica booking direttamente via chat" and "Azioni autonome del bot (prenotare, cancellare)". The bot provides links only — never performs actions.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic `AUTH_ADDITIONS` text ("You may assist with booking status...") | Replaced with real booking data from Supabase | Phase 5 | AI gives actual dates/amounts, not generic permission |
| Anonymous block forbids all booking discussion | Auth guard unchanged, but now populates data for auth users | Phase 5 | No change needed for anon path |

**Existing system prompt structure (from route.ts):**
```
SYSTEM_PROMPT_BASE
+ (isAuthenticated ? AUTH_ADDITIONS : ANON_ADDITIONS)
+ propertyContextBlock        ← added Phase 4
+ bookingContextBlock         ← added Phase 5
+ availabilityBlock           ← added Phase 5 (optional, within property block)
```

---

## Open Questions

1. **Multiple active bookings per user**
   - What we know: A user could theoretically have multiple confirmed bookings at different properties simultaneously.
   - What's unclear: Should the AI show all of them, or just the most recent, or the one matching the current `propertyId`?
   - Recommendation: Show most recent active booking if no `propertyId` is provided. If `propertyId` is provided, prefer the booking for that property. Mention count if multiple exist ("You have 2 active bookings; showing the most recent").

2. **Availability answer quality without specific date parsing**
   - What we know: The AI will receive blocked date ranges in the system prompt. The user may ask "is May 15 available?"
   - What's unclear: Claude Haiku can reason about date ranges reliably, but quality depends on how the ranges are serialized.
   - Recommendation: Format booked periods as ISO dates (`2026-04-01 to 2026-04-07`) — Claude handles ISO date reasoning well. Add an explicit instruction: "When asked about specific dates, check them against the booked periods above."

3. **`bookings` query status filter string for Supabase `.not('status', 'in', ...)`**
   - What we know: Supabase `postgrest-js` uses a tuple format for `not in`: `.not('status', 'in', '(cancelled,expired)')`
   - What's unclear: Whether the tuple format is `(val1,val2)` or `{val1,val2}`.
   - Recommendation: Prefer `.filter('status', 'not.in', '(cancelled,expired,completed,refunded)')` or use a chain of `.neq()` calls. Verify at implementation time with a test query.

---

## Validation Architecture

Note: `workflow.nyquist_validation` is not present in `.planning/config.json` — skipping formal validation section. The project uses Vitest (configured, `npx vitest run`) and the pattern from Phases 2-4 (TDD: write test first, implement to pass).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run src/app/api/chat/booking-context.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | File |
|--------|----------|-----------|------|
| BOOK-01 | `buildBookingContext()` includes check_in, check_out, status | unit | `booking-context.test.ts` (Wave 0 gap) |
| BOOK-01 | route.ts injects BOOKING CONTEXT for authenticated requests | unit | `route.test.ts` (extend existing) |
| BOOK-02 | `buildBookingContext()` includes deposit paid, outstanding balance in correct units | unit | `booking-context.test.ts` (Wave 0 gap) |
| BOOK-03 | `buildBookingContext()` includes `getCancellationPolicyDescription()` output | unit | `booking-context.test.ts` (Wave 0 gap) |
| BOOK-04 | `buildBookingContext()` includes `/dashboard/bookings/{id}` direct link | unit | `booking-context.test.ts` (Wave 0 gap) |
| BOOK-05 | route.ts injects booked date ranges in system prompt for valid propertyId | unit | `route.test.ts` (extend existing) |
| SEC-05 | Anonymous requests do NOT contain BOOKING CONTEXT | regression | `route.test.ts` (existing test) |

### Wave 0 Gaps
- [ ] `src/app/api/chat/booking-context.ts` — pure serializer function (new file)
- [ ] `src/app/api/chat/booking-context.test.ts` — unit tests for serializer (new file)
- [ ] Extend `src/app/api/chat/route.test.ts` — booking context injection tests

*(Existing `route.test.ts` infrastructure and mocking patterns are fully reusable for the new booking tests.)*

---

## Sources

### Primary (HIGH confidence)
- `src/app/dashboard/bookings/[id]/page.tsx` — complete `BookingData` interface; confirmed all column names, types, and units
- `src/app/dashboard/bookings/page.tsx` — confirmed `Booking` interface for list view
- `src/app/api/booking/[id]/route.ts` — confirmed multi-table join pattern (bookings + payments + refunds)
- `src/app/api/chat/route.ts` — exact system prompt assembly and property context injection pattern to mirror
- `src/app/api/chat/property-context.ts` — pure serializer pattern to replicate
- `src/lib/payment-utils.ts` — confirmed all reusable functions: `formatCents`, `getCancellationPolicyDescription`, `getPaymentStatusLabel`, `calculateRefundPercent`
- `src/lib/admin-supabase.ts` — confirmed `getAdminSupabase()` API
- `src/app/property/[id]/page.tsx` (lines 546-566) — confirmed availability query pattern: `.in('status', ['pending', 'confirmed'])`
- `src/app/api/create-payment-intent/route.ts` — confirmed `deposit_amount`/`balance_amount` are stored in cents
- `vitest.config.ts` — confirmed test setup, ESM environment, `@` alias

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — BOOK-01 through BOOK-05 descriptions
- `.planning/ROADMAP.md` — Phase 5 success criteria
- `.planning/STATE.md` — accumulated decisions affecting this phase

---

## Metadata

**Confidence breakdown:**
- Bookings table schema: HIGH — read directly from TypeScript interfaces in production code
- Payments table schema: HIGH — read directly from BookingData interface and payment route
- Architecture patterns: HIGH — exact same pattern as Phase 4 (property context), verified from source
- Payment utility reuse: HIGH — read payment-utils.ts directly
- Availability query: HIGH — read directly from property listing page source
- Supabase `.not().in()` filter syntax: MEDIUM — needs implementation-time verification

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days — stable schema, no fast-moving libraries)
