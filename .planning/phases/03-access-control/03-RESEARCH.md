# Phase 3: Access Control - Research

**Researched:** 2026-03-03
**Domain:** Next.js 16 middleware auth tier detection, Supabase SSR session reading, server-side header forwarding
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Anonymous users receive base responses (general property info, concierge) | Proxy already calls `supabase.auth.getUser()` and sets `x-user-id` only for authenticated users; route.ts uses absence of `x-user-id` to apply ANON system prompt — this wiring is already correct but untested for the anon path explicitly |
| AUTH-02 | Logged-in users receive full access (booking status, payments, personal data) | Proxy sets `x-user-id: <user.id>` server-side for authenticated users on `/api/chat`; route.ts reads this to apply AUTH system prompt — mechanism exists, needs explicit tests |
| AUTH-03 | Auth tier is determined server-side, never by client | `x-user-id` is set in proxy.ts (middleware), which runs before any route handler; clients cannot inject headers that survive the proxy's override because Next.js middleware controls the request headers forwarded to the route — the current implementation satisfies this but the security invariant needs a test |
| AUTH-04 | Middleware updated to permit anonymous access to `/chat` and `/api/chat` | Current proxy guards ONLY `/dashboard*` (redirect to login) and `/login`/`/register` (redirect to dashboard if auth). `/api/chat` has no redirect guard. `/chat` page doesn't exist yet but the proxy must not add a redirect guard for it — verify current matcher config and test explicitly |
</phase_requirements>

---

## Summary

Phase 3 is primarily a **verification and hardening phase**, not a feature-build phase. The core mechanism — reading the Supabase session in middleware (`proxy.ts`) and forwarding `x-user-id` as a server-set header — was already implemented in Phase 2 (specifically in plan 02-01 and 02-02). What Phase 3 must do is: (1) confirm the middleware's route permission rules explicitly allow `/chat` and `/api/chat` for anonymous users, (2) verify auth-tier detection is robust and covers all required behaviors with tests, and (3) ensure no client-side value can elevate access tier.

The critical security invariant (AUTH-03) is already structurally satisfied: `x-user-id` is written by `proxy.ts` (middleware) and the Next.js middleware runs before any route handler. However, there is one important edge case to verify: if a client sends an `x-user-id` header in the raw request, does the proxy correctly override it? Looking at the current proxy code, `x-user-id` is only SET when `user` is truthy. If `user` is null and the client sent `x-user-id`, the header passes through untouched to the route handler — **this is a security bug that must be fixed in Phase 3**. The fix: strip `x-user-id` from all incoming requests unconditionally, then only re-add it server-side when auth is confirmed.

The `/chat` route (PAGE-01/02) doesn't exist until Phase 9, but the middleware matcher is already permissive (no explicit guards for `/chat`). AUTH-04's work is to add explicit no-redirect logic for `/chat` to prevent future regressions when the page is added, and to add a test confirming anonymous users can hit `/api/chat` without redirect.

**Primary recommendation:** Fix the `x-user-id` header stripping bug, add regression tests for anonymous/authenticated route access, and document the security invariant. No new libraries needed — everything runs on existing `@supabase/ssr` + Next.js middleware.

---

## Standard Stack

### Core (already installed — no new installations required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | ^0.8.0 | Server-side session reading in middleware via `createServerClient` | Official Supabase pattern for Next.js App Router; handles cookie-based JWT refresh |
| `next` | 16.1.6 | Middleware execution via `proxy.ts` exports | Next.js 16 uses `proxy.ts` pattern — already wired |
| `@vercel/functions` | ^3.4.3 | `ipAddress()` for rate limiting | Already used in proxy.ts |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | ^4.0.18 | Test framework | All new tests for Phase 3 behavioral verification |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reading session in proxy.ts (middleware) | Reading session in each route handler | Route-handler approach duplicates session logic, creates attack surface in each handler; middleware approach is single, unforgeable source of truth |
| `x-user-id` header for tier signal | JWT claims forwarded directly | JWT decoding in route handler would require secret access in route scope; header approach keeps secret handling in middleware only |

**Installation:**
```bash
# No new packages required — all dependencies are already installed
```

