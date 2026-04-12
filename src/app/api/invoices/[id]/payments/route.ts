import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { sendPaymentConfirmation } from '@/lib/email'
import { z } from 'zod'

const paymentSchema = z.object({
  amount: z.number().min(0.01),
  paymentDate: z.string().min(1),
  paymentMethod: z.enum(['BANK_TRANSFER','CREDIT_CARD','CASH','CHECK','ONLINE','OTHER']).default('BANK_TRANSFER'),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id: invoiceId } = await params

  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId: session.user.tenantId } })
    if (!invoice) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    if (invoice.status === 'CANCELLED') return NextResponse.json({ success: false, error: 'Invoice is cancelled' }, { status: 400 })

    const body = await req.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const { tenantId, id: userId } = session.user
    const payCount = await prisma.payment.count({ where: { tenantId } })
    const paymentNumber = `PAY-${String(payCount+1).padStart(4,'0')}`

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId, paymentNumber,
          invoiceId, clientId: invoice.clientId,
          amount: parsed.data.amount,
          currency: invoice.currency,
          paymentDate: new Date(parsed.data.paymentDate),
          paymentMethod: parsed.data.paymentMethod,
          reference: parsed.data.reference || null,
          notes: parsed.data.notes || null,
          createdById: userId,
        },
      })

      const newAmountPaid = Number(invoice.amountPaid) + parsed.data.amount
      const newBalanceDue = Number(invoice.totalAmount) - newAmountPaid
      const newStatus = newBalanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID'

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid: newAmountPaid, balanceDue: Math.max(0, newBalanceDue), status: newStatus },
      })

      return payment
    })

    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'payment', entityId: result.id, entityName: result.paymentNumber } })

    // Fire-and-forget payment confirmation email
    const client = await prisma.company.findUnique({ where: { id: invoice.clientId }, select: { email: true } })
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } })
    if (client?.email && tenant) {
      sendPaymentConfirmation(client.email, invoice.invoiceNumber, parsed.data.amount, invoice.currency, tenant.name)
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
