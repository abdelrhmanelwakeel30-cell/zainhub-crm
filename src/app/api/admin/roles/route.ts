import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, ok, parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

function isAdmin(roles?: string[]) {
  return roles?.includes('Super Admin') || roles?.includes('Admin')
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const withPermissions = searchParams.get('withPermissions') === 'true'

    const roles = await prisma.role.findMany({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        name: true,
        nameAr: true,
        description: true,
        isSystem: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
        ...(withPermissions && {
          rolePermissions: {
            include: {
              permission: { select: { id: true, module: true, action: true, description: true } },
            },
          },
        }),
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    })

    return ok(roles)
  } catch (err) {
    return serverError(err)
  }
}

const CreateRoleSchema = z.object({
  name: z.string().min(1).max(100),
  nameAr: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  permissionIds: z.array(z.string()).optional().default([]),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const parsed = await parseJson(req, CreateRoleSchema)
    if (parsed instanceof NextResponse) return parsed

    const tenantId = session.user.tenantId

    // Uniqueness check within tenant
    const existing = await prisma.role.findFirst({
      where: { tenantId, name: parsed.data.name },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A role with this name already exists' },
        { status: 409 },
      )
    }

    const { permissionIds, ...roleData } = parsed.data

    const role = await prisma.$transaction(async (tx) => {
      const r = await tx.role.create({
        data: {
          tenantId,
          name: roleData.name,
          nameAr: roleData.nameAr || null,
          description: roleData.description || null,
          isSystem: false,
        },
      })

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: r.id, permissionId })),
          skipDuplicates: true,
        })
      }

      return r
    })

    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'role',
      entityId: role.id,
      entityName: role.name,
      sourceModule: 'admin',
      req,
    })

    return NextResponse.json({ success: true, data: role }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
