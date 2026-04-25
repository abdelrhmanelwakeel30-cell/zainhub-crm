import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { logCreate } from '@/lib/activity'
import { assertTenantOwnsAll } from '@/lib/api-helpers'
import { z } from 'zod'

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).default(0),
  serviceId: z.string().optional(),
  order: z.number().int().default(0),
})

const createSchema = z.object({
  clientId: z.string().min(1),
  contactId: z.string().optional(),
  projectId: z.string().optional(),
  opportunityId: z.string().optional(),
  contractId: z.string().optional(),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  currency: z.string().default('AED'),
  taxRateId: z.string().optional(),
  discountAmount: z.number().default(0),
  discountPercent: z.number().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.string().optional(),
  items: z.array(lineItemSchema).min(1),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'))
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const clientId = searchParams.get('clientId') || ''
  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (search) where.OR = [{ invoiceNumber: { contains: search, mode: 'insensitive' as const } }, { client: { displayName: { contains: search, mode: 'insensitive' as const } } }]
  if (status) where.status = status
  if (clientId) where.clientId = clientId
  try {
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize,
        include: {
          client: { select: { id: true, displayName: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          project: { select: { id: true, name: true } },
          payments: { select: { id: true, amount: true, paymentDate: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const { tenantId, id: userId } = session.user
    const invoiceNumber = await nextNumber(tenantId, 'invoice')

    const subtotal = parsed.data.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100)
      return sum + itemTotal
    }, 0)
    const taxAmount = parsed.data.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100)
      return sum + itemTotal * ((item.taxRate || 0) / 100)
    }, 0)
    const discountAmount = parsed.data.discountAmount || 0
    const totalAmount = subtotal + taxAmount - discountAmount

    // T-002: every FK accepted from the body must belong to this tenant.
    await assertTenantOwnsAll(prisma, tenantId, [
      { model: 'company', id: parsed.data.clientId },
      { model: 'contact', id: parsed.data.contactId },
      { model: 'project', id: parsed.data.projectId },
      { model: 'opportunity', id: parsed.data.opportunityId },
      { model: 'contract', id: parsed.data.contractId },
      { model: 'taxRate', id: parsed.data.taxRateId },
    ])

    const invoice = await prisma.invoice.create({
      data: {
        tenantId, invoiceNumber,
        clientId: parsed.data.clientId,
        contactId: parsed.data.contactId || null,
        projectId: parsed.data.projectId || null,
        opportunityId: parsed.data.opportunityId || null,
        contractId: parsed.data.contractId || null,
        issueDate: new Date(parsed.data.issueDate),
        dueDate: new Date(parsed.data.dueDate),
        currency: parsed.data.currency as 'AED',
        taxRateId: parsed.data.taxRateId || null,
        subtotal, taxAmount, discountAmount, totalAmount,
        amountPaid: 0, balanceDue: totalAmount,
        status: 'DRAFT',
        notes: parsed.data.notes || null,
        terms: parsed.data.terms || null,
        isRecurring: parsed.data.isRecurring,
        recurringInterval: parsed.data.recurringInterval as 'MONTHLY' || null,
        createdById: userId,
        items: { create: parsed.data.items.map(item => ({
          description: item.description, quantity: item.quantity, unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0, taxRate: item.taxRate || 0,
          totalPrice: item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100),
          serviceId: item.serviceId || null, order: item.order,
        })) },
      },
      include: {
        client: { select: { id: true, displayName: true } },
        items: true,
      },
    })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'invoice', entityId: invoice.id, entityName: invoice.invoiceNumber } })
    logCreate(tenantId, 'invoice', invoice.id, invoice.invoiceNumber, userId)
    return NextResponse.json({ success: true, data: invoice }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
