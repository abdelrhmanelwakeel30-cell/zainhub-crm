import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { withApi } from '@/lib/api-route'
import { generateApiKey } from '@/lib/agent-auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

/**
 * Tenant public API keys (S-5). A key acts AS its owner user's RBAC. The full
 * secret (zpk_…) is shown ONCE at creation; only its sha256 hash is stored.
 */
const createSchema = z.object({ name: z.string().min(1).max(80) })
type CreateBody = z.infer<typeof createSchema>

export async function GET() {
  const guard = await requireApiPermission('settings:view')
  if (!guard.ok) return guard.response
  try {
    const data = await prisma.apiKey.findMany({
      where: { tenantId: guard.session.user.tenantId },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, revokedAt: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    log.error('GET /api/api-keys', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// F-4: refactored to the shared route factory.
export const POST = withApi<CreateBody>(
  async ({ tenantId, userId, body }) => {
    const { key, keyHash, keyPrefix } = generateApiKey()
    const created = await prisma.apiKey.create({
      data: { tenantId, userId, name: body.name, keyHash, keyPrefix, scopes: [] },
      select: { id: true, name: true, keyPrefix: true, createdAt: true },
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'api_key', entityId: created.id, entityName: body.name },
    })
    // key returned once, never stored in plaintext
    return NextResponse.json({ success: true, data: { ...created, key } }, { status: 201 })
  },
  { permission: 'settings:edit', schema: createSchema, label: 'POST /api/api-keys' },
)
