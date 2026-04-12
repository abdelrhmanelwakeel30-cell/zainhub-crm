import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, serverError, parsePagination, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where = {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      ...(unreadOnly && { isRead: false }),
    }

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { tenantId: session.user.tenantId, userId: session.user.id, isRead: false },
      }),
    ])

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      unreadCount,
    })
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest) {
  // Mark single notification as read
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const { id } = body
    if (!id) return ok({ updated: 0 })

    await prisma.notification.updateMany({
      where: { id, userId: session.user.id, tenantId: session.user.tenantId },
      data: { isRead: true, readAt: new Date() },
    })

    const unreadCount = await prisma.notification.count({
      where: { tenantId: session.user.tenantId, userId: session.user.id, isRead: false },
    })

    return ok({ id, isRead: true, unreadCount })
  } catch (err) {
    return serverError(err)
  }
}
