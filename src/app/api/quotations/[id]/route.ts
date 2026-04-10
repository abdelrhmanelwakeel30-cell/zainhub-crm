import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  title: z.string().optional(),
  status: z.enum(['DRAFT','SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED','REVISED']).optional(),
  validUntil: z.string().optional().nullable(),
  subtotal: z.number().optional(),
  discountAmount: z.number().optional(),
  taxAmount: z.number().optional(),
  totalAmount: z.number().optional(),
  terms: z.string().optional(),
  assumptions: z.string().optional(),
  exclusions: z.string().optional(),
  acceptedAt: z.string().optional().nullable(),
  acceptedByName: z.string().optional(),
}).passthrough()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const q = await prisma.quotation.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        company: { select: { id: true, displayName: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        opportunity: { select: { id: true, opportunityNumber: true, title: true } },
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        taxRate: { select: { id: true, name: true, rate: true } },
        items: { include: { service: { select: { id: true, name: true } } }, orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    if (!q) return notFound('Quotation not found')
    return ok(serializeDecimals(q))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.quotation.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Quotation not found')

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { validUntil, acceptedAt, ...rest } = parsed.data
    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        ...rest,
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(acceptedAt !== undefined && { acceptedAt: acceptedAt ? new Date(acceptedAt) : null }),
      },
    })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'Quotation', entityId: id, entityName: existing.quotationNumber },
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

    const existing = await prisma.quotation.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Quotation not found')

    await prisma.quotation.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'Quotation', entityId: id, entityName: existing.quotationNumber },
    })

    return ok({ id, deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
