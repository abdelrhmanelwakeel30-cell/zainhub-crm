import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { log } from '@/lib/logger'
import { z } from 'zod'

const createBillingSchema = z.object({
  billingDate: z.string().optional(),
  notes: z.string().optional(),
  createInvoice: z.boolean().default(false),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const subscription = await prisma.subscription.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!subscription) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const records = await prisma.billingRecord.findMany({
      where: { subscriptionId: id },
      orderBy: { billingDate: 'desc' },
      include: {
        invoice: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
      },
    })
    return NextResponse.json({ success: true, data: records })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const parsed = createBillingSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const { tenantId, id: userId } = session.user
    const subscription = await prisma.subscription.findFirst({ where: { id, tenantId } })
    if (!subscription) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const billingDate = parsed.data.billingDate ? new Date(parsed.data.billingDate) : new Date()

    let invoiceId: string | undefined
    if (parsed.data.createInvoice) {
      const invoiceNumber = await nextNumber(tenantId, 'invoice')
      const invoice = await prisma.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          clientId: subscription.companyId,
          issueDate: billingDate,
          dueDate: new Date(billingDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          currency: subscription.currency,
          subtotal: subscription.amount,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: subscription.amount,
          amountPaid: 0,
          balanceDue: subscription.amount,
          status: 'DRAFT',
          notes: `Auto-generated from subscription: ${subscription.name}`,
          subscriptionId: subscription.id,
          createdById: userId,
          items: {
            create: [{
              description: `${subscription.name} - ${subscription.interval} subscription`,
              quantity: 1,
              unitPrice: subscription.amount,
              discountPercent: 0,
              taxRate: 0,
              totalPrice: subscription.amount,
              order: 0,
            }],
          },
        },
      })
      invoiceId = invoice.id
    }

    const billingRecord = await prisma.billingRecord.create({
      data: {
        tenantId,
        subscriptionId: id,
        invoiceId: invoiceId || null,
        amount: subscription.amount,
        currency: subscription.currency,
        billingDate,
        status: invoiceId ? 'INVOICED' : 'PENDING',
        notes: parsed.data.notes || null,
      },
      include: {
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
    })

    return NextResponse.json({ success: true, data: billingRecord }, { status: 201 })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
