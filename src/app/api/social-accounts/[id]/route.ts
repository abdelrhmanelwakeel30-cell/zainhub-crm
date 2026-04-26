import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  accountName: z.string().optional(),
  accountUrl: z.string().optional(),
  postingFrequency: z.string().optional(),
  contentPillars: z.array(z.string()).optional(),
  brandGuidelines: z.string().optional(),
  targetAudience: z.string().optional(),
  approvalContactId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
}).passthrough()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const account = await prisma.socialAccount.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        client: { select: { id: true, displayName: true, logoUrl: true } },
        approvalContact: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { contentItems: true } },
      },
    })

    if (!account) return notFound('Social account not found')
    return ok(serializeDecimals(account))
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

    const existing = await prisma.socialAccount.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Social account not found')

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { contentPillars, ...rest } = parsed.data
    const updated = await prisma.socialAccount.update({
      where: { id },
      data: {
        ...rest,
        ...(contentPillars !== undefined && { contentPillars: JSON.stringify(contentPillars) }),
      },
    })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'SocialAccount', entityId: id, entityName: existing.accountName },
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

    const existing = await prisma.socialAccount.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Social account not found')

    await prisma.socialAccount.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'SocialAccount', entityId: id, entityName: existing.accountName },
    })

    return ok({ id, deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
