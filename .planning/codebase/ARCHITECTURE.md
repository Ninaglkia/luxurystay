# Architecture

**Analysis Date:** 2026-03-03

## Pattern Overview

**Overall:** Next.js 16 full-stack application with a client-server split using Server Components and API routes. The architecture follows a feature-driven structure with authentication at the middleware layer, payment processing integrated throughout booking flows, and mode-based UI switching (travel vs. host).

**Key Characteristics:**
- Next.js App Router (file-based routing)
- Server-side authentication via Supabase SSR middleware
- Split payment model for bookings (deposit/balance)
- Dual-mode dashboard (guest "travel" / host "host")
- Stripe webhook-driven payment state management
- Type-safe API communication via direct imports

## Layers

**Presentation Layer:**
- Purpose: Client-side UI components and pages
- Location: `src/app/**/*.tsx` (page and layout components), `src/app/components/` (shared app components), `src/app/dashboard/components/` (dashboard-specific components)
- Contains: React components using Tailwind CSS for styling, context providers for state management
- Depends on: Supabase client (`@/lib/supabase/client`), payment utilities, Stripe React hooks
- Used by: End users accessing pages at routes

**API Route Layer:**
- Purpose: Server-side request handlers for payments, bookings, webhooks
- Location: `src/app/api/*/route.ts`
- Contains: POST/GET handlers for payment intents, booking management, Stripe webhooks, auth callbacks
- Depends on: Server Supabase clients, Stripe server SDK, payment utilities
- Used by: Frontend forms, Stripe webhook service, external auth providers

**Business Logic Layer:**
- Purpose: Utility functions for payment calculations, refunds, policy enforcement
- Location: `src/lib/payment-utils.ts` (payment/refund logic), `src/lib/supabase/` (DB clients)
- Contains: Payment amount calculations, refund percentage determination based on cancellation policy, status label/color mapping
- Depends on: Date utilities, payment/cancellation policy enums
- Used by: API routes, components requiring formatting/calculation

**Data Access Layer:**
- Purpose: Supabase client initialization and singleton management
- Location: `src/lib/supabase/client.ts` (browser client), `src/lib/supabase/server.ts` (server client), `src/lib/admin-supabase.ts` (admin client with service role)
- Contains: Three client variants for different execution contexts
- Depends on: Supabase SDK, Next.js runtime context (cookies, async functions)
- Used by: All components and API routes requiring database access

**Authentication & Session Layer:**
- Purpose: User authentication, session management, route protection
- Location: `src/middleware.ts` (Next.js middleware), `src/app/auth/callback/route.ts` (OAuth callback)
- Contains: Middleware redirects for /dashboard (protected), /login, /register (public); OAuth exchange logic
- Depends on: Supabase SSR client, Next.js NextResponse/NextRequest
- Used by: Next.js router to intercept requests before handlers

## Data Flow

**Booking Creation Flow:**

1. User navigates to property detail page (`src/app/property/[id]/book/page.tsx`)
2. Form collects booking data (check-in, check-out, guests, guest info)
3. Form submits to `POST /api/create-payment-intent`
4. API route:
   - Validates booking data
   - Fetches property details and cancellation policy from Supabase
   - Determines if payment should be split (check-in > 7 days → 30% deposit + 70% balance)
   - Creates Stripe customer and PaymentIntent(s)
   - Inserts booking record (status: "pending_payment") and payment records
   - Returns clientSecret and payment configuration
5. Frontend renders `PaymentForm` with Stripe PaymentElement
6. User completes payment via Stripe
7. Stripe triggers webhook to `POST /api/webhook/stripe`
8. Webhook updates payment/booking status based on event type

**Payment Capture Flow:**

1. For split payments: Deposit automatically captures immediately, balance requires manual capture 7 days before check-in
2. Webhook `payment_intent.succeeded` updates payment status to "captured"
3. Booking status transitions: pending_payment → confirmed (deposit) or captured (full)
4. For full payments: Payment is authorized (manual capture), then captured via cron job or manual trigger

**Cancellation Flow:**

1. Guest or host initiates cancellation via modal
2. Form submits to `POST /api/cancel-booking` with booking_id
3. API calculates refund percentage based on cancellation policy and time to check-in
4. For captured payments: Creates Stripe refund via `stripe.refunds.create()`
5. Creates refund record in database
6. Updates payment and booking status to "cancelled"

**State Management:**

