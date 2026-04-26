import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { sanitizeUpdateBody } from '@/lib/api-helpers'

import { log } from '@/lib/logger'
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const company = await prisma.company.findFirst({
      where: { id, tenantId: session.user.tenantId, archivedAt: null },
      include: {
        accountOwner: { select: { id: true, firstName: true, lastName: true } },
        companyContacts: { include: { contact: { select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true } } } },
        leads: { where: { archivedAt: null }, select: { id: true, leadNumber: true, fullName: true, urgency: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 5 },
        opportunities: { where: { archivedAt: null }, select: { id: true, opportunityNumber: true, title: true, expectedValue: true, currency: true }, orderBy: { createdAt: 'desc' }, take: 5 },
        invoices: { where: { status: { not: 'CANCELLED' } }, select: { id: true, invoiceNumber: true, totalAmount: true, status: true, dueDate: true }, orderBy: { createdAt: 'desc' }, take: 5 },
        projects: { where: { archivedAt: null }, select: { id: true, projectNumber: true, name: true, status: true, progressPercent: true }, orderBy: { createdAt: 'desc' }, take: 5 },
        contracts: { select: { id: true, contractNumber: true, title: true, status: true, value: true, startDate: true, endDate: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        tickets: { select: { id: true, ticketNumber: true, subject: true, status: true, priority: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })
    if (!company) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: company })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.company.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const raw = await req.json()
    const body = sanitizeUpdateBody<Record<string, unknown>>(raw, ['companyNumber']) as Record<string, unknown>
    const company = await prisma.company.update({ where: { id }, data: body })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'company', entityId: id, entityName: company.displayName } })
    return NextResponse.json({ success: true, data: company })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const company = await prisma.company.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!company) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.company.update({ where: { id }, data: { archivedAt: new Date() } })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'ARCHIVE', entityType: 'company', entityId: id, entityName: company.displayName } })
    return NextResponse.json({ success: true })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
