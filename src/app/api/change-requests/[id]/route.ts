import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  companyId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  clientServiceId: z.string().optional().nullable(),
  type: z.enum(['SCOPE', 'FEATURE', 'BUG', 'DESIGN', 'CONTENT', 'TECHNICAL', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'IMPACT_ANALYSIS', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']).optional(),
  impactDescription: z.string().optional(),
  impactedAreas: z.string().optional(),
  estimatedHours: z.number().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  currency: z.enum(['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR']).optional(),
  approvalRequired: z.boolean().optional(),
  dueDate: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
}).passthrough()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const changeRequest = await prisma.changeRequest.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        company: { select: { id: true, displayName: true } },
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        approvalRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!changeRequest) return notFound('Change request not found')
    return ok(serializeDecimals(changeRequest))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.changeRequest.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Change request not found')

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { dueDate, completedAt, status, estimatedHours, estimatedCost, ...rest } = parsed.data

    const autoCompletedAt = status === 'COMPLETED' && !existing.completedAt && !completedAt ? new Date() : undefined

    const updated = await prisma.changeRequest.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
        ...(autoCompletedAt && { completedAt: autoCompletedAt }),
        ...(estimatedHours !== undefined && { estimatedHours: estimatedHours }),
        ...(estimatedCost !== undefined && { estimatedCost: estimatedCost }),
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'ChangeRequest',
        entityId: id,
        entityName: existing.crNumber,
      },
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

    const existing = await prisma.changeRequest.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Change request not found')

    await prisma.changeRequest.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'ChangeRequest',
        entityId: id,
        entityName: existing.crNumber,
      },
    })

    return ok({ id, deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
