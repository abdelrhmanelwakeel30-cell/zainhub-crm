import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['EMAIL','SOCIAL','ADS','EVENT','REFERRAL','CONTENT_MARKETING','OTHER']).optional(),
  platform: z.string().optional(),
  budget: z.number().optional().nullable(),
  actualSpend: z.number().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['DRAFT','ACTIVE','PAUSED','COMPLETED','CANCELLED']).optional(),
  leadsGenerated: z.number().int().optional(),
  opportunitiesCreated: z.number().int().optional(),
  revenueGenerated: z.number().optional(),
}).passthrough()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        _count: { select: { leads: true, contentItems: true } },
      },
    })

    if (!campaign) return notFound('Campaign not found')
    return ok(serializeDecimals(campaign))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.campaign.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Campaign not found')

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { startDate, endDate, ...rest } = parsed.data
    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'Campaign', entityId: id, entityName: existing.name },
    })

    return ok(serializeDecimals(updated))
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.campaign.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Campaign not found')

    await prisma.campaign.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'Campaign', entityId: id, entityName: existing.name },
    })

    return ok({ id, deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
