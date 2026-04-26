import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { getSession, unauthorized, serverError, notFound, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  completedAt: z.string().optional(),
  projectId: z.string().optional().nullable(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { id } = await params

    const onboarding = await prisma.clientOnboarding.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        company: { select: { id: true, displayName: true } },
        project: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
        items: {
          orderBy: { order: 'asc' },
          include: {
            completedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    })

    if (!onboarding) return notFound('Onboarding not found')

    return ok(onboarding)
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('onboarding:edit')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { id } = await params
    const existing = await prisma.clientOnboarding.findFirst({
      where: { id, tenantId: session.user.tenantId },
    })
    if (!existing) return notFound('Onboarding not found')

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status
    if (parsed.data.projectId !== undefined) updateData.projectId = parsed.data.projectId
    if (parsed.data.completedAt !== undefined) {
      updateData.completedAt = parsed.data.completedAt ? new Date(parsed.data.completedAt) : null
    }
    // Auto-set completedAt when marking completed
    if (parsed.data.status === 'COMPLETED' && !existing.completedAt) {
      updateData.completedAt = new Date()
    }

    const updated = await prisma.clientOnboarding.update({
      where: { id },
      data: updateData,
      include: {
        company: { select: { id: true, displayName: true } },
        project: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
        items: {
          orderBy: { order: 'asc' },
          include: {
            completedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    })

    return ok(updated)
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('onboarding:delete')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { id } = await params
    const existing = await prisma.clientOnboarding.findFirst({
      where: { id, tenantId: session.user.tenantId },
    })
    if (!existing) return notFound('Onboarding not found')

    await prisma.clientOnboarding.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'clientOnboarding',
        entityId: id,
        entityName: `Onboarding ${id}`,
      },
    })

    return ok({ deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
