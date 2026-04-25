import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  password: z.string().min(8).optional(),
  roleIds: z.array(z.string()).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const isAdmin = session.user.roles?.includes('Super Admin') || session.user.roles?.includes('Admin')
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const { id } = await ctx.params

    const user = await prisma.user.findFirst({
      where: { id, tenantId: session.user.tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        jobTitle: true,
        department: true,
        phone: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        userRoles: { include: { role: { select: { id: true, name: true } } } },
      },
    })
    if (!user) return notFound('User not found')
    return ok(serializeDecimals(user))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const isAdmin = session.user.roles?.includes('Super Admin') || session.user.roles?.includes('Admin')
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const { id } = await ctx.params

    const existing = await prisma.user.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('User not found')

    const body = await req.json()
    const parsed = UpdateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { password, roleIds, ...updateData } = parsed.data

    const user = await prisma.$transaction(async (tx) => {
      if (password) {
        (updateData as Record<string, unknown>).passwordHash = await bcrypt.hash(password, 12)
      }
      const updated = await tx.user.update({ where: { id }, data: updateData })

      if (roleIds !== undefined) {
        // T-001 (CRM-V3-FULL-AUDIT-2026-04-25.md): verify every role belongs to the
        // caller's tenant before attaching. Without this, a tenant admin could
        // attach Tenant B's roles to a Tenant A user, escalating privileges via
        // permissions defined in another tenant's role.
        if (roleIds.length > 0) {
          const owned = await tx.role.findMany({
            where: { id: { in: roleIds }, tenantId: session.user.tenantId },
            select: { id: true },
          })
          if (owned.length !== roleIds.length) {
            throw new Error('FORBIDDEN_CROSS_TENANT_ROLE')
          }
        }
        await tx.userRole.deleteMany({ where: { userId: id } })
        if (roleIds.length > 0) {
          await tx.userRole.createMany({ data: roleIds.map((roleId) => ({ userId: id, roleId })) })
        }
      }
      return updated
    })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'User', entityId: id, entityName: `${user.firstName} ${user.lastName}` },
    })

    const { passwordHash: _ph, ...safeUser } = user
    return ok(safeUser)
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const isAdmin = session.user.roles?.includes('Super Admin') || session.user.roles?.includes('Admin')
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const { id } = await ctx.params

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ success: false, error: 'Cannot deactivate your own account' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return notFound('User not found')

    // Soft-delete: deactivate rather than hard delete
    await prisma.user.update({ where: { id }, data: { status: 'INACTIVE' } })

    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'User', entityId: id, entityName: `${existing.firstName} ${existing.lastName}` },
    })

    return ok({ id, deactivated: true })
  } catch (err) {
    return serverError(err)
  }
}
