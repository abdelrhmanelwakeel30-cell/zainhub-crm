import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

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
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, jobTitle: true } } } },
        milestones: { orderBy: { order: 'asc' } },
        tasks: { where: { parentTaskId: null }, select: { id: true, title: true, status: true, priority: true, dueDate: true, assignedTo: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } },
        invoices: { select: { id: true, invoiceNumber: true, totalAmount: true, amountPaid: true, status: true, dueDate: true }, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!project) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: project })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.project.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const body = await req.json()
    if (body.startDate) body.startDate = new Date(body.startDate)
    if (body.targetEndDate) body.targetEndDate = new Date(body.targetEndDate)
    if (body.actualEndDate) body.actualEndDate = new Date(body.actualEndDate)
    const project = await prisma.project.update({ where: { id }, data: body })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'project', entityId: id, entityName: project.name } })
    return NextResponse.json({ success: true, data: project })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const project = await prisma.project.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!project) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.project.update({ where: { id }, data: { archivedAt: new Date() } })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'ARCHIVE', entityType: 'project', entityId: id, entityName: project.name } })
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
