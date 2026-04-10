import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || '' // LEAD, OPPORTUNITY

    const pipelines = await prisma.pipeline.findMany({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
        ...(type && { type }),
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          select: {
            id: true, name: true, nameAr: true, order: true, color: true,
            probability: true, isClosed: true, isWon: true,
          },
        },
      },
      orderBy: { isDefault: 'desc' },
    })

    return ok(pipelines)
  } catch (err) {
    return serverError(err)
  }
}
