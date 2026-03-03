# Coding Conventions

**Analysis Date:** 2026-03-03

## Naming Patterns

**Files:**
- React components use PascalCase: `Header.tsx`, `PaymentForm.tsx`, `CitySearch.tsx`
- Pages use kebab-case: `page.tsx` (Next.js standard)
- API routes use kebab-case: `create-payment-intent`, `cancel-booking`, `webhook`
- Utility modules use kebab-case: `payment-utils.ts`, `admin-supabase.ts`, `stripe-client.ts`

**Functions:**
- React components: PascalCase function names (component conventions)
  - Example: `export function Header({ user }: { user: User })`
  - Example: `export default function PaymentForm({...})`
- Helper functions: camelCase
  - Example: `function handleInputChange(value: string)`
  - Example: `function searchPlaces(input: string)`
- Exported utility functions: camelCase
  - Example: `export function shouldSplitPayment(checkInDate: string)`
  - Example: `export function formatCents(cents: number)`

**Variables:**
- Local state and regular variables: camelCase
  - Example: `const [query, setQuery] = useState("")`
  - Example: `const [isOpen, setIsOpen] = useState(false)`
  - Example: `const [activeIndex, setActiveIndex] = useState(-1)`
- Constants (including constant objects/arrays): UPPER_SNAKE_CASE for truly immutable, camelCase for const references
  - Example: `const SUGGESTED_CITIES: SuggestedCity[] = [...]`
  - Example: `const policyLabels: Record<string, string> = {...}`
  - Example: `const amenityLabels: Record<string, { label: string; icon: React.ReactNode }> = {...}`

**Types:**
- Interfaces: PascalCase, descriptive nouns
  - Example: `interface Property`
  - Example: `interface CitySearchProps`
  - Example: `interface PaymentFormProps`
  - Example: `interface Review`
  - Example: `interface BookingDates`
- Type aliases: PascalCase for object types
  - Example: `type CancellationPolicy = "flessibile" | "moderata" | "rigida"`
  - Example: `type User = {...}`
- Generic parameters use single uppercase letters or descriptive names

## Code Style

**Formatting:**
- No Prettier config present (uses ESLint defaults)
- Implicit formatting follows Next.js + React conventions
- Consistent spacing around operators and function parameters
- Indentation: 2 spaces

**Linting:**
- ESLint v9 with Next.js integration
- Config: `eslint.config.mjs` (flat config format)
- Extends ESLint Next.js core-web-vitals and TypeScript rules
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

**TypeScript:**
- Strict mode enabled (`"strict": true`)
- Target: ES2017
- Module resolution: bundler
- Path aliases: `@/*` → `./src/*`
- No emit (`"noEmit": true`)
- Isolated modules enabled

## Import Organization

**Order:**
1. Next.js/React core imports (e.g., `import { useState } from "react"`)
2. Next.js utilities (e.g., `import { useRouter } from "next/navigation"`)
3. Third-party packages (e.g., `@stripe/react-stripe-js`, `@supabase/supabase-js`)
4. Local absolute imports with `@/` prefix (e.g., `import { createClient } from "@/lib/supabase/client"`)
5. Type imports marked with `type` keyword (e.g., `import type { User } from "@supabase/supabase-js"`)

**Examples from codebase:**
```typescript
// From /src/app/dashboard/components/header.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
```

```typescript
// From /src/app/api/webhook/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/admin-supabase";
import type Stripe from "stripe";
```

**Path Aliases:**
- Use `@/` for all internal imports
- No relative imports (except rare cases in same directory)
- Examples: `@/lib/*`, `@/app/*`, `@/components/*`

## Error Handling

**Patterns:**
- API routes use try-catch blocks with early returns
  - Example from `/src/app/api/booking/[id]/route.ts`:
    ```typescript
    try {
      // logic
    } catch (err) {
      console.error("Get booking error:", err);
      return NextResponse.json(
        { error: "Errore interno del server." },
        { status: 500 }
      );
    }
    ```

