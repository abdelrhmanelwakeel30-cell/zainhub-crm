import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  contentType: z.enum(['POST','REEL','VIDEO','STORY','CAROUSEL','ARTICLE','SHORT','INFOGRAPHIC','POLL']).optional(),
  plannedPublishDate: z.string().optional().nullable(),
  actualPublishDate: z.string().optional().nullable(),
  caption: z.string().optional(),
  hashtags: z.string().optional(),
  creativeBrief: z.string().optional(),
  mediaUrl: z.string().optional(),
  designerId: z.string().optional().nullable(),
  copywriterId: z.string().optional().nullable(),
  videographerId: z.string().optional().nullable(),
  approvalStatus: z.enum(['DRAFT','INTERNAL_REVIEW','CLIENT_REVIEW','APPROVED','REVISION_NEEDED','SCHEDULED','PUBLISHED','REJECTED']).optional(),
  likes: z.number().int().optional(),
  comments: z.number().int().optional(),
  shares: z.number().int().optional(),
  reach: z.number().int().optional(),
  impressions: z.number().int().optional(),
}).passthrough()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const item = await prisma.contentItem.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        socialAccount: { select: { id: true, accountName: true, platform: true, client: { select: { id: true, displayName: true } } } },
        designer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        copywriter: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        videographer: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        campaign: { select: { id: true, name: true } },
        approvals: {
          include: { reviewer: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!item) return notFound('Content item not found')
    return ok(serializeDecimals(item))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('social_media:edit')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.contentItem.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Content item not found')

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { plannedPublishDate, actualPublishDate, ...rest } = parsed.data
    const updated = await prisma.contentItem.update({
      where: { id },
      data: {
        ...rest,
        ...(plannedPublishDate !== undefined && { plannedPublishDate: plannedPublishDate ? new Date(plannedPublishDate) : null }),
        ...(actualPublishDate !== undefined && { actualPublishDate: actualPublishDate ? new Date(actualPublishDate) : null }),
      },
    })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'ContentItem', entityId: id, entityName: existing.contentType },
    })

    return ok(serializeDecimals(updated))
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('social_media:delete')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.contentItem.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Content item not found')

    await prisma.contentItem.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'ContentItem', entityId: id, entityName: existing.contentType },
    })

    return ok({ id, deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
