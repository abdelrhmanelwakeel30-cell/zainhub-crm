import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, hasPermission } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
})

/** Approve / reject / cancel a leave request. Approve & reject need leave:approve; cancel needs leave:edit. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { tenantId, id: userId, permissions } = session.user

  const parsed = await parseJson(req, patchSchema)
  if (parsed instanceof NextResponse) return parsed
  const { status } = parsed.data

  const required = status === 'CANCELLED' ? 'leave:edit' : 'leave:approve'
  if (!hasPermission(permissions, required)) {
    return NextResponse.json({ success: false, error: 'Forbidden', code: 'PERMISSION_DENIED', required }, { status: 403 })
  }

  try {
    const existing = await prisma.leaveRequest.findFirst({ where: { id, tenantId }, select: { id: true, status: true } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    if (existing.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: `Leave request is already ${existing.status.toLowerCase()}` }, { status: 409 })
    }

    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status, reviewedById: userId },
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: status === 'APPROVED' ? 'APPROVE' : status === 'REJECTED' ? 'REJECT' : 'UPDATE', entityType: 'leave', entityId: id, entityName: `Leave ${status.toLowerCase()}` },
    })
    return NextResponse.json({ success: true, data: leave })
  } catch (err) {
    log.error('PATCH /api/leave-requests/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
