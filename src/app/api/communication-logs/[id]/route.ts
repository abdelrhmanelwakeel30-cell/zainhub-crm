import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { sanitizeUpdateBody } from '@/lib/api-helpers'

import { log } from '@/lib/logger'
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const log = await prisma.communicationLog.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        company: { select: { id: true, displayName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, fullName: true } },
        loggedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    if (!log) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: log })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('comms:edit')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.communicationLog.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const raw = await req.json()
    const body = sanitizeUpdateBody<Record<string, unknown>>(raw, ['loggedById']) as Record<string, unknown>
    if (body.loggedAt) body.loggedAt = new Date(body.loggedAt as string)
    const log = await prisma.communicationLog.update({ where: { id }, data: body })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'communicationLog', entityId: id, entityName: log.subject || log.type } })
    return NextResponse.json({ success: true, data: log })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('comms:delete')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const log = await prisma.communicationLog.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!log) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.communicationLog.delete({ where: { id } })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'communicationLog', entityId: id, entityName: log.subject || log.type } })
    return NextResponse.json({ success: true })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
