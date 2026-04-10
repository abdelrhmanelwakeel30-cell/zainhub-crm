import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  title: z.string().optional(),
  type: z.enum(['SERVICE','RETAINER','NDA','PARTNERSHIP','MAINTENANCE','OTHER']).optional(),
  contactId: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  renewalDate: z.string().optional().nullable(),
  autoRenew: z.boolean().optional(),
  value: z.number().optional().nullable(),
  status: z.enum(['DRAFT','SENT','ACTIVE','EXPIRED','TERMINATED','RENEWED']).optional(),
  scopeSummary: z.string().optional(),
  terms: z.string().optional(),
  signedAt: z.string().optional().nullable(),
}).passthrough()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const contract = await prisma.contract.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        client: { select: { id: true, displayName: true, email: true, phone: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        invoices: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true }, take: 10 },
      },
    })

    if (!contract) return notFound('Contract not found')
    return ok(serializeDecimals(contract))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.contract.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Contract not found')

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { startDate, endDate, renewalDate, signedAt, ...rest } = parsed.data
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(renewalDate !== undefined && { renewalDate: renewalDate ? new Date(renewalDate) : null }),
        ...(signedAt !== undefined && { signedAt: signedAt ? new Date(signedAt) : null }),
      },
    })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'Contract', entityId: id, entityName: existing.contractNumber },
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

    const existing = await prisma.contract.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Contract not found')

    await prisma.contract.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'Contract', entityId: id, entityName: existing.contractNumber },
    })

    return ok({ id, deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
