import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const result = await prisma.notification.updateMany({
      where: { tenantId: session.user.tenantId, userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })

    return ok({ updated: result.count, unreadCount: 0 })
  } catch (err) {
    return serverError(err)
  }
}
