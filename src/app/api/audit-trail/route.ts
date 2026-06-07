import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { parseQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

/**
 * Per-record audit trail (C-7). Returns the who/what/when history for a single
 * entity, tenant-scoped. Visible to any authenticated user in the tenant (the
 * full cross-entity admin log lives at /api/admin/audit-log and is role-gated).
 */
const query = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().min(1).max(64),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, query)
  if (q instanceof NextResponse) return q
  const { entityType, entityId, limit } = q.data

  try {
    const data = await prisma.auditLog.findMany({
      where: { tenantId: session.user.tenantId, entityType, entityId },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    log.error('GET /api/audit-trail', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
