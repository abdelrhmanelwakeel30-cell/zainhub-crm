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
    const project = await prisma.project.findFirst({
      where: { id, tenantId: session.user.tenantId, archivedAt: null },
      include: {
        client: { select: { id: true, displayName: true, industry: true } },
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        opportunity: { select: { id: true, opportunityNumber: true, title: true, expectedValue: true } },
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, jobTitle: true } } } },
        milestones: { orderBy: { order: 'asc' } },
        tasks: { where: { parentTaskId: null }, select: { id: true, title: true, status: true, priority: true, dueDate: true, assignedTo: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } },
        invoices: { select: { id: true, invoiceNumber: true, totalAmount: true, amountPaid: true, status: true, dueDate: true }, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!project) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    // Polymorphic documents query
    const documents = await prisma.document.findMany({
      where: { tenantId: session.user.tenantId, linkedEntityType: 'project', linkedEntityId: id },
      select: { id: true, name: true, fileType: true, fileSize: true, category: true, fileUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: { ...project, documents } })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('projects:edit')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.project.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const raw = await req.json()
    const body = sanitizeUpdateBody<Record<string, unknown>>(raw, ['projectNumber']) as Record<string, unknown>
    if (body.startDate) body.startDate = new Date(body.startDate as string)
    if (body.targetEndDate) body.targetEndDate = new Date(body.targetEndDate as string)
    if (body.actualEndDate) body.actualEndDate = new Date(body.actualEndDate as string)
    const project = await prisma.project.update({ where: { id }, data: body })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'project', entityId: id, entityName: project.name } })
    return NextResponse.json({ success: true, data: project })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('projects:delete')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const project = await prisma.project.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!project) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.project.update({ where: { id }, data: { archivedAt: new Date() } })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'ARCHIVE', entityType: 'project', entityId: id, entityName: project.name } })
    return NextResponse.json({ success: true })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
