import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const isAdmin =
      session.user.roles?.includes('Super Admin') || session.user.roles?.includes('Admin')
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)

    const action = searchParams.get('action') || ''
    const entityType = searchParams.get('entityType') || ''
    const userId = searchParams.get('userId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(action && { action }),
      ...(entityType && { entityType: { contains: entityType, mode: 'insensitive' as const } }),
      ...(userId && { userId }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ])

    return paginatedOk(data, total, page, pageSize)
  } catch (err) {
    return serverError(err)
  }
}
