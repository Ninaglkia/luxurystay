# Testing Patterns

**Analysis Date:** 2026-03-03

## Test Framework

**Runner:**
- Not detected - No test runner configured (Jest, Vitest, etc.)
- No test files found in codebase (`*.test.ts`, `*.spec.ts`)

**Assertion Library:**
- Not applicable - No testing infrastructure present

**Run Commands:**
```bash
# No test scripts defined in package.json
npm run test  # Not configured
```

**package.json Scripts:**
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Test File Organization

**Location:**
- Not applicable - No tests exist

**Naming:**
- Not established - No testing pattern established

**Structure:**
- Not applicable

## Test Structure

Not applicable - No tests present in codebase.

## Mocking

**Framework:**
- Not applicable - No mocking library configured

**What to Mock:**
- If implementing tests, mock external dependencies:
  - Stripe API calls (payment processing)
  - Supabase queries (database operations)
  - Google Maps API (geolocation/place search)
  - Authentication state

**What NOT to Mock:**
- Local utility functions should be tested directly
- Component rendering logic should be tested with real React
- UI interactions should be tested end-to-end if possible

## Fixtures and Factories

**Test Data:**
- Not applicable - No fixtures present

**Location:**
- Would go in `tests/fixtures/` or `__mocks__/` directory if implemented

## Coverage

**Requirements:**
- Not enforced - No coverage tooling configured

**View Coverage:**
- Not applicable

## Test Types

**Unit Tests:**
- Not implemented
- Would test:
  - Utility functions: `src/lib/payment-utils.ts` (calculateSplitAmounts, calculateRefundPercent, formatCents)
  - Helper functions: `shouldSplitPayment`, `calculateRefundAmount`
  - Status label/color mappings: `getPaymentStatusLabel`, `getPaymentStatusColor`

**Integration Tests:**
- Not implemented
- Would test:
  - API routes with Supabase queries
  - Stripe webhook handling
  - Payment flow end-to-end
  - Booking creation and cancellation

**E2E Tests:**
- Not implemented
- Framework: Not configured (would use Playwright or Cypress if added)

## Critical Testing Gaps

**Untested Business Logic:**

1. **Payment Logic** (`src/lib/payment-utils.ts`):
   - No tests for `shouldSplitPayment` - determines if payment splits based on check-in date
   - No tests for `calculateRefundPercent` - complex policy-based refund calculations
   - No tests for `calculateSplitAmounts` - rounding behavior
   - Risk: Incorrect refunds or payment splits could occur unnoticed

2. **Stripe Webhook Handler** (`src/app/api/webhook/stripe/route.ts`):
   - No tests for webhook signature verification
   - No tests for different Stripe event types (15+ cases)
   - No tests for database state updates after payment events
   - Risk: Booking state corruption or missed payments

3. **Booking API Routes** (`src/app/api/booking/[id]/route.ts`):
   - No tests for authorization checks (guest vs host access)
   - No tests for multi-table data fetching
   - Risk: Unauthorized data access

4. **Payment Intent Creation** (`src/app/api/create-payment-intent/route.ts`):
   - No tests for booking insertion
   - No tests for Stripe PaymentIntent creation
   - No tests for authentication state handling
   - Risk: Partial booking creation on failure

5. **Booking Cancellation** (`src/app/api/cancel-booking/route.ts`):
   - No tests for refund calculations
   - No tests for Stripe refund processing
   - Risk: Incorrect refund amounts or missed refunds

6. **Components** (large interactive components):
   - `src/app/dashboard/components/city-search.tsx` - No tests for:
     - Google Maps API integration
     - Autocomplete predictions
     - Keyboard navigation
     - Debouncing behavior
   - `src/app/components/payment-form.tsx` - No tests for:
     - Stripe integration
     - Form submission
     - Error handling
     - Payment type display (split vs full)

## Recommended Testing Strategy

### Phase 1: Unit Tests (High Priority)
- Test payment utility functions in `src/lib/payment-utils.ts`
- Mock date/time for deterministic refund calculations
- Test edge cases: leap years, DST, boundary conditions

### Phase 2: API Integration Tests (High Priority)
- Test webhook handler with mock Stripe events
- Test authorization in booking routes
- Test payment intent creation flow

### Phase 3: Component Tests (Medium Priority)
- Test payment form with mock Stripe SDK
- Test city search with mock Google Maps
- Test form validation and error states

### Phase 4: E2E Tests (Medium Priority)
- Full booking flow: search → select dates → payment
- Booking cancellation and refund flow
- Multi-payment scenarios

## Implementation Notes

**When adding tests:**
1. Create test files co-located with source: `[name].test.ts` or `[name].spec.ts`
2. Use consistent error messages (Italian) in test assertions
3. Mock Supabase with test data for API route tests
4. Mock Stripe SDK for payment tests
5. Use MSW (Mock Service Worker) for API mocking if doing integration tests

**ESLint Configuration for Tests:**
- Current ESLint config includes Next.js rules - may need test-specific overrides
- Consider adding `eslint-plugin-jest` or equivalent when tests are implemented

---

*Testing analysis: 2026-03-03*

## Summary

**Status:** Zero test coverage. This is a critical gap for a payment-processing application.

**Risk Level:** High - Financial transactions (Stripe integration, refunds) and authorization checks have no automated validation.

**Recommendation:** Implement unit tests for `payment-utils.ts` and API route tests for webhook handlers before adding new payment features.
