# External Integrations

**Analysis Date:** 2026-03-03

## APIs & External Services

**Payment Processing:**
- Stripe - Complete payment processing platform
  - SDK/Client: `stripe` (server-side v20.4.0), `@stripe/stripe-js` (client v8.8.0), `@stripe/react-stripe-js` (React wrapper v5.6.0)
  - Auth: STRIPE_SECRET_KEY (server), NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (client)
  - Usage: Payment intents creation, payment capture, refunds, webhook processing
  - Webhook endpoint: `/app/api/webhook/stripe/route.ts`
  - Webhook secret: STRIPE_WEBHOOK_SECRET

**Maps & Geolocation:**
- Google Maps - Property location display and search
  - SDK/Client: `@vis.gl/react-google-maps` v1.7.1
  - Auth: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  - Features: Interactive maps, address search/geocoding, marker display
  - Usage: Property pages (`src/app/property/[id]/page.tsx`, `src/app/dashboard/property/[id]/page.tsx`)
  - Admin: Property creation/editing with map selection (`src/app/dashboard/components/add-property-flow.tsx`)
  - Guest: Exploration map (`src/app/dashboard/components/explore-map.tsx`)

## Data Storage

**Database:**
- Supabase (PostgreSQL-based backend-as-a-service)
  - Connection: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (client), SUPABASE_SERVICE_ROLE_KEY (admin)
  - Client: `@supabase/supabase-js` v2.98.0 for auth/data queries, `@supabase/ssr` v0.8.0 for server-side rendering
  - Tables referenced: `properties`, `bookings`, `payments`, `users` (implicit via auth)
  - Patterns:
    - Client-side: Browser client via `src/lib/supabase/client.ts`
    - Server-side: Server client via `src/lib/supabase/server.ts` (with cookie handling)
    - Admin: Admin client via `src/lib/admin-supabase.ts` (uses service role key)

**File Storage:**
- Not explicitly configured - likely using Supabase Storage or external service (no direct evidence)

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (OAuth & email/password)
  - Implementation: Supabase auth flows with OAuth code exchange
  - OAuth callback: `/src/app/auth/callback/route.ts` - Exchanges auth code for session
  - Session management: Handled via cookies with Supabase SSR middleware
  - Middleware protection: `/src/middleware.ts` - Validates user session, protects `/dashboard` routes
  - User state: Available via `supabase.auth.getUser()`

## Payment Processing Details

**Payment Intents Flow:**

1. **Payment Intent Creation** (`/src/app/api/create-payment-intent/route.ts`):
   - Client submits booking details (property_id, dates, guest info)
   - Server determines payment type: split (30% deposit + 70% balance due >7 days out) or full payment
   - Creates Stripe customer for guest
   - Creates PaymentIntent(s):
     - Split: Deposit PI with `capture_method: "automatic"` + metadata for balance tracking
     - Full: Full amount PI with `capture_method: "manual"` (authorized, not captured)
   - Stores booking and payment records in Supabase

2. **Webhook Processing** (`/src/app/api/webhook/stripe/route.ts`):
   - Listens for Stripe events: `checkout.session.completed`, `payment_intent.amount_capturable_updated`, `payment_intent.succeeded`, `payment_intent.canceled`, `payment_intent.payment_failed`, `charge.refunded`
   - Updates booking status and payment records based on event type
   - Booking status transitions: pending_payment → authorized → confirmed → captured
   - Payment status: unpaid → authorized → captured or failed/cancelled

3. **Payment Capture** (`/src/app/api/cron/capture-payments/route.ts`):
   - Cron job triggered with CRON_SECRET header
   - Captures manually-authorized payment intents
   - Called periodically to finalize full bookings

4. **Cancellation** (`/src/app/api/cancel-booking/route.ts`):
   - Cancels payment intents and applies refunds based on cancellation policy

## Booking Data Model

