import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const CreateSchema = z.object({
  clientId: z.string(),
  platform: z.enum(['INSTAGRAM','FACEBOOK','TIKTOK','LINKEDIN','X','YOUTUBE','SNAPCHAT']),
  accountName: z.string().min(1),
  accountUrl: z.string().optional(),
  postingFrequency: z.string().optional(),
  contentPillars: z.array(z.string()).optional(),
  brandGuidelines: z.string().optional(),
  targetAudience: z.string().optional(),
  approvalContactId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const clientId = searchParams.get('clientId') || ''
    const platform = searchParams.get('platform') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(clientId && { clientId }),
      ...(platform && { platform }),
    }

    const [data, total] = await Promise.all([
      prisma.socialAccount.findMany({
        where,
        include: {
          client: { select: { id: true, displayName: true, logoUrl: true } },
          approvalContact: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { contentItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.socialAccount.count({ where }),
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
    const { contentPillars, ...rest } = parsed.data

    const account = await prisma.socialAccount.create({
      data: {
        tenantId,
        contentPillars: contentPillars ? JSON.stringify(contentPillars) : undefined,
        ...rest,
      },
    })

    await prisma.auditLog.create({
      data: { tenantId, userId: session.user.id, action: 'CREATE', entityType: 'SocialAccount', entityId: account.id, entityName: account.accountName },
    })

    return NextResponse.json({ success: true, data: serializeDecimals(account) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
