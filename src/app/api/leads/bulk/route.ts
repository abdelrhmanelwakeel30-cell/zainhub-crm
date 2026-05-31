import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, hasPermission } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

/**
 * Bulk operations on leads (C-3). Tenant-scoped, RBAC-gated, audited.
 *   archive -> leads:delete   | assign/stage/restore -> leads:edit
 */
const bulkSchema = z
  .object({
    action: z.enum(['archive', 'assign', 'stage', 'restore']),
    ids: z.array(z.string().min(1)).min(1).max(200),
    assignedToId: z.string().optional().nullable(),
    stageId: z.string().optional().nullable(),
  })
  .refine((d) => d.action !== 'assign' || !!d.assignedToId, { message: 'assignedToId required for assign', path: ['assignedToId'] })
  .refine((d) => d.action !== 'stage' || !!d.stageId, { message: 'stageId required for stage', path: ['stageId'] })

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseJson(req, bulkSchema)
  if (parsed instanceof NextResponse) return parsed
  const { action, ids, assignedToId, stageId } = parsed.data
  const { tenantId, id: userId, permissions } = session.user

  const required = action === 'archive' ? 'leads:delete' : 'leads:edit'
  if (!hasPermission(permissions, required)) {
    return NextResponse.json({ success: false, error: 'Forbidden', code: 'PERMISSION_DENIED', required }, { status: 403 })
  }

  try {
    // Tenant-scope the target set (never trust client ids alone). Restore acts
    // on archived rows; every other action acts on live rows.
    const where =
      action === 'restore'
        ? { id: { in: ids }, tenantId, archivedAt: { not: null } }
        : { id: { in: ids }, tenantId, archivedAt: null }

    // For assign/stage, verify the target FK belongs to this tenant.
    if (action === 'assign') {
      const u = await prisma.user.findFirst({ where: { id: assignedToId!, tenantId }, select: { id: true } })
      if (!u) return NextResponse.json({ success: false, error: 'Invalid assignee' }, { status: 422 })
    }
    if (action === 'stage') {
      const s = await prisma.pipelineStage.findFirst({ where: { id: stageId!, pipeline: { tenantId } }, select: { id: true } })
      if (!s) return NextResponse.json({ success: false, error: 'Invalid stage' }, { status: 422 })
    }

    const data =
      action === 'archive'
        ? { archivedAt: new Date() }
        : action === 'restore'
          ? { archivedAt: null }
          : action === 'assign'
            ? { assignedToId }
            : { stageId }

    const result = await prisma.lead.updateMany({ where, data })

    const auditAction: 'ARCHIVE' | 'ASSIGN' | 'UPDATE' | 'RESTORE' =
      action === 'archive' ? 'ARCHIVE' : action === 'restore' ? 'RESTORE' : action === 'assign' ? 'ASSIGN' : 'UPDATE'

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: auditAction,
        entityType: 'lead',
        entityId: ids[0],
        entityName: `${result.count} lead(s) — bulk ${action}`,
      },
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (err) {
    log.error('POST /api/leads/bulk', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