- Authentication state: Managed by Supabase session (stored in cookies, refreshed via middleware)
- Dashboard mode state: React Context (`ModeContext` in `src/app/dashboard/components/mode-context.tsx`), persisted to localStorage
- Booking/payment state: Supabase database as source of truth, updated via API routes and webhooks
- Payment UI state: Component-level state for loading/errors in forms

## Key Abstractions

**PaymentIntent Abstraction:**
- Purpose: Handles both full and split payment flows transparently
- Examples: `src/app/api/create-payment-intent/route.ts`, `src/lib/payment-utils.ts`
- Pattern: Payment type ("full" or "split") is determined at intent creation and stored in metadata, allowing webhook handlers to know how to interpret payment events

**Cancellation Policy Abstraction:**
- Purpose: Encapsulates business rules for refunds across three policy types
- Examples: `src/lib/payment-utils.ts` (calculateRefundPercent, calculateRefundAmount, getCancellationPolicyDescription)
- Pattern: Policy type ("flessibile", "moderata", "rigida") and check-in date determine refund percentage; calculation functions are reusable across cancellation and booking detail pages

**Mode-Based Dashboard:**
- Purpose: Single dashboard component tree supports two distinct views (travel/host)
- Examples: `src/app/dashboard/components/mode-context.tsx`, `src/app/dashboard/page.tsx`
- Pattern: ModeProvider wraps dashboard layout, useMode() hook drives conditional rendering; mode persisted to localStorage

**Supabase Client Factories:**
- Purpose: Provide correct client variant based on execution context
- Examples: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/admin-supabase.ts`
- Pattern: Browser client (public), server client (per-request), admin client (service role key) - each used in appropriate context to enforce RLS and permission boundaries

## Entry Points

**Root Page:**
- Location: `src/app/page.tsx`
- Triggers: User navigates to /
- Responsibilities: Public landing page with map, auth state detection, navigation to dashboard or login/register

**Dashboard:**
- Location: `src/app/dashboard/layout.tsx`, `src/app/dashboard/page.tsx`
- Triggers: Authenticated user navigates to /dashboard (redirected by middleware if not authenticated)
- Responsibilities: Layout with sidebar/header, mode switching, conditional rendering of travel or host dashboard

**Auth Callback:**
- Location: `src/app/auth/callback/route.ts`
- Triggers: OAuth provider redirects after sign-in
- Responsibilities: Exchange auth code for Supabase session, redirect to /dashboard

**API Routes:**
- Location: `src/app/api/*/route.ts`
- Triggers: Frontend form submissions, Stripe webhook events, cron jobs
- Responsibilities: Business logic execution, external service integration (Stripe), database mutations

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every request (except static assets)
- Responsibilities: Authentication check, route protection, session refresh

## Error Handling

**Strategy:** Layered error handling with user-friendly messages returned via API responses and displayed in UI.

**Patterns:**

- **API Routes:** Try-catch blocks at route level; catches return NextResponse.json with error message and appropriate HTTP status code (400 for bad request, 401 for auth, 403 for forbidden, 404 for not found, 500 for server error)
- **Database Errors:** Checked via Supabase error objects (e.g., `if (bookingError || !booking)`) before proceeding; errors returned to client
- **Stripe Errors:** Caught in payment form (submitError from confirmPayment), displayed inline; webhook handler wraps event construction in try-catch for signature verification
- **Client Components:** useState for error state, displayed in red alert boxes (see `src/app/components/payment-form.tsx`)
- **Validation:** Checked at API layer before processing (required fields, booking eligibility, authorization)

## Cross-Cutting Concerns

**Logging:**
- console.error() at API level for debugging (e.g., booking insert errors, cancellation errors, webhook failures)
- No structured logging framework detected

**Validation:**
- Request body validation in API routes (required fields check)
- Authorization checks (isGuest, isHost) in cancellation/booking routes
- Stripe webhook signature verification mandatory before processing events

**Authentication:**
- Supabase SSR middleware at request level
- User extracted in API routes via `supabase.auth.getUser()`
- Fallback to guest booking (null guest_id) if no user authenticated

**Payment Security:**
- Stripe webhook signature verification prevents unauthorized events
- Payment intents use metadata for state tracking instead of client-side state
- Cancellation policies enforced server-side, not client-side
- Guest-cannot-book-own-property check at intent creation time

---

*Architecture analysis: 2026-03-03*
