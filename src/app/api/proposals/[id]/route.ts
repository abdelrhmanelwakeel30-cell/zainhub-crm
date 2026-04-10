import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  title: z.string().optional(),
  status: z.enum(['DRAFT','SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED','REVISED']).optional(),
  validUntil: z.string().optional().nullable(),
  executiveSummary: z.string().optional(),
  scopeOfWork: z.string().optional(),
  deliverables: z.string().optional(),
  timeline: z.string().optional(),
  methodology: z.string().optional(),
  subtotal: z.number().optional(),
  discountAmount: z.number().optional(),
  taxAmount: z.number().optional(),
  totalAmount: z.number().optional(),
  terms: z.string().optional(),
  acceptedAt: z.string().optional().nullable(),
}).passthrough()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const proposal = await prisma.proposal.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        company: { select: { id: true, displayName: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        opportunity: { select: { id: true, opportunityNumber: true, title: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: { include: { service: { select: { id: true, name: true } } }, orderBy: { order: 'asc' } },
      },
    })

    if (!proposal) return notFound('Proposal not found')
    return ok(serializeDecimals(proposal))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.proposal.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Proposal not found')

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { validUntil, acceptedAt, ...rest } = parsed.data
    const updated = await prisma.proposal.update({
      where: { id },
      data: {
        ...rest,
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(acceptedAt !== undefined && { acceptedAt: acceptedAt ? new Date(acceptedAt) : null }),
      },
    })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'Proposal', entityId: id, entityName: existing.proposalNumber },
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

    const existing = await prisma.proposal.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Proposal not found')

    await prisma.proposal.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'Proposal', entityId: id, entityName: existing.proposalNumber },
    })

    return ok({ id, deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
