import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { sendInvoiceEmail } from '@/lib/email'

import { log } from '@/lib/logger'
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: { client: { select: { email: true } } },
    })
    if (!invoice) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    })

    // Update status to SENT
    await prisma.invoice.update({ where: { id }, data: { status: 'SENT' } })

    // Send email
    if (invoice.client.email && tenant) {
      sendInvoiceEmail(
        invoice.client.email,
        invoice.invoiceNumber,
        Number(invoice.totalAmount),
        invoice.currency,
        invoice.dueDate.toLocaleDateString('en-GB'),
        tenant.name,
      )
    }

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'invoice',
        entityId: id,
        entityName: `${invoice.invoiceNumber} sent`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
