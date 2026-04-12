import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'

const CreateSchema = z.object({
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string().min(1),
  packageId: z.string().optional(),
  assignedToId: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'PENDING_RENEWAL']).optional().default('ACTIVE'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  supportEndDate: z.string().optional(),
  environment: z.enum(['PRODUCTION', 'STAGING', 'DEVELOPMENT']).optional().default('PRODUCTION'),
  version: z.string().optional(),
  monthlyValue: z.number().optional(),
  totalContractValue: z.number().optional(),
  currency: z.enum(['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR']).optional().default('AED'),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const companyId = searchParams.get('companyId') || ''
    const assignedToId = searchParams.get('assignedToId') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(search && {
        OR: [
          { serviceName: { contains: search, mode: 'insensitive' as const } },
          { clientServiceNumber: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(status && { status }),
      ...(companyId && { companyId }),
      ...(assignedToId && { assignedToId }),
    }

    const [data, total] = await Promise.all([
      prisma.clientService.findMany({
        where,
        include: {
          company: { select: { id: true, displayName: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          service: { select: { id: true, name: true } },
          package: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { milestones: true, changeRequests: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.clientService.count({ where }),
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
    const clientServiceNumber = await nextNumber(tenantId, 'clientService')

    const { startDate, endDate, renewalDate, supportEndDate, ...rest } = parsed.data

    const clientService = await prisma.clientService.create({
      data: {
        tenantId,
        clientServiceNumber,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        renewalDate: renewalDate ? new Date(renewalDate) : undefined,
        supportEndDate: supportEndDate ? new Date(supportEndDate) : undefined,
        ...rest,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'ClientService',
        entityId: clientService.id,
        entityName: clientService.clientServiceNumber,
      },
    })

    return NextResponse.json({ success: true, data: serializeDecimals(clientService) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
