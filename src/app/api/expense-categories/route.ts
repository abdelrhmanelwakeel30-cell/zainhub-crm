import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { cached } from '@/lib/cache'

const getExpenseCategories = cached(
  async (tenantId: string) => {
    return prisma.expenseCategory.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, nameAr: true, icon: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      take: 200, // P-001
    })
  },
  ['expense-categories'],
  { revalidate: 300, tags: ['lookup-expense-categories'] },
)

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const categories = await getExpenseCategories(session.user.tenantId)
    return ok(categories)
  } catch (err) {
    return serverError(err)
  }
}