---

## Architecture Patterns

### Recommended Project Structure

The structure does NOT change for Phase 3. All work is in existing files:

```
src/
├── proxy.ts                    # MODIFY: fix x-user-id stripping bug
├── proxy.test.ts               # MODIFY: add access-control tests
└── app/
    └── api/
        └── chat/
            ├── route.ts        # NO CHANGE (auth tier detection is correct)
            └── route.test.ts   # POSSIBLY ADD: explicit AUTH-01/AUTH-02 tests
```

### Pattern 1: Middleware-First Auth Tier Detection

**What:** The middleware (`proxy.ts`) is the only place that reads the Supabase session and determines auth tier. It forwards the result as a server-set header (`x-user-id`) to downstream route handlers. Route handlers are auth-tier consumers only — they never read cookies or JWTs directly.

**When to use:** Always. This is the established pattern from Phase 2.

**How it works in Next.js 16:**
```typescript
// src/proxy.ts — runs as Next.js middleware
// Next.js 16 resolves proxy.ts as the middleware module.
// The INNER_MIDDLEWARE_MODULE wiring (confirmed in .next/dev/server/middleware.js)
// wraps proxy() into the middleware execution chain.

export async function proxy(request: NextRequest) {
  // Session read happens HERE — in middleware, before any route handler
  const { data: { user } } = await supabase.auth.getUser()

  // Tier signal forwarded as unforgeable server-set header
  if (user) {
    requestHeaders.set('x-user-id', user.id)
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**Source:** Confirmed via `/Users/ninomarianolai/luxurystay/.next/dev/server/middleware.js` which shows `INNER_MIDDLEWARE_MODULE => "src/proxy.ts [middleware]"`.

### Pattern 2: Client Header Stripping (Security Fix)

**What:** Strip any client-supplied `x-user-id` header from ALL incoming requests BEFORE checking the session. Then only add it back server-side if `user` is truthy.

**Why it's necessary:** The current proxy.ts only sets `x-user-id` when `user` is truthy (inside the `if (user)` block). If `user` is null and the client sends `x-user-id: some-fake-id`, that header flows through to the route handler — which then treats the request as authenticated. This violates AUTH-03.

**Fix pattern:**
```typescript
// src/proxy.ts — CORRECT pattern (with stripping)
// Source: Security analysis of current proxy.ts implementation

