import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        client: { select: { id: true, displayName: true, taxRegistrationNumber: true, address: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        project: { select: { id: true, name: true } },
        opportunity: { select: { id: true, title: true } },
        items: { orderBy: { order: 'asc' }, include: { service: { select: { id: true, name: true } } } },
        payments: { orderBy: { paymentDate: 'desc' } },
        taxRate: true,
      },
    })
    if (!invoice) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: invoice })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.invoice.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const body = await req.json()
    const { items: _, ...data } = body
    if (data.issueDate) data.issueDate = new Date(data.issueDate)
    if (data.dueDate) data.dueDate = new Date(data.dueDate)
    const invoice = await prisma.invoice.update({ where: { id }, data })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'invoice', entityId: id, entityName: invoice.invoiceNumber } })
    return NextResponse.json({ success: true, data: invoice })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!invoice) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'invoice', entityId: id, entityName: invoice.invoiceNumber } })
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
