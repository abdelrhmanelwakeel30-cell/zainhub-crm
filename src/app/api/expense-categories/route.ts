import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const categories = await prisma.expenseCategory.findMany({
      where: { tenantId: session.user.tenantId, isActive: true },
      select: { id: true, name: true, nameAr: true, icon: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      take: 200, // P-001
    })

    return ok(categories)
  } catch (err) {
    return serverError(err)
  }
}