export async function proxy(request: NextRequest) {
  // Step 1: Strip any client-supplied x-user-id BEFORE session check
  // This prevents clients from forging the auth tier signal
  const cleanedHeaders = new Headers(request.headers)
  cleanedHeaders.delete('x-user-id')
  const cleanedRequest = new Request(request, { headers: cleanedHeaders })

  // ... supabase session read ...

  if (request.nextUrl.pathname === '/api/chat') {
    // Step 2: Only add x-user-id server-side when auth is confirmed
    if (user) {
      requestHeaders.set('x-user-id', user.id)
    }
    // If !user, x-user-id is absent — route.ts reads absence as anonymous
  }
}
```

**Note:** The exact implementation approach (using `new Headers(request.headers)` mutability or `NextResponse.next({ request: { headers } })`) needs to be tested for correctness in the Next.js 16 middleware context.

### Pattern 3: Explicit Route Permission Documentation in Proxy

**What:** Make the proxy's route permission rules explicit with comments, covering all four cases:
1. `/dashboard*` — requires login (redirect to `/login` if anonymous)
2. `/api/chat` — open to anonymous (rate-limited differently by tier)
3. `/chat` — open to anonymous (no redirect guard, ever)
4. `/login`, `/register` — redirects to `/dashboard` if already logged in

**Why:** AUTH-04 requires that `/chat` and `/api/chat` never redirect anonymous users. Without explicit documentation, a future developer might add a redirect guard for `/chat` by mistake.

### Anti-Patterns to Avoid

- **Reading auth session in route handlers:** Route handlers run after middleware. Any session read in a route handler is redundant and creates a secondary attack surface. Always trust the `x-user-id` header set by the proxy.
- **Checking `x-user-id` with `truthy` on the raw client request:** The fix must happen at the top of `proxy()`, before any other logic, so the rest of the function works with a clean header state.
- **Using `request.headers.set()` directly:** `NextRequest` headers are read-only. Always create a new `Headers` object or use the `NextResponse.next({ request: { headers } })` pattern.
- **Forwarding x-user-id on non-chat routes:** The `x-user-id` forwarding is scoped to `/api/chat` only. Don't forward it globally — other routes don't need it and it unnecessarily exposes the user ID.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session reading in middleware | Custom JWT parsing / cookie decode | `@supabase/ssr` `createServerClient` + `getUser()` | Handles token refresh, key rotation, and the specific Supabase cookie format automatically |
| Auth tier propagation | Custom session store or Redis lookup in route handler | `x-user-id` header set by middleware | Headers are the standard inter-process signal in the request pipeline; Redis adds latency and an extra failure point |

**Key insight:** The Supabase session state is already available in the middleware execution context via cookies. Adding any secondary lookup (Redis, database) for auth tier would be redundant and slower than reading from the cookie that's already on the request.

---

## Common Pitfalls

### Pitfall 1: Client Header Forgery (Current Bug)

**What goes wrong:** An anonymous user sends `x-user-id: real-user-uuid` in their request headers. The proxy checks the session (gets `null`), doesn't enter the `if (user)` block, and never strips or overwrites the header. The header passes through to `route.ts`, which reads `req.headers.get('x-user-id')` and gets a non-null value — treating the request as authenticated.

**Why it happens:** The current proxy only ADDS `x-user-id` when auth is confirmed. It doesn't REMOVE it when auth is absent.

**How to avoid:** Strip `x-user-id` at the top of `proxy()`, before session reading. Then re-add it only if `user` is truthy.

**Warning signs:** A test where an unauthenticated request includes `x-user-id: fake` succeeds in getting the authenticated system prompt.

### Pitfall 2: NextRequest Header Immutability

**What goes wrong:** Code attempts `request.headers.set('x-user-id', ...)` and gets a runtime error or silent no-op.

**Why it happens:** `NextRequest.headers` is a read-only `Headers` instance in Next.js middleware.

**How to avoid:** Always construct new headers and pass via `NextResponse.next({ request: { headers: newHeaders } })`. The proxy already does this correctly for the add case — apply the same pattern to the strip case.

**Warning signs:** Header changes aren't reflected in route handler; TypeScript error on `request.headers.set()`.

### Pitfall 3: Cookie Refresh Breaking Response

**What goes wrong:** The proxy calls `supabase.auth.getUser()` which may trigger a token refresh, writing new cookies to `supabaseResponse`. If the code then creates a NEW `NextResponse.next()` for the header-stripping logic and doesn't carry over the refreshed cookies, the session gets corrupted.

**Why it happens:** Each `NextResponse.next()` call starts fresh — it doesn't inherit cookies from a previous `supabaseResponse`.

**How to avoid:** When building the clean request headers, copy them into the same `supabaseResponse` that already has the refreshed cookies, OR merge cookies from `supabaseResponse` into the new response. The current proxy already has this pattern for the add-header case (it creates `supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })`). The strip-then-add refactor must maintain this invariant.

**Warning signs:** Users get logged out intermittently after middleware changes; Supabase session refresh stops working.

### Pitfall 4: Matcher Excluding /chat

**What goes wrong:** The middleware `config.matcher` pattern accidentally excludes `/chat` from middleware processing. The middleware never runs for `/chat` requests — which means `x-user-id` is never set even for authenticated users visiting `/chat`.

**Why it matters:** Phase 9 will create a `/chat` page. If the middleware doesn't run for it, authenticated users won't get their tier signal for any server-side components on that page.

**How to avoid:** The current matcher `/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)` correctly INCLUDES `/chat` (it only excludes static assets). Verify this is unchanged.

### Pitfall 5: Middleware Not Found (Next.js 16 Proxy Pattern)

**What goes wrong:** In Next.js 16, the middleware file must be at `src/middleware.ts` OR the project must use the proxy pattern (exporting `proxy` from `proxy.ts` with a `config` export, wired via Next.js internals). There is NO `src/middleware.ts` in this project — the proxy pattern is used. Breaking or renaming `proxy.ts` will silently break all middleware behavior.

**Why it matters:** Phase 3 edits `proxy.ts`. If the file is accidentally split or renamed, middleware stops working.

**How to avoid:** Keep all middleware logic in `proxy.ts`. The Next.js 16 dev server confirms the wiring via the compiled `.next/dev/server/middleware.js`.

---

## Code Examples

### Security Fix: Strip Client x-user-id Before Session Check

```typescript
// src/proxy.ts — corrected implementation
// Source: Analysis of current proxy.ts + Next.js middleware header handling

