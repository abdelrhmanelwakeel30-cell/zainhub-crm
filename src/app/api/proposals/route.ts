import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const ItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number(),
  totalPrice: z.number(),
  serviceId: z.string().optional(),
  packageId: z.string().optional(),
  order: z.number().int().optional().default(0),
})

const CreateSchema = z.object({
  title: z.string().min(1),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  ownerId: z.string(),
  issueDate: z.string().optional(),
  validUntil: z.string().optional(),
  executiveSummary: z.string().optional(),
  scopeOfWork: z.string().optional(),
  deliverables: z.string().optional(),
  timeline: z.string().optional(),
  methodology: z.string().optional(),
  subtotal: z.number().default(0),
  discountAmount: z.number().default(0),
  taxAmount: z.number().default(0),
  totalAmount: z.number().default(0),
  currency: z.enum(['AED','SAR','USD','EUR','GBP','EGP','KWD','QAR','BHD','OMR']).optional().default('AED'),
  terms: z.string().optional(),
  status: z.enum(['DRAFT','SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED','REVISED']).optional().default('DRAFT'),
  items: z.array(ItemSchema).optional().default([]),
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

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(search && { OR: [{ title: { contains: search } }, { proposalNumber: { contains: search } }] }),
      ...(status && { status }),
      ...(companyId && { companyId }),
    }

    const [data, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          company: { select: { id: true, displayName: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.proposal.count({ where }),
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
    const count = await prisma.proposal.count({ where: { tenantId } })
    const proposalNumber = `PRP-${String(count + 1).padStart(4, '0')}`

    const { items, issueDate, validUntil, ...rest } = parsed.data

    const proposal = await prisma.$transaction(async (tx) => {
      const p = await tx.proposal.create({
        data: {
          tenantId,
          proposalNumber,
          createdById: session.user.id,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          validUntil: validUntil ? new Date(validUntil) : undefined,
          ...rest,
        },
      })
      if (items.length > 0) {
        await tx.proposalItem.createMany({
          data: items.map((item, i) => ({ proposalId: p.id, ...item, order: item.order ?? i })),
        })
      }
      return p
    })

    await prisma.auditLog.create({
      data: { tenantId, userId: session.user.id, action: 'CREATE', entityType: 'Proposal', entityId: proposal.id, entityName: proposal.proposalNumber },
    })

    return NextResponse.json({ success: true, data: serializeDecimals(proposal) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
