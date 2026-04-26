import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { assertTenantOwnsAll } from '@/lib/api-helpers'
import { log } from '@/lib/logger'
import { z } from 'zod'

function calcNextBillingDate(startDate: Date, interval: string): Date {
  const d = new Date(startDate)
  switch (interval) {
    case 'WEEKLY':       d.setDate(d.getDate() + 7); break
    case 'BIWEEKLY':     d.setDate(d.getDate() + 14); break
    case 'MONTHLY':      d.setMonth(d.getMonth() + 1); break
    case 'QUARTERLY':    d.setMonth(d.getMonth() + 3); break
    case 'SEMI_ANNUAL':  d.setMonth(d.getMonth() + 6); break
    case 'ANNUAL':       d.setFullYear(d.getFullYear() + 1); break
    default:             d.setMonth(d.getMonth() + 1)
  }
  return d
}

const createSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().default('AED'),
  interval: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']),
  startDate: z.string().min(1),
  serviceId: z.string().optional(),
  packageId: z.string().optional(),
  contactId: z.string().optional(),
  notes: z.string().optional(),
  autoRenew: z.boolean().default(true),
  description: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const companyId = searchParams.get('companyId') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '50'))

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (status) where.status = status
  if (companyId) where.companyId = companyId

  try {
    const [data, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          company: { select: { id: true, displayName: true } },
          service: { select: { id: true, name: true } },
          package: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.subscription.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const { tenantId, id: userId } = session.user
    const startDate = new Date(parsed.data.startDate)
    const nextBillingDate = calcNextBillingDate(startDate, parsed.data.interval)

    // T-002: every FK accepted from the body must belong to this tenant.
    await assertTenantOwnsAll(prisma, tenantId, [
      { model: 'company', id: parsed.data.companyId },
      { model: 'contact', id: parsed.data.contactId },
      { model: 'service', id: parsed.data.serviceId },
    ])

    const subscription = await prisma.subscription.create({
      data: {
        tenantId,
        companyId: parsed.data.companyId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        amount: parsed.data.amount,
        currency: parsed.data.currency as 'AED',
        interval: parsed.data.interval,
        startDate,
        nextBillingDate,
        status: 'ACTIVE',
        autoRenew: parsed.data.autoRenew,
        serviceId: parsed.data.serviceId || null,
        packageId: parsed.data.packageId || null,
        contactId: parsed.data.contactId || null,
        notes: parsed.data.notes || null,
        createdById: userId,
      },
      include: {
        company: { select: { id: true, displayName: true } },
        service: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'CREATE',
        entityType: 'subscription',
        entityId: subscription.id,
        entityName: subscription.name,
      },
    })

    return NextResponse.json({ success: true, data: subscription }, { status: 201 })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
