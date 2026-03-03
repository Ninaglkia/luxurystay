/**
 * Tests for proxy.ts — Next.js 16 proxy with rate limiting and x-user-id forwarding
 *
 * TDD RED phase: Tests written before proxy.ts implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock @upstash/ratelimit
vi.mock('@/lib/ratelimit', () => ({
  anonRatelimit: {
    limit: vi.fn().mockResolvedValue({ success: true, remaining: 14, reset: Date.now() + 60000 }),
  },
  authRatelimit: {
    limit: vi.fn().mockResolvedValue({ success: true, remaining: 29, reset: Date.now() + 60000 }),
  },
}))

// Mock @vercel/functions
vi.mock('@vercel/functions', () => ({
  ipAddress: vi.fn().mockReturnValue('127.0.0.1'),
}))

// Mock @supabase/ssr
const mockGetUser = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

describe('proxy.ts', () => {
  let proxy: (request: NextRequest) => Promise<Response>
  let config: { matcher: string[] }
  let anonRatelimitMock: { limit: ReturnType<typeof vi.fn> }
  let authRatelimitMock: { limit: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Default: unauthenticated user
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const ratelimitModule = await import('@/lib/ratelimit')
    anonRatelimitMock = ratelimitModule.anonRatelimit as unknown as { limit: ReturnType<typeof vi.fn> }
    authRatelimitMock = ratelimitModule.authRatelimit as unknown as { limit: ReturnType<typeof vi.fn> }

    // Reset rate limiter mocks to defaults
    anonRatelimitMock.limit.mockResolvedValue({ success: true, remaining: 14, reset: Date.now() + 60000 })
    authRatelimitMock.limit.mockResolvedValue({ success: true, remaining: 29, reset: Date.now() + 60000 })

    const module = await import('./proxy')
    proxy = module.proxy
    config = module.config
  })

  // Test 1: proxy function is exported (not middleware)
  it('exports a function named proxy (not middleware) for Next.js 16 compatibility', async () => {
    expect(typeof proxy).toBe('function')
    const module = await import('./proxy')
    expect(module).toHaveProperty('proxy')
    expect(module).not.toHaveProperty('middleware')
  })

  // Test 2: config.matcher is unchanged from middleware.ts
  it('exports config.matcher matching the original middleware pattern', () => {
    expect(config).toBeDefined()
    expect(config.matcher).toEqual([
      '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ])
  })

  // Test 3: Rate limiter returns success=false → 429 response
  it('returns 429 when rate limiter returns success=false', async () => {
    anonRatelimitMock.limit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 30000,
    })

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
    })

    const response = await proxy(request)
    expect(response.status).toBe(429)

    const body = await response.json()
    expect(body.error).toBe('Too many requests. Please try again later.')
  })

  // Test 4: Rate limiter returns success=true → not 429
  it('does not return 429 when rate limiter returns success=true', async () => {
    anonRatelimitMock.limit.mockResolvedValue({
      success: true,
      remaining: 14,
      reset: Date.now() + 60000,
    })

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
    })

    const response = await proxy(request)
    expect(response.status).not.toBe(429)
  })

  // Test 5: Rate limiting only applies to /api/chat
  it('does not rate-limit requests to non-/api/chat paths', async () => {
    const request = new NextRequest('http://localhost:3000/about', {
      method: 'GET',
    })

    await proxy(request)

    expect(anonRatelimitMock.limit).not.toHaveBeenCalled()
    expect(authRatelimitMock.limit).not.toHaveBeenCalled()
  })

  // Test 6: Anonymous users use anonRatelimit, authenticated users use authRatelimit
  it('uses anonRatelimit for anonymous users on /api/chat', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
    })

    await proxy(request)

    expect(anonRatelimitMock.limit).toHaveBeenCalled()
    expect(authRatelimitMock.limit).not.toHaveBeenCalled()
  })

  it('uses authRatelimit for authenticated users on /api/chat', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
    })

    await proxy(request)

    expect(authRatelimitMock.limit).toHaveBeenCalled()
    expect(anonRatelimitMock.limit).not.toHaveBeenCalled()
  })

  // Test 7: Authenticated request to /api/chat carries x-user-id header
  it('forwards x-user-id header for authenticated users on /api/chat', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc-123' } } })

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
    })

    // Spy on NextResponse.next to capture header forwarding
    const nextSpy = vi.spyOn(NextResponse, 'next')

    await proxy(request)

    // The last call to NextResponse.next should include the x-user-id header
    const lastCall = nextSpy.mock.calls[nextSpy.mock.calls.length - 1]
    const requestArg = lastCall?.[0] as { request?: { headers?: Headers } } | undefined
    const headers = requestArg?.request?.headers

    expect(headers).toBeDefined()
    expect(headers?.get('x-user-id')).toBe('user-abc-123')

    nextSpy.mockRestore()
  })
})
