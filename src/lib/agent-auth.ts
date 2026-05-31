/**
 * Programmatic authentication for AI agents (the paperclip 166-agent platform).
 *
 * Agents do not have browser sessions. Each agent has a CRM `User`
 * (isServiceAccount=true) and one `AgentApiKey`. The agent presents its key as
 * `Authorization: Bearer zhk_...` (or `x-agent-key: zhk_...`). We resolve it to
 * a NextAuth-compatible `Session`, so EVERY existing API route + RBAC guard
 * (getApiSession / requireApiPermission) works for agents with zero changes.
 *
 * The CRM MCP server is the intended caller, but any HTTP client with a valid
 * key works (n8n, Make, scripts).
 */

import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { headers } from 'next/headers'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

const KEY_PREFIX = 'zhk_'

export interface GeneratedAgentKey {
  /** The full secret — shown ONCE at creation, never stored in plaintext. */
  key: string
  /** sha256 hex of the key — stored in AgentApiKey.keyHash. */
  keyHash: string
  /** First 12 chars, safe to store/display for identification. */
  keyPrefix: string
}

/** Mint a new agent API key. */
export function generateAgentKey(): GeneratedAgentKey {
  const key = KEY_PREFIX + randomBytes(24).toString('hex')
  return { key, keyHash: hashKey(key), keyPrefix: key.slice(0, 12) }
}

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

function extractKeyFromHeaders(h: Headers): string | null {
  const auth = h.get('authorization')
  if (auth?.startsWith('Bearer ') && auth.slice(7).startsWith(KEY_PREFIX)) {
    return auth.slice(7).trim()
  }
  const x = h.get('x-agent-key')
  if (x?.startsWith(KEY_PREFIX)) return x.trim()
  return null
}

/**
 * Build a NextAuth-compatible Session from an agent's CRM user.
 * Permissions are derived from the user's roles → rolePermissions, exactly like
 * the NextAuth authorize() callback.
 */
async function buildAgentSession(keyHash: string): Promise<Session | null> {
  const apiKey = await prisma.agentApiKey.findUnique({
    where: { keyHash },
    include: {
      user: {
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: { include: { rolePermissions: { include: { permission: true } } } },
            },
          },
        },
      },
    },
  })

  if (!apiKey || apiKey.revokedAt) return null
  // Defence-in-depth: the lookup is by unique sha256 hash, but compare in
  // constant time so a malformed/colliding hash can't be probed by timing.
  if (!constantTimeEqualHex(apiKey.keyHash, keyHash)) return null

  const user = apiKey.user
  if (!user || user.status !== 'ACTIVE' || !user.isServiceAccount) return null

  const roles = user.userRoles.map((ur) => ur.role.name)
  const permissions = Array.from(
    new Set(
      user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`),
      ),
    ),
  )

  // Touch lastUsedAt without blocking the request.
  prisma.agentApiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch((err) => log.warn('[agent-auth] lastUsedAt update failed', { err, agentId: apiKey.agentId }))

  const session = {
    user: {
      id: user.id,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      tenantSlug: user.tenant.slug,
      firstName: user.firstName,
      lastName: user.lastName,
      primaryColor: user.tenant.primaryColor,
      secondaryColor: user.tenant.secondaryColor,
      roles,
      permissions,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
    },
    expires: '',
  } as unknown as Session

  return session
}

/**
 * Resolve an agent Session from the incoming request headers, or null if there
 * is no valid agent key. Safe to call in any API route handler.
 */
export async function getAgentSession(): Promise<Session | null> {
  let h: Headers
  try {
    h = await headers()
  } catch {
    return null
  }
  const key = extractKeyFromHeaders(h)
  if (!key) return null
  try {
    return await buildAgentSession(hashKey(key))
  } catch (err) {
    log.error('[agent-auth] failed to resolve agent session', { err })
    return null
  }
}
