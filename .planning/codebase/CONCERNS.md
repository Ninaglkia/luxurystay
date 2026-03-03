# Codebase Concerns

**Analysis Date:** 2026-03-03

## Tech Debt

**Large Component: AddPropertyFlow**
- Issue: 1200+ line monolithic component handling multi-step form with complex state management
- Files: `src/app/dashboard/components/add-property-flow.tsx`
- Impact: Difficult to test individual steps, hard to reuse UI components, maintenance burden
- Fix approach: Break into smaller components per step, extract form state logic into custom hook, separate validation logic from UI rendering

**Weak Type Safety with Generic Records**
- Issue: Using `Record<string, unknown>` in API routes for flexible object building instead of proper Zod schemas
- Files: `src/app/api/create-payment-intent/route.ts` (line 74), `src/app/api/checkout/route.ts` (similar pattern)
- Impact: No runtime validation of required fields, missing properties caught only at database layer, potential null reference errors
- Fix approach: Implement Zod or similar schema validation library, validate all input before use, create reusable request/response types

**Unsafe Type Casting with `as any`**
- Issue: Multiple instances of `as any` and eslint-disable comments bypassing type safety
- Files: `src/app/property/[id]/page.tsx` (line 379 - `setReviews(data as any)`), `src/app/dashboard/components/city-search.tsx` (line with `as unknown as`), `src/lib/stripe.ts` (dynamic property access)
- Impact: Hidden type errors, harder to refactor, potential runtime failures with undefined properties
- Fix approach: Create proper TypeScript interfaces for all data structures, use discriminated unions for API responses, avoid type assertions

