// src/proxy.ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
//         https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted
//         https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package

import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { ipAddress } from "@vercel/functions"

export async function proxy(request: NextRequest) {
  // SECURITY: Strip any client-supplied x-user-id. This header is set exclusively
  // by this proxy — clients cannot forge the auth tier signal.
  // Must strip BEFORE supabaseResponse construction so stripped headers propagate everywhere.
  const strippedHeaders = new Headers(request.headers)
  strippedHeaders.delete('x-user-id')

  let supabaseResponse = NextResponse.next({
    request: { headers: strippedHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Use strippedHeaders so the stripped state carries into refreshed session responses
          supabaseResponse = NextResponse.next({ request: { headers: strippedHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rate limit /api/chat only — other routes are unaffected
  if (request.nextUrl.pathname === "/api/chat") {
    // CRITICAL: Use ipAddress() from @vercel/functions — request.ip was removed in Next.js 15
    // Lazy import — avoid crashing all routes if Redis is unreachable
    const { anonRatelimit, authRatelimit } = await import("@/lib/ratelimit")

    const ip = ipAddress(request) ?? "anonymous"
    const identifier = user ? `auth:${user.id}` : `anon:${ip}`
    const limiter = user ? authRatelimit : anonRatelimit

    const { success, reset } = await limiter.limit(identifier)

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      )
    }

    // Forward auth tier signal to route handler — set server-side, cannot be forged by client.
    // route.ts (plan 02-02) reads this header to select the correct system prompt tier.
    if (user) {
      const requestHeaders = new Headers(strippedHeaders)
      requestHeaders.set("x-user-id", user.id)
      supabaseResponse = NextResponse.next({
        request: { headers: requestHeaders },
      })
    }
  }

  const pathname = request.nextUrl.pathname

  // Route permission contract (AUTH-04):
  // /api/chat — open to anonymous users (rate-limited, no redirect guard)
  // /chat     — open to anonymous users (no redirect guard, ever — see Phase 9)
  // /dashboard* — requires login (redirect to /login below)
  // /login, /register — redirect to /dashboard if already logged in

  // Preserve existing auth guards — unchanged from middleware.ts
  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