**Bookings table fields** (inferred from API code):
- `id` - Unique identifier
- `property_id` - Property being booked
- `guest_id` - User ID of guest (null for guest checkouts)
- `guest_name`, `guest_email`, `guest_phone` - Guest details if not user
- `host_id` - User ID of property owner
- `check_in`, `check_out` - Dates
- `guests` - Number of guests
- `total_price` - Total cost in cents
- `status` - Booking status (pending_payment, authorized, confirmed, captured, expired)
- `payment_status` - Payment status (unpaid, partial, paid)
- `payment_type` - "split" or "full"
- `deposit_amount`, `balance_amount` - For split payments
- `cancellation_policy` - flessibile/moderata/rigida
- `stripe_customer_id` - Stripe customer ID
- `stripe_payment_intent_id` - Full payment PI ID
- `stripe_deposit_payment_intent_id` - Deposit PI ID for split payments
- `stripe_session_id` - Checkout session ID (legacy)

**Payments table fields** (inferred from webhook):
- `booking_id` - Associated booking
- `stripe_payment_intent_id` - Payment intent ID
- `type` - "deposit", "full", or "balance"
- `amount_cents` - Amount in cents
- `currency` - "eur"
- `status` - requires_payment, authorized, captured, cancelled, failed
- `amount_authorized_cents` - Authorized amount
- `amount_captured_cents` - Captured amount
- `amount_refunded_cents` - Refunded amount
- `captured_at` - Timestamp of capture

## Cancellation Policy Engine

**Implementation:** `src/lib/payment-utils.ts`

Three policies with automatic refund calculation:
- **Flessibile** (Flexible): 100% refund until 24h before check-in, 50% in last 24h
- **Moderata** (Moderate): 100% refund until 5 days before, 50% between 5 days and 24h
- **Rigida** (Rigid): 50% refund only until 7 days before

## Webhooks & Callbacks

**Incoming Webhooks:**
- Stripe: POST `/api/webhook/stripe` - Receives payment events with signature verification

**Outgoing Webhooks:**
- None detected

**Cron Jobs:**
- POST `/api/cron/capture-payments` - Periodically captures authorized payment intents
  - Protected with CRON_SECRET header

## Environment Configuration

**Required Environment Variables (Client-visible):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

**Required Environment Variables (Server-only):**
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `CRON_SECRET` - Authorization token for cron endpoints

**Secrets Location:**
- Development: `.env.local` file (not committed)
- Production: Vercel environment variables dashboard

## Request/Response Patterns

**Payment Intent Creation Request:**
```json
{
  "property_id": "uuid",
  "check_in": "2026-03-10",
  "check_out": "2026-03-15",
  "guests": 2,
  "total_price": 500.00,
  "guest_name": "string",
  "guest_email": "email",
  "guest_phone": "string",
  "property_title": "string"
}
```

**Payment Intent Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "bookingId": "uuid",
  "paymentType": "split" | "full",
  "depositAmount": 15000,
  "balanceAmount": 35000,
  "totalCents": 50000,
  "cancellationPolicy": "moderata"
}
```

## Service Initialization Patterns

**Supabase Client (Browser):**
- File: `src/lib/supabase/client.ts`
- Singleton pattern with `createBrowserClient()`
- Returns browser client instance for use in components

**Supabase Server Client:**
- File: `src/lib/supabase/server.ts`
- Async factory function with cookie handling
- Called per-request to maintain fresh session data

**Supabase Admin Client:**
- File: `src/lib/admin-supabase.ts`
- Uses service role key for privileged operations
- Server-side only

**Stripe Server:**
- File: `src/lib/stripe.ts`
- Lazy initialization via Proxy pattern (avoids instantiation at import time)
- Single instance reused across requests
- API version: 2026-02-25.clover

**Stripe Client (Browser):**
- File: `src/lib/stripe-client.ts`
- Lazy loading via `loadStripe()`
- Promise-based singleton for use with Stripe React components

---

*Integration audit: 2026-03-03*
