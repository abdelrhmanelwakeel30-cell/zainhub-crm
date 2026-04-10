import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId: session.user.tenantId, archivedAt: null },
      include: { companyContacts: { include: { company: { select: { id: true, displayName: true, industry: true } } } } },
    })
    if (!contact) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: contact })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.contact.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const body = await req.json()
    const { companyId, companyRole, ...data } = body
    const contact = await prisma.contact.update({ where: { id }, data })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'contact', entityId: id, entityName: `${contact.firstName} ${contact.lastName}` } })
    return NextResponse.json({ success: true, data: contact })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const contact = await prisma.contact.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!contact) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.contact.update({ where: { id }, data: { archivedAt: new Date() } })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'ARCHIVE', entityType: 'contact', entityId: id, entityName: `${contact.firstName} ${contact.lastName}` } })
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
