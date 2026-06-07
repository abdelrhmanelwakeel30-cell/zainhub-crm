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

/** Mint a new agent API key (zhk_). */
export function generateAgentKey(): GeneratedAgentKey {
  const key = KEY_PREFIX + randomBytes(24).toString('hex')
  return { key, keyHash: hashKey(key), keyPrefix: key.slice(0, 12) }
}

/** Mint a new tenant/public API key (zpk_) — S-5. */
export function generateApiKey(): GeneratedAgentKey {
  const key = 'zpk_' + randomBytes(24).toString('hex')
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

// Accepts agent keys (zhk_) and tenant/public API keys (zpk_).
const PUBLIC_KEY_PREFIX = 'zpk_'
function isKey(s: string): boolean {
  return s.startsWith(KEY_PREFIX) || s.startsWith(PUBLIC_KEY_PREFIX)
}
function extractKeyFromHeaders(h: Headers): string | null {
  const auth = h.get('authorization')
  if (auth?.startsWith('Bearer ') && isKey(auth.slice(7))) return auth.slice(7).trim()
  const x = h.get('x-agent-key') ?? h.get('x-api-key')
  if (x && isKey(x)) return x.trim()
  return null
}

const userInclude = {
  tenant: true,
  userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
} as const

type UserWithRoles = {
  id: string; tenantId: string; status: string; isServiceAccount: boolean; firstName: string; lastName: string; email: string
  tenant: { name: string; slug: string; primaryColor: string; secondaryColor: string }
  userRoles: { role: { name: string; rolePermissions: { permission: { module: string; action: string } }[] } }[]
}

function sessionFromUser(user: UserWithRoles): Session {
  const roles = user.userRoles.map((ur) => ur.role.name)
  const permissions = Array.from(
    new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`))),
  )
  return {
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
}

/**
 * Build a NextAuth-compatible Session from an agent key (zhk_) or a tenant
 * public API key (zpk_). Permissions come from the owner user's roles.
 */
async function buildAgentSession(keyHash: string): Promise<Session | null> {
  // 1) Agent service-account keys.
  const agentKey = await prisma.agentApiKey.findUnique({ where: { keyHash }, include: { user: { include: userInclude } } })
  if (agentKey && !agentKey.revokedAt && constantTimeEqualHex(agentKey.keyHash, keyHash)) {
    const user = agentKey.user
    if (user && user.status === 'ACTIVE' && user.isServiceAccount) {
      prisma.agentApiKey.update({ where: { id: agentKey.id }, data: { lastUsedAt: new Date() } }).catch((err) => log.warn('[agent-auth] lastUsedAt update failed', { err }))
      return sessionFromUser(user as UserWithRoles)
    }
  }

  // 2) Tenant/public API keys (S-5).
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash }, include: { user: { include: userInclude } } })
  if (apiKey && !apiKey.revokedAt && constantTimeEqualHex(apiKey.keyHash, keyHash)) {
    const user = apiKey.user
    if (user && user.status === 'ACTIVE') {
      prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch((err) => log.warn('[agent-auth] apiKey lastUsedAt update failed', { err }))
      return sessionFromUser(user as UserWithRoles)
    }
  }

  return null
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
