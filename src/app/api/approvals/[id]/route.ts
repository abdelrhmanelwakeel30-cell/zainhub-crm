import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

import { log } from '@/lib/logger'
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const request = await prisma.approvalRequest.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        workflow: { select: { id: true, name: true, entityType: true } },
        steps: {
          include: {
            approver: { select: { id: true, firstName: true, lastName: true } },
            approverRole: { select: { id: true, name: true } },
            approverClientUser: { select: { id: true, email: true } },
          },
          orderBy: { stepNumber: 'asc' },
        },
      },
    })
    if (!request) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: request })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('approvals:edit')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const existing = await prisma.approvalRequest.findFirst({
      where: { id, tenantId: session.user.tenantId },
    })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const updateData: Record<string, unknown> = {}

    if (body.status) updateData.status = body.status
    if (body.status === 'APPROVED' || body.status === 'REJECTED' || body.status === 'WITHDRAWN') {
      updateData.completedAt = new Date()
    }

    const updated = await prisma.approvalRequest.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
