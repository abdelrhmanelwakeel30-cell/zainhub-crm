import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, ok, parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

function isAdmin(roles?: string[]) {
  return roles?.includes('Super Admin') || roles?.includes('Admin')
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const role = await prisma.role.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, module: true, action: true, description: true } } },
        },
        _count: { select: { userRoles: true } },
      },
    })

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
    }

    return ok(role)
  } catch (err) {
    return serverError(err)
  }
}

const UpdateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameAr: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  permissionIds: z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const parsed = await parseJson(req, UpdateRoleSchema)
    if (parsed instanceof NextResponse) return parsed

    const { id } = await params
    const tenantId = session.user.tenantId

    const existing = await prisma.role.findFirst({
      where: { id, tenantId },
      select: { id: true, isSystem: true, name: true },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
    }
    if (existing.isSystem && parsed.data.name && parsed.data.name !== existing.name) {
      return NextResponse.json(
        { success: false, error: 'System roles cannot be renamed' },
        { status: 400 },
      )
    }

    const { permissionIds, ...roleData } = parsed.data

    const role = await prisma.$transaction(async (tx) => {
      const r = await tx.role.update({
        where: { id },
        data: {
          ...(roleData.name && { name: roleData.name }),
          ...(roleData.nameAr !== undefined && { nameAr: roleData.nameAr }),
          ...(roleData.description !== undefined && { description: roleData.description }),
        },
      })

      if (permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } })
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
            skipDuplicates: true,
          })
        }
      }

      return r
    })

    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'role',
      entityId: role.id,
      entityName: role.name,
      sourceModule: 'admin',
      req,
    })

    return ok(role)
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const tenantId = session.user.tenantId

    const role = await prisma.role.findFirst({
      where: { id, tenantId },
      select: { id: true, isSystem: true, name: true, _count: { select: { userRoles: true } } },
    })
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
    }
    if (role.isSystem) {
      return NextResponse.json(
        { success: false, error: 'System roles cannot be deleted' },
        { status: 400 },
      )
    }
    if (role._count.userRoles > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete role assigned to ${role._count.userRoles} user(s)` },
        { status: 400 },
      )
    }

    await prisma.role.delete({ where: { id } })

    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'role',
      entityId: role.id,
      entityName: role.name,
      sourceModule: 'admin',
      req,
    })

    return ok({ deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
