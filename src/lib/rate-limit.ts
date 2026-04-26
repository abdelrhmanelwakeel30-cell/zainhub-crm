/**
 * Rate limiting — Upstash Redis backed with graceful in-memory fallback.
 *
 * Closes Fix-004 / S-008 / S-002 / part of S-003.
 *
 * **Production:** set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 * (and the legacy `UPSTASH_REDIS_URL` / `UPSTASH_REDIS_TOKEN` aliases also work).
 * Redis-backed limiters survive serverless cold starts.
 *
 * **Development / unconfigured:** falls back to a per-process in-memory limiter
 * with a warning. Functional in dev; **not safe** in production multi-instance
 * deployments — the boot warning makes this loud.
 *
 * Usage:
 *
 *   import { loginRateLimit, apiRateLimit, exportRateLimit, otpVerifyRateLimit } from '@/lib/rate-limit'
 *   const r = await loginRateLimit.limit(`login:${email.toLowerCase()}`)
 *   if (!r.success) return 429
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface LimitResult {
  success: boolean
  remaining: number
  reset: number
}

interface Limiter {
  limit(identifier: string): Promise<LimitResult>
}

// D-008: only the canonical _REST_* names. The legacy _URL/_TOKEN names
// are intentionally NOT supported to avoid silent fallbacks where two
// modules read different vars.
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

const upstashConfigured = Boolean(REDIS_URL && REDIS_TOKEN)

if (!upstashConfigured) {
  // Single boot-time warning — not a per-request log.
  console.warn(
    '[rate-limit] UPSTASH_REDIS_* env vars not set. Falling back to in-memory ' +
      'rate limiter — DO NOT deploy this state to production with multiple instances. ' +
      'Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to enable Redis-backed limits.',
  )
}

/**
 * Per-process in-memory sliding-window limiter. Used only when Upstash is not
 * configured. Same shape as Upstash's Ratelimit.limit() return type.
 */
function inMemoryLimiter(maxRequests: number, windowMs: number): Limiter {
  const buckets = new Map<string, number[]>()
  return {
    async limit(identifier: string): Promise<LimitResult> {
      const now = Date.now()
      const cutoff = now - windowMs
      const hits = (buckets.get(identifier) ?? []).filter((t) => t > cutoff)
      if (hits.length >= maxRequests) {
        const reset = hits[0] + windowMs
        buckets.set(identifier, hits)
        return { success: false, remaining: 0, reset }
      }
      hits.push(now)
      buckets.set(identifier, hits)
      // Lazy GC: every ~256 inserts, prune empty buckets.
      if (buckets.size > 256) {
        for (const [k, v] of buckets.entries()) {
          const fresh = v.filter((t) => t > cutoff)
          if (fresh.length === 0) buckets.delete(k)
          else buckets.set(k, fresh)
        }
      }
      return { success: true, remaining: maxRequests - hits.length, reset: now + windowMs }
    },
  }
}

/** Build a limiter — Redis if configured, otherwise the in-memory fallback. */
function build(opts: {
  prefix: string
  max: number
  windowSeconds: number
  windowFancy: `${number} ${'s' | 'm' | 'h' | 'd'}`
}): Limiter {
  if (upstashConfigured) {
    const redis = new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! })
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(opts.max, opts.windowFancy),
      analytics: true,
      prefix: opts.prefix,
    })
  }
  return inMemoryLimiter(opts.max, opts.windowSeconds * 1000)
}

/** 5 attempts / 15 min per (email or IP). Used by NextAuth Credentials authorize() and portal login. */
export const loginRateLimit = build({
  prefix: 'ratelimit:login',
  max: 5,
  windowSeconds: 15 * 60,
  windowFancy: '15 m',
})

/** 100 requests / minute per IP+route. Applied in middleware to /api/*. */
export const apiRateLimit = build({
  prefix: 'ratelimit:api',
  max: 100,
  windowSeconds: 60,
  windowFancy: '1 m',
})

/** 10 export downloads / hour per user. Heavier endpoints (PDF, CSV). */
export const exportRateLimit = build({
  prefix: 'ratelimit:export',
  max: 10,
  windowSeconds: 60 * 60,
  windowFancy: '1 h',
})

/** 5 OTP verify attempts / 15 min per phone. Closes the brute-force gap that paired with S-001. */
export const otpVerifyRateLimit = build({
  prefix: 'ratelimit:otp-verify',
  max: 5,
  windowSeconds: 15 * 60,
  windowFancy: '15 m',
})

export const rateLimitConfigured = upstashConfigured
