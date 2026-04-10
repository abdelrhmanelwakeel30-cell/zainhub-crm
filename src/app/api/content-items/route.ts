import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const CreateSchema = z.object({
  socialAccountId: z.string(),
  clientId: z.string(),
  platform: z.enum(['INSTAGRAM','FACEBOOK','TIKTOK','LINKEDIN','X','YOUTUBE','SNAPCHAT']),
  contentType: z.enum(['POST','REEL','VIDEO','STORY','CAROUSEL','ARTICLE','SHORT','INFOGRAPHIC','POLL']),
  plannedPublishDate: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.string().optional(),
  creativeBrief: z.string().optional(),
  mediaUrl: z.string().optional(),
  designerId: z.string().optional(),
  copywriterId: z.string().optional(),
  videographerId: z.string().optional(),
  approvalStatus: z.enum(['DRAFT','INTERNAL_REVIEW','CLIENT_REVIEW','APPROVED','REVISION_NEEDED','SCHEDULED','PUBLISHED','REJECTED']).optional().default('DRAFT'),
  campaignId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const clientId = searchParams.get('clientId') || ''
    const platform = searchParams.get('platform') || ''
    const approvalStatus = searchParams.get('approvalStatus') || ''
    const socialAccountId = searchParams.get('socialAccountId') || ''
    const campaignId = searchParams.get('campaignId') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(clientId && { clientId }),
      ...(platform && { platform }),
      ...(approvalStatus && { approvalStatus }),
      ...(socialAccountId && { socialAccountId }),
      ...(campaignId && { campaignId }),
    }

    const [data, total] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        include: {
          socialAccount: { select: { id: true, accountName: true, platform: true } },
          designer: { select: { id: true, firstName: true, lastName: true } },
          copywriter: { select: { id: true, firstName: true, lastName: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: [{ plannedPublishDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      prisma.contentItem.count({ where }),
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
    const { plannedPublishDate, ...rest } = parsed.data

    const item = await prisma.contentItem.create({
      data: {
        tenantId,
        createdById: session.user.id,
        plannedPublishDate: plannedPublishDate ? new Date(plannedPublishDate) : undefined,
        ...rest,
      },
    })

    await prisma.auditLog.create({
      data: { tenantId, userId: session.user.id, action: 'CREATE', entityType: 'ContentItem', entityId: item.id, entityName: item.contentType },
    })

    return NextResponse.json({ success: true, data: serializeDecimals(item) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
