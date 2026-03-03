# Codebase Structure

**Analysis Date:** 2026-03-03

## Directory Layout

```
luxurystay/
├── src/
│   ├── app/                          # Next.js App Router (pages, layouts, API routes)
│   │   ├── api/                      # API route handlers
│   │   │   ├── booking/              # Booking fetch endpoint
│   │   │   ├── cancel-booking/       # Booking cancellation
│   │   │   ├── checkout/             # Legacy checkout (redirect)
│   │   │   ├── create-payment-intent/# Stripe payment intent creation
│   │   │   ├── cron/capture-payments/# Background payment capture
│   │   │   └── webhook/stripe/       # Stripe webhook handler
│   │   ├── auth/callback/            # OAuth callback handler
│   │   ├── components/               # Shared app-level components
│   │   ├── dashboard/                # Authenticated dashboard
│   │   │   ├── components/           # Dashboard-specific components
│   │   │   ├── add-property/         # Host property creation flow
│   │   │   ├── bookings/             # Guest/host booking management
│   │   │   ├── property/             # Host property details
│   │   │   ├── settings/             # User settings
│   │   │   ├── layout.tsx            # Dashboard layout wrapper
│   │   │   └── page.tsx              # Dashboard home (dual-mode)
│   │   ├── property/                 # Public property browsing
│   │   │   └── [id]/                 # Dynamic property detail
│   │   │       └── book/             # Booking page
│   │   ├── login/                    # Login page
│   │   ├── register/                 # Registration page
│   │   ├── booking/success/          # Payment success confirmation
│   │   ├── chi-siamo/                # About page (Italian)
│   │   ├── come-funziona/            # How it works page
│   │   ├── contatti/                 # Contact page
│   │   ├── faq/                      # FAQ page
│   │   ├── privacy/                  # Privacy policy
│   │   ├── termini/                  # Terms of service
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home page
│   │   └── globals.css               # Global Tailwind CSS
│   ├── lib/                          # Utility functions and client initialization
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   └── server.ts             # Server Supabase client
│   │   ├── admin-supabase.ts         # Service-role Supabase client
│   │   ├── stripe.ts                 # Stripe server SDK singleton
│   │   ├── stripe-client.ts          # Stripe.js browser client
│   │   └── payment-utils.ts          # Payment/refund business logic
│   ├── middleware.ts                 # Next.js middleware (auth redirects)
│   └── [...other files]
├── public/                           # Static assets (favicon, manifest, icons)
├── .next/                            # Build output (generated)
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── postcss.config.mjs                # PostCSS + Tailwind config
├── eslint.config.mjs                 # ESLint configuration
├── package.json                      # Dependencies
├── package-lock.json                 # Dependency lock file
└── .env.local                        # Environment variables
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router application code (pages, layouts, API routes)
- Contains: Page components (TSX), layout wrappers, route handlers (TS), global styles
- Key files: `layout.tsx` (root layout), `page.tsx` (home), middleware for auth

**`src/app/api/`:**
- Purpose: Server-side request handlers (API endpoints)
- Contains: POST/GET route handlers for payments, webhooks, bookings
- Key patterns: Error handling with NextResponse.json, Supabase/Stripe SDK calls, transaction-like operations

**`src/app/dashboard/`:**
- Purpose: Authenticated user dashboard (guest and host functionality)
- Contains: Layout with sidebar/header, dual-mode switching, property/booking management
- Key files: `layout.tsx` (wraps ModeProvider), `page.tsx` (renders based on mode), `components/mode-context.tsx` (state)

**`src/app/dashboard/components/`:**
- Purpose: Reusable dashboard-specific UI components
- Contains: Sidebar, header, map explorer, booking list, property form, filters
- Key components: `explore-map.tsx` (map view), `host-dashboard.tsx` (property list), `add-property-flow.tsx` (form), `mode-context.tsx` (auth context)

**`src/app/components/`:**
- Purpose: Reusable components shared across app-level pages
- Contains: Payment form, footer, modals, Stripe provider
- Key files: `payment-form.tsx` (Stripe PaymentElement wrapper), `stripe-provider.tsx` (Elements provider)

**`src/app/property/`:**
- Purpose: Public property browsing experience
- Contains: Property listing, detail page, booking page
- Routes: `/property/[id]` (detail), `/property/[id]/book` (booking checkout)

**`src/lib/`:**
- Purpose: Utility functions and service initialization
- Contains: Database clients, payment calculation functions, Stripe SDK wrapper
- Key files: Supabase client factories (context-aware), payment utilities (refund logic), Stripe proxy (lazy-loading)

**`src/lib/supabase/`:**
- Purpose: Supabase client initialization for different execution contexts
- Contains: `client.ts` (browser), `server.ts` (server per-request), `admin-supabase.ts` (service role)
- Pattern: Each exports a factory function that initializes the appropriate client type

**`public/`:**
- Purpose: Static assets served at root
- Contains: favicon, apple-touch-icon, manifest.json, possibly service worker (sw.js)
- Generated: No, committed to git

## Key File Locations

**Entry Points:**

- `src/app/layout.tsx`: Root layout, sets metadata, initializes service worker registration
- `src/app/page.tsx`: Public home page, map explorer, auth-aware header
- `src/app/dashboard/layout.tsx`: Protected dashboard layout, fetches user, wraps ModeProvider
- `src/middleware.ts`: Next.js middleware, enforces /dashboard protection, redirects authenticated users from /login

**Configuration:**

- `next.config.ts`: Next.js configuration (minimal, uses defaults)
- `tsconfig.json`: TypeScript settings with path alias `@/*` → `./src/*`
- `postcss.config.mjs`: PostCSS for Tailwind CSS v4
- `eslint.config.mjs`: ESLint rules (ESLint 9 flat config)

**Core Logic:**

- `src/lib/payment-utils.ts`: All payment/refund calculations (shouldSplitPayment, calculateSplitAmounts, calculateRefundPercent, etc.)
- `src/lib/stripe.ts`: Stripe SDK lazy-loading proxy (prevents instantiation at import time)
- `src/lib/supabase/`: Client factory functions (context-aware Supabase client creation)

**API Routes:**

- `src/app/api/create-payment-intent/route.ts`: Booking → payment intent, creates booking + payment records
- `src/app/api/webhook/stripe/route.ts`: Stripe webhook handler, updates payment/booking status based on events
- `src/app/api/cancel-booking/route.ts`: Cancellation with refund logic, calls Stripe refunds API
- `src/app/api/auth/callback/route.ts`: OAuth callback, exchanges code for session
- `src/app/api/booking/[id]/route.ts`: Fetch booking details
- `src/app/api/cron/capture-payments/route.ts`: Background job for payment capture

**Testing:**

- Not detected; no test files found in codebase

## Naming Conventions

**Files:**

- `[param].tsx` or `[param].ts`: Dynamic route segments (e.g., `[id]/page.tsx` for `/property/:id`)
- `route.ts`: API route handlers (Next.js convention)
- `layout.tsx`: Layout wrapper for directory scope
- `page.tsx`: Page component for route
- Component files: PascalCase (`Sidebar.tsx`, `ModeContext.tsx`)
- Utility files: camelCase (`payment-utils.ts`, `admin-supabase.ts`)

**Directories:**

- `api/`: Route segments by feature (e.g., `api/cancel-booking/`, `api/webhook/stripe/`)
- `components/`: UI component directory names match their purpose
- Feature directories: kebab-case where nested under routes (e.g., `add-property`, `booking/success`)
- Utility directories: kebab-case for grouping (e.g., `dashboard/components`)

**TypeScript:**

- Component files marked with `"use client"` for client-side rendering
- No `"use server"` explicit markers (Supabase/payment operations in API routes instead)
- Props interfaces defined inline or exported from component file

## Where to Add New Code

**New Feature:**

- Primary code: Add route/page in `src/app/` matching feature path (e.g., `/messages` → `src/app/messages/page.tsx`)
- API endpoint: Add route under `src/app/api/feature-name/route.ts`
- Tests: Create `__tests__/feature.test.ts` or co-locate `feature.test.ts` (no test directory currently exists)
- Styles: Use Tailwind CSS utility classes (no separate CSS files); add global styles to `src/app/globals.css` if needed

**New Component/Module:**

- Shared UI component: `src/app/components/ComponentName.tsx`
- Dashboard-only component: `src/app/dashboard/components/ComponentName.tsx`
- Utility function: `src/lib/feature-name.ts` (e.g., `src/lib/payment-utils.ts`)
- Database client variant: Add factory to `src/lib/supabase/` (e.g., if a new context is needed)

**Utilities:**

- Shared helpers: `src/lib/` with filename matching purpose (e.g., `calculation-utils.ts`, `formatting-utils.ts`)
- Payment-related: Keep in `src/lib/payment-utils.ts` or create `src/lib/payment/` subdirectory with focused files
- Supabase operations: Keep client factories in `src/lib/supabase/`; business logic stays in API routes or feature-specific lib files

## Special Directories

**`src/app/api/`:**
- Purpose: Server-side handlers (POST for mutations, GET for reads)
- Generated: No
- Committed: Yes
- Pattern: Each API endpoint is a directory with `route.ts` file; dynamic route segments use `[param]` syntax

**`src/app/dashboard/components/`:**
- Purpose: Isolated dashboard UI components
- Generated: No
- Committed: Yes
- Note: Separate from `src/app/components/` because these are not reusable in other app sections

**`src/lib/supabase/`:**
- Purpose: Client factory functions for context-aware Supabase initialization
- Generated: No
- Committed: Yes
- Pattern: Three clients (browser, server per-request, admin service-role); choose based on execution context

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by `next build`)
- Committed: No (.gitignore)
- Note: Contains compiled code and type definitions

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (by npm install)
- Committed: No (.gitignore)

---

*Structure analysis: 2026-03-03*
