import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { logCreate } from '@/lib/activity'

const CreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['EMAIL','SOCIAL','ADS','EVENT','REFERRAL','CONTENT_MARKETING','OTHER']).optional().default('OTHER'),
  platform: z.string().optional(),
  budget: z.number().optional(),
  currency: z.enum(['AED','SAR','USD','EUR','GBP','EGP','KWD','QAR','BHD','OMR']).optional().default('AED'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['DRAFT','ACTIVE','PAUSED','COMPLETED','CANCELLED']).optional().default('DRAFT'),
  ownerId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' as const } }] }),
      ...(status && { status }),
    }

    const [data, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          _count: { select: { leads: true, contentItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.campaign.count({ where }),
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
    const { startDate, endDate, ...rest } = parsed.data

    const campaign = await prisma.campaign.create({
      data: {
        tenantId,
        ownerId: rest.ownerId || session.user.id,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        ...rest,
      },
    })

    await prisma.auditLog.create({
      data: { tenantId, userId: session.user.id, action: 'CREATE', entityType: 'Campaign', entityId: campaign.id, entityName: campaign.name },
    })

    logCreate(tenantId, 'campaign', campaign.id, campaign.name, session.user.id)

    return NextResponse.json({ success: true, data: serializeDecimals(campaign) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
