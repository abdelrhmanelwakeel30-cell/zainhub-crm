import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateSchema = z.object({
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  serviceName: z.string().optional(),
  packageId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'PENDING_RENEWAL']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  renewalDate: z.string().optional().nullable(),
  supportEndDate: z.string().optional().nullable(),
  environment: z.enum(['PRODUCTION', 'STAGING', 'DEVELOPMENT']).optional(),
  version: z.string().optional(),
  monthlyValue: z.number().optional().nullable(),
  totalContractValue: z.number().optional().nullable(),
  currency: z.enum(['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR']).optional(),
  notes: z.string().optional(),
}).passthrough()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const clientService = await prisma.clientService.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        company: { select: { id: true, displayName: true, email: true, phone: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        service: { select: { id: true, name: true } },
        package: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        milestones: { orderBy: { order: 'asc' } },
        teamMembers: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        changeRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
        previewLinks: { orderBy: { createdAt: 'desc' } },
        deliverables: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!clientService) return notFound('Client service not found')
    return ok(serializeDecimals(clientService))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('client_services:edit')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.clientService.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Client service not found')

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { startDate, endDate, renewalDate, supportEndDate, ...rest } = parsed.data

    const updated = await prisma.clientService.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(renewalDate !== undefined && { renewalDate: renewalDate ? new Date(renewalDate) : null }),
        ...(supportEndDate !== undefined && { supportEndDate: supportEndDate ? new Date(supportEndDate) : null }),
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'ClientService',
        entityId: id,
        entityName: existing.clientServiceNumber,
      },
    })

    return ok(serializeDecimals(updated))
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('client_services:delete')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.clientService.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('Client service not found')

    // Soft delete: mark as CANCELLED
    await prisma.clientService.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'ClientService',
        entityId: id,
        entityName: existing.clientServiceNumber,
      },
    })

    return ok({ id, cancelled: true })
  } catch (err) {
    return serverError(err)
  }
}
