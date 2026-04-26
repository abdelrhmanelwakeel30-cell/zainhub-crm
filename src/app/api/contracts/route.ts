import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals, assertTenantOwnsAll } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { logCreate } from '@/lib/activity'

const CreateSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['SERVICE','RETAINER','NDA','PARTNERSHIP','MAINTENANCE','OTHER']).optional().default('SERVICE'),
  clientId: z.string(),
  contactId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  autoRenew: z.boolean().optional().default(false),
  renewalReminderDays: z.number().int().optional().default(30),
  value: z.number().optional(),
  currency: z.enum(['AED','SAR','USD','EUR','GBP','EGP','KWD','QAR','BHD','OMR']).optional().default('AED'),
  status: z.enum(['DRAFT','SENT','ACTIVE','EXPIRED','TERMINATED','RENEWED']).optional().default('DRAFT'),
  scopeSummary: z.string().optional(),
  terms: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const clientId = searchParams.get('clientId') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(search && { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { contractNumber: { contains: search, mode: 'insensitive' as const } }] }),
      ...(status && { status }),
      ...(clientId && { clientId }),
    }

    const [data, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          client: { select: { id: true, displayName: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.contract.count({ where }),
    ])

    return paginatedOk(serializeDecimals(data), total, page, pageSize)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('contracts:create')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const tenantId = session.user.tenantId
    const contractNumber = await nextNumber(tenantId, 'contract')

    // T-002: every FK accepted from the body must belong to this tenant.
    await assertTenantOwnsAll(prisma, tenantId, [
      { model: 'company', id: parsed.data.clientId },
      { model: 'contact', id: parsed.data.contactId },
    ])

    const { startDate, endDate, renewalDate, ...rest } = parsed.data

    const contract = await prisma.contract.create({
      data: {
        tenantId,
        contractNumber,
        createdById: session.user.id,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        renewalDate: renewalDate ? new Date(renewalDate) : undefined,
        ...rest,
      },
    })

    await prisma.auditLog.create({
      data: { tenantId, userId: session.user.id, action: 'CREATE', entityType: 'Contract', entityId: contract.id, entityName: contract.contractNumber },
    })

    logCreate(tenantId, 'contract', contract.id, contract.title, session.user.id)

    return NextResponse.json({ success: true, data: serializeDecimals(contract) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
