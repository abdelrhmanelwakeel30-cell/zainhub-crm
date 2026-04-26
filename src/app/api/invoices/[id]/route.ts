import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { sendInvoiceEmail } from '@/lib/email'
import { log } from '@/lib/logger'
import { z } from 'zod'

// Whitelist of user-mutable fields. Explicitly excludes:
//   tenantId, amountPaid, balanceDue, subtotal, taxAmount, totalAmount,
//   invoiceNumber, createdAt, createdById, clientId  (server-derived / immutable)
const UpdateSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
  terms: z.string().max(5000).optional(),
  currency: z.string().length(3).optional(),
  taxRateId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  contractId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
})

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
        contract: { select: { id: true, contractNumber: true, title: true } },
        opportunity: { select: { id: true, title: true } },
        items: { orderBy: { order: 'asc' }, include: { service: { select: { id: true, name: true } } } },
        payments: { orderBy: { paymentDate: 'desc' } },
        taxRate: true,
      },
    })
    if (!invoice) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: invoice })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission('invoices:edit')
  if (!guard.ok) return guard.response
  const { session } = guard
  const { id } = await params
  try {
    const existing = await prisma.invoice.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 },
      )
    }
    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.issueDate) data.issueDate = new Date(parsed.data.issueDate)
    if (parsed.data.dueDate) data.dueDate = new Date(parsed.data.dueDate)
    const invoice = await prisma.invoice.update({ where: { id }, data })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'invoice', entityId: id, entityName: invoice.invoiceNumber } })

    // Auto-send email when invoice status changes to SENT
    if (data.status === 'SENT' && existing.status !== 'SENT') {
      const client = await prisma.company.findUnique({ where: { id: invoice.clientId }, select: { email: true } })
      const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId }, select: { name: true } })
      if (client?.email && tenant) {
        sendInvoiceEmail(
          client.email, invoice.invoiceNumber, Number(invoice.totalAmount),
          invoice.currency, invoice.dueDate.toLocaleDateString('en-GB'), tenant.name,
        )
      }
    }

    return NextResponse.json({ success: true, data: invoice })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission('invoices:delete')
  if (!guard.ok) return guard.response
  const { session } = guard
  const { id } = await params
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!invoice) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'invoice', entityId: id, entityName: invoice.invoiceNumber } })
    return NextResponse.json({ success: true })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
