// src/lib/ratelimit.ts
// Source: https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Single Redis connection (HTTP-based, connectionless — safe in serverless)
const redis = Redis.fromEnv()

// Anonymous: 15 requests per minute (locked decision — do not change)
export const anonRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "1 m"),
  prefix: "ratelimit:anon",
  analytics: true,
})

// Authenticated: 30 requests per minute (locked decision — do not change)
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "ratelimit:auth",
  analytics: true,
})
