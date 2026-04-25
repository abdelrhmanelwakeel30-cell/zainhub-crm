import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const sources = await prisma.leadSource.findMany({
      where: { tenantId: session.user.tenantId, isActive: true },
      select: { id: true, name: true, nameAr: true, type: true, icon: true },
      orderBy: { name: 'asc' },
      take: 200, // P-001: defensive cap on lookup table
    })

    return ok(sources)
  } catch (err) {
    return serverError(err)
  }
}
