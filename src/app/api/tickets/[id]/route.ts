import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  subject: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['BUG','FEATURE_REQUEST','QUESTION','SUPPORT','CHANGE_REQUEST','OTHER']).optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional(),
  assignedToId: z.string().optional().nullable(),
  status: z.enum(['NEW','OPEN','IN_PROGRESS','WAITING_CLIENT','RESOLVED','CLOSED','REOPENED']).optional(),
  slaDueAt: z.string().optional().nullable(),
  resolutionSummary: z.string().optional(),
  resolvedAt: z.string().optional().nullable(),
  closedAt: z.string().optional().nullable(),
}).passthrough()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const ticket = await prisma.ticket.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        client: { select: { id: true, displayName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, projectNumber: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) return notFound('Ticket not found')
    return ok(serializeDecimals(ticket))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.ticket.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Ticket not found')

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { slaDueAt, resolvedAt, closedAt, status, ...rest } = parsed.data

    const autoResolvedAt = status === 'RESOLVED' && !existing.resolvedAt && !resolvedAt ? new Date() : undefined
    const autoClosedAt = status === 'CLOSED' && !existing.closedAt && !closedAt ? new Date() : undefined

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status }),
        ...(slaDueAt !== undefined && { slaDueAt: slaDueAt ? new Date(slaDueAt) : null }),
        ...(resolvedAt !== undefined && { resolvedAt: resolvedAt ? new Date(resolvedAt) : null }),
        ...(closedAt !== undefined && { closedAt: closedAt ? new Date(closedAt) : null }),
        ...(autoResolvedAt && { resolvedAt: autoResolvedAt }),
        ...(autoClosedAt && { closedAt: autoClosedAt }),
      },
    })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'Ticket', entityId: id, entityName: existing.ticketNumber },
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

    const existing = await prisma.ticket.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Ticket not found')

    await prisma.ticket.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'Ticket', entityId: id, entityName: existing.ticketNumber },
    })

    return ok({ id, deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
