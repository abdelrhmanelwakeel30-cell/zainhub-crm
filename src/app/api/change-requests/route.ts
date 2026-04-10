import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  companyId: z.string().optional(),
  projectId: z.string().optional(),
  clientServiceId: z.string().optional(),
  type: z.enum(['SCOPE', 'FEATURE', 'BUG', 'DESIGN', 'CONTENT', 'TECHNICAL', 'OTHER']).optional().default('OTHER'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'IMPACT_ANALYSIS', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']).optional().default('DRAFT'),
  impactDescription: z.string().optional(),
  impactedAreas: z.string().optional(),
  estimatedHours: z.number().optional(),
  estimatedCost: z.number().optional(),
  currency: z.enum(['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR']).optional(),
  approvalRequired: z.boolean().optional(),
  dueDate: z.string().optional(),
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
    const type = searchParams.get('type') || ''
    const priority = searchParams.get('priority') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(search && { OR: [{ title: { contains: search } }, { crNumber: { contains: search } }] }),
      ...(status && { status }),
      ...(companyId && { companyId }),
      ...(type && { type }),
      ...(priority && { priority }),
    }

    const [data, total] = await Promise.all([
      prisma.changeRequest.findMany({
        where,
        include: {
          company: { select: { id: true, displayName: true } },
          project: { select: { id: true, name: true } },
          requestedBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      prisma.changeRequest.count({ where }),
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
    const count = await prisma.changeRequest.count({ where: { tenantId } })
    const crNumber = `CR-${String(count + 1).padStart(4, '0')}`

    const { dueDate, estimatedHours, estimatedCost, ...rest } = parsed.data

    const changeRequest = await prisma.changeRequest.create({
      data: {
        tenantId,
        crNumber,
        requestedById: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours ?? undefined,
        estimatedCost: estimatedCost ?? undefined,
        ...rest,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'ChangeRequest',
        entityId: changeRequest.id,
        entityName: changeRequest.crNumber,
      },
    })

    return NextResponse.json({ success: true, data: serializeDecimals(changeRequest) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