- API responses always include explicit status codes (400, 401, 403, 404, 500)
- Error responses are JSON with `{ error: string }` shape
- All user-facing errors use Italian localization

**Error Messages:**
- Consistent Italian error messages
  - "Non autenticato." (401 - Not authenticated)
  - "Non autorizzato." (403 - Not authorized)
  - "Prenotazione non trovata." (404 - Booking not found)
  - "Proprietà non trovata." (404 - Property not found)
  - "Dati mancanti per la prenotazione." (400 - Missing data)
  - "Errore interno del server." (500 - Server error)

- Client components show error states directly in UI (e.g., `{error && <div className="bg-red-50...">`)

## Logging

**Framework:** `console.error()` for error logging

**Patterns:**
- Errors logged only when caught in try-catch blocks
- Logs include context message + error object
- Examples:
  - `console.error("Webhook signature verification failed:", err);`
  - `console.error("Get booking error:", err);`
  - `console.error("Create payment intent error:", err);`

**When to Log:**
- API errors (all endpoints log on catch)
- Webhook processing errors
- Integration failures (Stripe, Supabase)
- No verbose/debug logging observed

## Comments

**When to Comment:**
- Inline comments explain complex business logic
  - Example: `// ── Legacy: Checkout Session events (for existing bookings) ──`
  - Example: `// Check authorization`
  - Example: `// Split payment info`

- Section dividers use dashes for visual organization
  - `// ── [Section Name] ──`

- Comments explain "why" not "what" (code is readable enough)

**JSDoc/TSDoc:**
- Minimal JSDoc usage observed
- Multi-line comments used for complex functions
  - Example from `/src/lib/payment-utils.ts`:
    ```typescript
    /**
     * Check-in > 7 giorni → split payment (30% acconto + 70% saldo)
     */
    export function shouldSplitPayment(checkInDate: string): boolean
    ```

  ```typescript
    /**
     * Calcola la percentuale di rimborso in base alla policy e al tempo al check-in.
     *
     * Flessibile: 100% fino a 24h prima, 50% nelle ultime 24h, 0% dopo check-in
     * Moderata:   100% fino a 5gg prima, 50% tra 5gg e 24h, 0% dopo
     * Rigida:     50% fino a 7gg prima, 0% dopo
     */
    export function calculateRefundPercent(...)
    ```

## Function Design

**Size:**
- Utility functions are small and focused (3-15 lines)
- Component hooks and handlers are compact (10-30 lines)
- Larger components (350+ lines) break complex logic into sub-functions
- No functions exceed ~400 lines

**Parameters:**
- Use object destructuring for multiple parameters
  - Example: `export function CitySearch({ onPlaceSelect }: CitySearchProps)`
  - Example: `export default function PaymentForm({ bookingId, paymentType, ... }: PaymentFormProps)`
- Single parameters passed directly (not destructured)
- Event handlers use arrow functions: `(e) => handleAction()`

**Return Values:**
- Explicit return types always specified for exported functions
- Early returns used liberally to reduce nesting
- Utility functions return specific types (boolean, number, string, object)
- Components return JSX.Element or React.ReactNode

**Null Handling:**
- Explicit nullability checks: `if (!value) return`
- Optional chaining for safe property access: `user.user_metadata?.full_name`
- Nullish coalescing for defaults: `user.email?.split("@")[0] || "Utente"`

## Module Design

**Exports:**
- Named exports for utilities and helpers
  - Example: `export function formatCents(cents: number): string`
  - Example: `export function shouldSplitPayment(checkInDate: string): boolean`

- Default exports for React components
  - Example: `export default function PaymentForm({...})`
  - Example: `export function Header({...})` (sometimes named for large components)

- Mixed usage: Some utils use named exports, page components use default

**Barrel Files:**
- No barrel files (`index.ts`) observed
- Each module imported directly by path
- Library structure: `src/lib/[module-name].ts`

**Component Organization:**
- Single component per file
- Props interfaces defined in same file with `ComponentNameProps` convention
- Internal helper functions in same file
- Constants/maps used only by component stay in same file

---

*Convention analysis: 2026-03-03*
