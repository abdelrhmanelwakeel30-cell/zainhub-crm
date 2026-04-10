import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

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
      ...(search && { OR: [{ title: { contains: search } }, { contractNumber: { contains: search } }] }),
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
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const tenantId = session.user.tenantId
    const count = await prisma.contract.count({ where: { tenantId } })
    const contractNumber = `CTR-${String(count + 1).padStart(4, '0')}`

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

    return NextResponse.json({ success: true, data: serializeDecimals(contract) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
