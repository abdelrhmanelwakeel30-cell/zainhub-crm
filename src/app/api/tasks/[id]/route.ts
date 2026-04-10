import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const task = await prisma.task.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
        milestone: { select: { id: true, name: true } },
        subtasks: { include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } } },
        comments: { include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: 'asc' } },
      },
    })
    if (!task) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: task })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.task.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const body = await req.json()
    if (body.dueDate) body.dueDate = new Date(body.dueDate)
    if (body.status === 'COMPLETED' && !existing.completedAt) body.completedAt = new Date()
    if (body.status !== 'COMPLETED') body.completedAt = null
    const task = await prisma.task.update({ where: { id }, data: body })
    return NextResponse.json({ success: true, data: task })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const task = await prisma.task.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!task) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.task.update({ where: { id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
