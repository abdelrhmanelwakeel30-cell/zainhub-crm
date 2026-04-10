import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE','INACTIVE','SUSPENDED']).optional().default('ACTIVE'),
  roleIds: z.array(z.string()).optional().default([]),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    // Only admins/super admins can list users
    const isAdmin = session.user.roles?.includes('Super Admin') || session.user.roles?.includes('Admin')
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
        ],
      }),
      ...(status && { status }),
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          userRoles: {
            include: {
              role: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return paginatedOk(serializeDecimals(data), total, page, pageSize)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const isAdmin = session.user.roles?.includes('Super Admin') || session.user.roles?.includes('Admin')
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = CreateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const tenantId = session.user.tenantId
    const { password, roleIds, ...userData } = parsed.data

    // Check email uniqueness within tenant
    const existing = await prisma.user.findFirst({ where: { tenantId, email: userData.email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { tenantId, passwordHash, ...userData },
      })
      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: newUser.id, roleId })),
        })
      }
      return newUser
    })

    await prisma.auditLog.create({
      data: { tenantId, userId: session.user.id, action: 'CREATE', entityType: 'User', entityId: user.id, entityName: `${user.firstName} ${user.lastName}` },
    })

    const { passwordHash: _ph, ...safeUser } = user
    return NextResponse.json({ success: true, data: safeUser }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
