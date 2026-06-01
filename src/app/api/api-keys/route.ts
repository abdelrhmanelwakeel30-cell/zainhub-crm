import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { generateApiKey } from '@/lib/agent-auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

/**
 * Tenant public API keys (S-5). A key acts AS its owner user's RBAC. The full
 * secret (zpk_…) is shown ONCE at creation; only its sha256 hash is stored.
 */
const createSchema = z.object({ name: z.string().min(1).max(80) })

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

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('settings:edit')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user

  const parsed = await parseJson(req, createSchema)
  if (parsed instanceof NextResponse) return parsed

  try {
    const { key, keyHash, keyPrefix } = generateApiKey()
    const created = await prisma.apiKey.create({
      data: { tenantId, userId, name: parsed.data.name, keyHash, keyPrefix, scopes: [] },
      select: { id: true, name: true, keyPrefix: true, createdAt: true },
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'api_key', entityId: created.id, entityName: parsed.data.name },
    })
    // key returned once, never stored in plaintext
    return NextResponse.json({ success: true, data: { ...created, key } }, { status: 201 })
  } catch (err) {
    log.error('POST /api/api-keys', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
