import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals, parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { createAuditLog } from '@/lib/audit'
import { logCreate } from '@/lib/activity'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const clientId = searchParams.get('clientId') || ''
    // UI sends either ?method= or ?paymentMethod= — accept both
    const paymentMethod =
      searchParams.get('paymentMethod') || searchParams.get('method') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(clientId && { clientId }),
      ...(paymentMethod && { paymentMethod }),
    }

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: { id: true, invoiceNumber: true, client: { select: { id: true, displayName: true } } },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ])

    return paginatedOk(serializeDecimals(data), total, page, pageSize)
  } catch (err) {
    return serverError(err)
  }
}

const CreatePaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR']).optional(),
  paymentDate: z.string().min(1),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'CHECK', 'ONLINE', 'OTHER']).optional(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const parsed = await parseJson(req, CreatePaymentSchema)
    if (parsed instanceof NextResponse) return parsed

    const tenantId = session.user.tenantId

    // Verify invoice exists and belongs to this tenant
    const invoice = await prisma.invoice.findFirst({
      where: { id: parsed.data.invoiceId, tenantId },
      select: { id: true, clientId: true, currency: true, totalAmount: true, amountPaid: true, status: true },
    })
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    const paymentNumber = await nextNumber(tenantId, 'payment')

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          tenantId,
          paymentNumber,
          invoiceId: invoice.id,
          clientId: invoice.clientId,
          amount: parsed.data.amount,
          currency: parsed.data.currency || invoice.currency,
          paymentDate: new Date(parsed.data.paymentDate),
          paymentMethod: parsed.data.paymentMethod || 'BANK_TRANSFER',
          reference: parsed.data.reference || null,
          notes: parsed.data.notes || null,
          createdById: session.user.id,
        },
        include: {
          invoice: {
            select: { id: true, invoiceNumber: true, client: { select: { id: true, displayName: true } } },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      })

      // Update invoice amountPaid + balance + status
      const newAmountPaid = Number(invoice.amountPaid ?? 0) + parsed.data.amount
      const totalAmount = Number(invoice.totalAmount ?? 0)
      const newBalance = Math.max(0, totalAmount - newAmountPaid)
      const newStatus = newAmountPaid >= totalAmount ? 'PAID' : newAmountPaid > 0 ? 'PARTIALLY_PAID' : invoice.status

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalance,
          status: newStatus,
        },
      })

      return p
    })

    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'payment',
      entityId: payment.id,
      entityName: payment.paymentNumber,
      sourceModule: 'payments',
      req,
    })

    logCreate(tenantId, 'payment', payment.id, payment.paymentNumber, session.user.id)

    return NextResponse.json(
      { success: true, data: serializeDecimals(payment) },
      { status: 201 },
    )
  } catch (err) {
    return serverError(err)
  }
}
