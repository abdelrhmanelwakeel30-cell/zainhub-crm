import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, ok, parsePagination, paginatedOk } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { UserStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const minimal = searchParams.get('minimal') === 'true'

    if (minimal) {
      // Lightweight list for dropdowns/assignee selectors
      const users = await prisma.user.findMany({
        where: {
          tenantId: session.user.tenantId,
          status: 'ACTIVE',
          ...(search && {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
            ],
          }),
        },
        select: { id: true, firstName: true, lastName: true, avatar: true, jobTitle: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        take: 50,
      })
      return ok(users)
    }

    const { page, pageSize, skip } = parsePagination(searchParams)
    const status = searchParams.get('status') || ''

    const where = {
      tenantId: session.user.tenantId,
      ...(status && { status: status as UserStatus }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          avatar: true, jobTitle: true, department: true, status: true,
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return paginatedOk(data, total, page, pageSize)
  } catch (err) {
    return serverError(err)
  }
}
