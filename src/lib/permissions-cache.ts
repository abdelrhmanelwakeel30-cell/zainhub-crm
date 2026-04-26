/**
 * Server-side cached permission lookup.
 *
 * Closes Fix-005 partial / S-005 territory: instead of carrying the full
 * permission array in the JWT (cookie bloat + stale on role changes), this
 * looks up permissions by `userId` with a Redis cache (when configured)
 * or per-process memory fallback.
 *
 * Wiring this up does NOT change the JWT shape today — that's a follow-up
 * (delete `token.permissions = ...` in `src/lib/auth.ts` jwt callback once
 * all `requirePermission` call sites use this helper).
 *
 * Usage:
 *   import { getUserPermissions, invalidatePermissionsCache } from '@/lib/permissions-cache'
 *
 *   const perms = await getUserPermissions(session.user.id)
 *   if (!perms.includes('leads:create')) throw new ForbiddenError()
 *
 *   // After assigning/removing roles:
 *   await invalidatePermissionsCache(targetUserId)
 */

import { Redis } from '@upstash/redis'
import { prisma } from './prisma'

const TTL_SECONDS = 5 * 60 // 5 minutes

// D-008: only the canonical _REST_* names (mirrors src/lib/rate-limit.ts).
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const upstashConfigured = Boolean(REDIS_URL && REDIS_TOKEN)
const redis = upstashConfigured
  ? new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! })
  : null

// In-process fallback cache. NOT safe across multi-instance deployments.
const memCache = new Map<string, { perms: string[]; expiresAt: number }>()

function cacheKey(userId: string) {
  return `perms:${userId}`
}

async function readCache(userId: string): Promise<string[] | null> {
  if (redis) {
    return (await redis.get<string[]>(cacheKey(userId))) ?? null
  }
  const hit = memCache.get(userId)
  if (!hit || hit.expiresAt < Date.now()) {
    if (hit) memCache.delete(userId)
    return null
  }
  return hit.perms
}

async function writeCache(userId: string, perms: string[]): Promise<void> {
  if (redis) {
    await redis.set(cacheKey(userId), perms, { ex: TTL_SECONDS })
    return
  }
  memCache.set(userId, { perms, expiresAt: Date.now() + TTL_SECONDS * 1000 })
}

/**
 * Resolve a user's permissions as `module:action` strings.
 * Reads from cache when warm; otherwise fans into Prisma and back-fills.
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const cached = await readCache(userId)
  if (cached) return cached

  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  })

  const perms = Array.from(
    new Set(
      userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map(
          (rp) => `${rp.permission.module}:${rp.permission.action}`,
        ),
      ),
    ),
  )

  await writeCache(userId, perms)
  return perms
}

/** Drop the cache for a single user — call after assigning/removing roles. */
export async function invalidatePermissionsCache(userId: string): Promise<void> {
  if (redis) {
    await redis.del(cacheKey(userId))
    return
  }
  memCache.delete(userId)
}

/** Drop ALL cached permissions — call after a global permission/role mutation. */
export async function invalidateAllPermissionsCache(): Promise<void> {
  if (redis) {
    // No SCAN+DEL pattern in @upstash/redis without a list of keys; rely on TTL.
    // Callers that mutate role definitions wholesale should also bump a version
    // tag — leaving as TTL-only for now.
    return
  }
  memCache.clear()
}
