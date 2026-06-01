import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, hasPermission } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const patchSchema = z.object({ action: z.enum(['submit', 'approve', 'receive']) })

// action -> { from-status, to-status, permission }
const TRANSITIONS: Record<string, { from: string; to: string; perm: string; audit: 'UPDATE' | 'APPROVE' }> = {
  submit: { from: 'DRAFT', to: 'SUBMITTED', perm: 'procurement:edit', audit: 'UPDATE' },
  approve: { from: 'SUBMITTED', to: 'APPROVED', perm: 'procurement:approve', audit: 'APPROVE' },
  receive: { from: 'APPROVED', to: 'RECEIVED', perm: 'procurement:edit', audit: 'UPDATE' },
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: { vendor: { select: { id: true, name: true } }, lines: true },
    })
    if (!po) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: po })
  } catch (err) {
    log.error('GET /api/purchase-orders/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { tenantId, id: userId, permissions } = session.user

  const parsed = await parseJson(req, patchSchema)
  if (parsed instanceof NextResponse) return parsed
  const t = TRANSITIONS[parsed.data.action]

  if (!hasPermission(permissions, t.perm)) {
    return NextResponse.json({ success: false, error: 'Forbidden', code: 'PERMISSION_DENIED', required: t.perm }, { status: 403 })
  }

  try {
    const po = await prisma.purchaseOrder.findFirst({ where: { id, tenantId }, select: { id: true, status: true, poNumber: true } })
    if (!po) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    if (po.status !== t.from) {
      return NextResponse.json({ success: false, error: `Cannot ${parsed.data.action} a ${po.status.toLowerCase()} purchase order` }, { status: 409 })
    }

    const data: Record<string, unknown> = { status: t.to }
    if (t.to === 'SUBMITTED') data.submittedAt = new Date()
    if (t.to === 'APPROVED') { data.approvedAt = new Date(); data.approvedById = userId }
    if (t.to === 'RECEIVED') data.receivedAt = new Date()

    const updated = await prisma.purchaseOrder.update({ where: { id }, data })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: t.audit, entityType: 'purchase_order', entityId: id, entityName: `${po.poNumber} ${t.to.toLowerCase()}` },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    log.error('PATCH /api/purchase-orders/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