**Nullable Admin Client Initialization**
- Issue: `getAdminSupabase()` and `createClient()` called without validation in server contexts
- Files: `src/lib/admin-supabase.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Impact: Missing env var (SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL) will crash at runtime rather than startup
- Fix approach: Add startup validation for critical env vars, throw error in module initialization if missing, log which vars are required

**Unvalidated DateTime Handling**
- Issue: String dates from request bodies used directly in date calculations without format validation
- Files: `src/lib/payment-utils.ts` (lines 4, 31 - date parsing), `src/app/api/cron/capture-payments/route.ts` (date comparisons)
- Impact: Invalid date formats silently become `Invalid Date`, causing NaN calculations, split payment logic silently fails
- Fix approach: Validate date format before parsing, throw error on invalid input, add unit tests for edge cases (leap years, timezone transitions)

## Known Bugs

**Timezone-Dependent Payment Logic**
- Symptoms: Split payment triggering incorrectly depending on server timezone, diff days calculation may be off by 1
- Files: `src/lib/payment-utils.ts` (lines 4-9), `src/app/api/cron/capture-payments/route.ts` (lines 25-30)
- Trigger: Booking created near midnight UTC; check-in time is ambiguous (only date stored, no time)
- Workaround: Store check-in dates in UTC timezone, compare dates not datetimes, add timezone to booking record

**Missing Error Handling in Photo Upload Loop**
- Symptoms: If photo upload fails midway through loop, partial photoUrls array is used, property created with missing photos
- Files: `src/app/dashboard/components/add-property-flow.tsx` (lines 1032-1043)
- Trigger: Network failure during multi-photo upload, storage quota exceeded
- Workaround: Wrap upload loop in transaction-like pattern (upload all before inserting property)

**Refund Amount Arithmetic Error**
- Symptoms: Floating point rounding causes small discrepancies in refund amounts (1-2 cents)
- Files: `src/lib/payment-utils.ts` (lines 56-57), `src/app/api/cancel-booking/route.ts` (lines 89-92)
- Trigger: Refund percent not divisible by 100, e.g., 33.33% of €100 = €33.33 rounded to 3333 cents
- Workaround: Use fixed decimal math library for payment calculations, store amounts as integers (cents), round consistently

**Stripe Webhook Race Condition**
- Symptoms: Booking status updated to 'authorized' before deposit PI is fully inserted in database
- Files: `src/app/api/webhook/stripe/route.ts` (lines 60-82), `src/app/api/create-payment-intent/route.ts` (lines 138-141)
- Trigger: Webhook processed faster than payment intent record insertion (unlikely but possible under load)
- Workaround: Use database transactions for related payment_intent + payment record inserts, or add webhook deduplication with idempotency keys

## Security Considerations

**Unnecessary Non-Null Assertions on Environment Variables**
- Risk: Using `!` operator hides missing required env vars until first usage, crashes at runtime in production
- Files: Middleware, auth routes, API routes (multiple locations with `process.env.VAR!`)
- Current mitigation: None - relies on deployment checks
- Recommendations: Add env var validation at startup (create `validate-env.ts` utility), fail fast in module initialization, document all required env vars

**Weak Authorization Checks Missing Owner Verification**
- Risk: Some endpoints check user !== property.owner but not all data access paths
- Files: `src/app/api/create-payment-intent/route.ts` (line 53 checks guest != host, but no check for editing properties)
- Current mitigation: Supabase RLS policies (assumed)
- Recommendations: Add explicit authorization checks before all sensitive operations, document authorization model, audit all data mutations

**Stored Payment Intent IDs Exposed to Client**
- Risk: Client-side components have access to Stripe payment intent IDs, could be used to probe payment status
- Files: `src/app/components/payment-form.tsx`, booking pages
- Current mitigation: Client secrets properly scoped by Stripe
- Recommendations: Never expose full payment_intent IDs to client, return only metadata needed for UI, validate access server-side

**CRON Secret Verification is Basic**
- Risk: Single Bearer token for cron endpoint, no time-based or signature validation
- Files: `src/app/api/cron/capture-payments/route.ts` (line 8)
- Current mitigation: Vercel sends Authorization header with secret
- Recommendations: Add HMAC signature validation with request body, implement request timestamp check to prevent replay attacks

**Missing Input Validation on Hotel Details**
- Risk: User-provided address, title, description not sanitized before storage/display
- Files: `src/app/dashboard/components/add-property-flow.tsx` (title, description, address fields)
- Current mitigation: None observed
- Recommendations: Sanitize HTML in descriptions, validate address format, add length limits to all text inputs

## Performance Bottlenecks

**Full Table Scan in Payment Capture Cron**
- Problem: Selects all authorized payments, no pagination or batch size limit
- Files: `src/app/api/cron/capture-payments/route.ts` (lines 25-30)
- Cause: LIMIT missing in Supabase query
- Improvement path: Add LIMIT 100 to queries, implement cursor-based pagination if >100 rows expected, return processed count for monitoring

**N+1 Query in Booking Details View**
- Problem: Fetches booking, then property, then payments, then refunds, then profiles separately
- Files: `src/app/api/booking/[id]/route.ts` (lines 23-75)
- Cause: Individual queries instead of joins
- Improvement path: Single Supabase select with nested relations using foreign keys, or use request batch if API doesn't support joins

**Unoptimized Map Component Renders**
- Problem: Map properties re-fetched from Supabase on every filter change, no caching
- Files: `src/app/dashboard/components/explore-map.tsx` (property fetches in useEffect)
- Cause: useEffect dependencies trigger full refetch instead of client-side filtering
- Improvement path: Fetch all properties once on mount, filter in memory, add useMemo for filtered results

**Large Form Component Remount Cost**
- Problem: AddPropertyFlow is full-screen modal with heavy animations, entire component remounts on step change
- Files: `src/app/dashboard/components/add-property-flow.tsx` (step state change triggers render)
- Cause: No component memoization, Framer Motion animations on every step
- Improvement path: Use React.memo for step components, lazy load step content, cache form state in localStorage for persistence

## Fragile Areas

**Payment Intent Metadata Dependency**
- Files: `src/app/api/webhook/stripe/route.ts`, `src/app/api/create-payment-intent/route.ts`, `src/app/api/cron/capture-payments/route.ts`
- Why fragile: Relies on metadata.booking_id and metadata.type existing without validation, renaming keys breaks everything
- Safe modification: Add constants file for metadata keys, validate metadata structure in webhook handler before use, add tests for all webhook event types
- Test coverage: No tests observed for webhook payload validation

**Cancellation Policy String Values**
- Files: `src/app/dashboard/components/add-property-flow.tsx`, `src/lib/payment-utils.ts`, payment components
- Why fragile: Policy names hardcoded as strings ("flessibile", "moderata", "rigida") in multiple places, typos silently break refund calculations
- Safe modification: Create enum/constants for policies, use const assertions, validate policy against enum before calculations
- Test coverage: No unit tests for calculateRefundPercent function

**Address Component Logic Spread Across Components**
- Files: `src/app/dashboard/components/add-property-flow.tsx` (StepLocationSearch, StepLocationConfirm, StepLocationPin)
- Why fragile: Address parsing split across 3 functions, manual string manipulation with `.filter(Boolean).join()`, no validation of required fields
- Safe modification: Extract address utilities to separate module, create AddressDetails type guard, centralize formatting/parsing
- Test coverage: No tests for address parsing logic

**Supabase Client Instantiation Repeated**
- Files: Every API route creates `createClient()` or `getAdminSupabase()` inline
- Why fragile: Hard to swap implementation, no place to inject dependencies, each route must remember which client to use
- Safe modification: Create client factory with context (server vs client), use dependency injection pattern, add types for client contracts
- Test coverage: Not testable without mocking entire Supabase module

## Scaling Limits

**Database Row Limits**
- Current capacity: No indexes/limits defined, assumed Supabase standard limits
- Limit: Single property can have unlimited bookings; no sharding, no archive strategy for old bookings
- Scaling path: Add booking retention policy (archive completed bookings after 2 years), add composite indexes on (property_id, created_at), implement booking archive table

**Payment Processing Cron Scalability**
- Current capacity: 30-minute poll for capture-payments with no concurrency control
- Limit: If 1000+ bookings process simultaneously, Stripe API rate limits hit (100 reqs/sec)
- Scaling path: Implement queue (BullMQ/Temporal), batch operations, add exponential backoff for Stripe API retries

**Static Asset Serving**
- Current capacity: Property photos stored in Supabase storage, no CDN caching observed
- Limit: Photo load times increase with user base; no resize/optimization for mobile
- Scaling path: Add image optimization (Next.js Image component), serve from Cloudflare/CDN, implement WebP with fallbacks

**Google Maps API Usage**
- Current capacity: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY used in 4 components, no quota management
- Limit: Free tier = 1000 requests/day; will hit quota with moderate traffic
- Scaling path: Add server-side geocoding, cache results, implement fallback to static maps

## Dependencies at Risk

**React 19 Adoption Risk**
- Risk: Version 19.2.3 is relatively new, some ecosystem packages may have compatibility issues
- Impact: Third-party packages may not support React 19 yet; breaking changes in minor versions possible
- Migration plan: Pin minor versions, test with major dependencies (Stripe, Supabase react hooks) before minor upgrades

**Stripe API Version Risk**
- Risk: stripe v20.4.0 with monthly API releases; if breaking change releases and we auto-update, production breaks
- Impact: Payment processing outages, failed captures
- Migration plan: Pin major and minor versions (`^20.4.0`), test payment flows in staging for every stripe upgrade

**Supabase JS Client Rapid Release Cycles**
- Risk: @supabase/supabase-js v2.98.0 releases frequently with edge cases
- Impact: Authentication failures, unexpected RLS behavior
- Migration plan: Use strict versioning, maintain changelog of known issues by version, test auth flows after upgrades

## Missing Critical Features

**Booking Confirmation Communication**
- Problem: No email notifications sent to guest/host on booking, payment, or cancellation
- Blocks: Cannot manage bookings without email (guests don't know booking ID, can't confirm details)
- Workaround: Email integration missing, hard to track booking by email search

**Admin Dashboard**
- Problem: No admin interface to manage users, refund disputes, payment issues
- Blocks: Cannot resolve customer disputes, no way to force-capture pending payments, no analytics
- Workaround: All admin tasks require direct database access

**Payment Dispute/Chargeback Handling**
- Problem: No webhook handling for Stripe dispute.created, payment intent failure events
- Blocks: Chargebacks silently cause inconsistent state (booking marked paid but Stripe says failed)
- Workaround: Manual monitoring of Stripe dashboard required

**Property Availability Calendar**
- Problem: Bookings exist but no calendar UI for hosts to see booked vs free dates
- Blocks: Hosts cannot plan maintenance, double-booking possible (no date conflict check on booking creation)
- Workaround: Manual date tracking required

## Test Coverage Gaps

**Payment Utility Logic Untested**
- What's not tested: All functions in `src/lib/payment-utils.ts` - date calculations, refund logic, formatting
- Files: `src/lib/payment-utils.ts`
- Risk: Timezone bugs, rounding errors go unnoticed, silent failures with invalid dates
- Priority: High - directly affects revenue

**Webhook Event Handling**
- What's not tested: Stripe webhook parsing, different event types, missing metadata, duplicate events
- Files: `src/app/api/webhook/stripe/route.ts`
- Risk: Payments may not be captured/refunded correctly, bookings stuck in wrong status
- Priority: Critical - core business logic

**Authorization Logic Consistency**
- What's not tested: Guest vs host authorization across all endpoints
- Files: `src/app/api/cancel-booking/route.ts`, `src/app/api/booking/[id]/route.ts`, payment routes
- Risk: Authorization bypass, users accessing others' bookings
- Priority: Critical - security

**Address Parsing and Validation**
- What's not tested: Reverse geocoding, address format parsing, edge cases (missing fields, special characters)
- Files: `src/app/dashboard/components/add-property-flow.tsx` (address step logic)
- Risk: Invalid addresses stored, map pins at wrong locations, user frustration
- Priority: High - user-facing feature

**Form Validation and Step Progression**
- What's not tested: canProceed() logic, step transitions with missing data, form state persistence
- Files: `src/app/dashboard/components/add-property-flow.tsx` (canProceed function, step logic)
- Risk: Users can skip required steps, form data lost on reload, frustration
- Priority: Medium - UX issue

**Async Payment Creation Race Conditions**
- What's not tested: Multiple payment intents created for same booking, concurrent requests
- Files: `src/app/api/create-payment-intent/route.ts`
- Risk: Double billing, orphaned payment intents in Stripe
- Priority: High - financial impact

---

*Concerns audit: 2026-03-03*