export async function proxy(request: NextRequest) {
  // SECURITY: Strip any client-supplied x-user-id header.
  // Clients cannot forge the auth tier — only this proxy sets x-user-id.
  // We must strip BEFORE creating supabaseResponse to ensure clean state.
  const strippedHeaders = new Headers(request.headers)
  strippedHeaders.delete('x-user-id')

  // Build the request with the stripped headers for downstream use
  let supabaseResponse = NextResponse.next({
    request: { headers: strippedHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()  // Read from original request
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: { headers: strippedHeaders },  // Keep stripped headers
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (request.nextUrl.pathname === '/api/chat') {
    // ... rate limiting ...

    // Only set x-user-id server-side when auth is confirmed
    if (user) {
      const requestHeaders = new Headers(strippedHeaders)
      requestHeaders.set('x-user-id', user.id)
      supabaseResponse = NextResponse.next({
        request: { headers: requestHeaders },
      })
    }
    // If !user: x-user-id absent — route.ts treats as anonymous (correct)
  }

  // Existing auth guards — unchanged
  const pathname = request.nextUrl.pathname

  // /dashboard requires login
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // /chat and /api/chat: NO redirect guard — anonymous access permitted (AUTH-04)

  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### Test: Anonymous Request Cannot Forge Auth Tier (AUTH-03)

```typescript
// src/proxy.test.ts — new test for AUTH-03 security invariant

it('strips client-supplied x-user-id — anonymous user cannot forge auth tier', async () => {
  // User is NOT authenticated in Supabase
  mockGetUser.mockResolvedValue({ data: { user: null } })

  // But client sends a forged x-user-id header
  const request = new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'x-user-id': 'forged-user-id-12345' },
  })

  const nextSpy = vi.spyOn(NextResponse, 'next')
  await proxy(request)

  // Verify no NextResponse.next was called with x-user-id = forged value
  const allCalls = nextSpy.mock.calls
  for (const call of allCalls) {
    const requestArg = call[0] as { request?: { headers?: Headers } } | undefined
    const headers = requestArg?.request?.headers
    expect(headers?.get('x-user-id')).not.toBe('forged-user-id-12345')
    expect(headers?.get('x-user-id')).toBeNull()
  }

  nextSpy.mockRestore()
})
```

### Test: Anonymous User Can Access /api/chat (AUTH-04)

```typescript
// src/proxy.test.ts — new test for AUTH-04

it('does NOT redirect anonymous users from /api/chat to /login', async () => {
  mockGetUser.mockResolvedValue({ data: { user: null } })

  const request = new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
  })

  // Mock rate limiter to allow
  anonRatelimitMock.limit.mockResolvedValue({ success: true, remaining: 14, reset: Date.now() + 60000 })

  const response = await proxy(request)

  expect(response.status).not.toBe(302)
  expect(response.status).not.toBe(307)
  expect(response.status).not.toBe(308)
  // Should be a NextResponse.next() (200 pass-through)
})
```

### Test: Authenticated User Session Detected Server-Side (AUTH-02)

```typescript
// src/proxy.test.ts — verify x-user-id is set for authenticated users

it('sets x-user-id server-side for authenticated users on /api/chat (AUTH-02)', async () => {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'real-user-uuid' } } })

  const request = new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    // No x-user-id in client request (clean case)
  })

  const nextSpy = vi.spyOn(NextResponse, 'next')
  await proxy(request)

  const lastCall = nextSpy.mock.calls[nextSpy.mock.calls.length - 1]
  const requestArg = lastCall?.[0] as { request?: { headers?: Headers } } | undefined
  const headers = requestArg?.request?.headers

  expect(headers?.get('x-user-id')).toBe('real-user-uuid')
  nextSpy.mockRestore()
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with default export | `proxy.ts` with named `proxy` export + `config` | Next.js 16 (this project) | Next.js 16 changed middleware module resolution — no `src/middleware.ts` exists, `proxy.ts` is used directly |
| `request.ip` for IP detection | `ipAddress()` from `@vercel/functions` | Next.js 15+ | `request.ip` removed; already handled in Phase 2 |
| `toDataStreamResponse()` | `toUIMessageStreamResponse()` | Vercel AI SDK v6 | Already handled in Phase 1 |

**Deprecated/outdated (confirmed not in use):**
- `request.ip`: Removed in Next.js 15, not used (Phase 2 decision)
- `src/middleware.ts`: Not present; `proxy.ts` is the middleware module

---

## Open Questions

1. **Does Next.js 16 middleware strip request headers from client before passing to the middleware function?**
   - What we know: The Next.js middleware receives the raw incoming request, including all headers the client sent
   - What's unclear: Whether Next.js itself strips certain headers (like `x-user-id`) before the `proxy()` function sees them
   - Recommendation: Treat as if Next.js does NOT strip headers — implement explicit stripping in `proxy.ts` to guarantee the security invariant regardless of Next.js version behavior

2. **Does the `supabaseResponse` cookie-carry-through work correctly with the stripped-headers refactor?**
   - What we know: The current proxy creates `supabaseResponse = NextResponse.next({ request })` initially, then potentially replaces it when cookies are refreshed
   - What's unclear: Whether using `strippedHeaders` in the initial `NextResponse.next()` call instead of the raw `request` affects cookie propagation
   - Recommendation: Write an integration-style test that verifies cookies are still set on the response after the refactor

3. **Should `/chat` have an explicit no-redirect comment or a test even though the page doesn't exist until Phase 9?**
   - What we know: The middleware matcher includes all non-static routes; no redirect guard for `/chat` exists
   - What's unclear: Whether the planner should add a test for `/chat` route pass-through now (Phase 3) or defer to Phase 9
   - Recommendation: Add the comment in `proxy.ts` now (serves as documentation contract), but defer the `/chat` page-level test to Phase 9 when the page actually exists

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `/Users/ninomarianolai/luxurystay/src/proxy.ts` — current middleware implementation
- Direct code inspection: `/Users/ninomarianolai/luxurystay/src/app/api/chat/route.ts` — current route handler
- Direct code inspection: `/Users/ninomarianolai/luxurystay/.next/dev/server/middleware.js` — confirms `proxy.ts` is wired as `INNER_MIDDLEWARE_MODULE`
- Direct code inspection: `/Users/ninomarianolai/luxurystay/src/proxy.test.ts` — existing test coverage
- Direct code inspection: `/Users/ninomarianolai/luxurystay/src/app/api/chat/route.test.ts` — existing route tests
- `/Users/ninomarianolai/luxurystay/.planning/STATE.md` — accumulated project decisions
- `/Users/ninomarianolai/luxurystay/.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04 definitions

### Secondary (MEDIUM confidence)
- Next.js middleware header handling behavior: based on Next.js 15/16 documentation patterns and the `@supabase/ssr` middleware guide (https://supabase.com/docs/guides/auth/server-side/nextjs) — the `createServerClient` cookie pattern is the official recommended approach

### Tertiary (LOW confidence)
- Whether Next.js 16 itself strips `x-user-id` client headers: not verified against official docs, treated as "does not strip" for safety

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all packages confirmed in package.json
- Architecture: HIGH — confirmed via direct code inspection of proxy.ts, route.ts, and compiled middleware
- Security bug (header stripping): HIGH — identified via direct code analysis; the `if (user)` block structure makes the vulnerability unambiguous
- Pitfalls: HIGH for confirmed patterns; MEDIUM for cookie carry-through behavior under refactor
- Test patterns: HIGH — match existing vitest patterns in proxy.test.ts

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable Next.js + Supabase patterns; no fast-moving dependencies for this phase)
