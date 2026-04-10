import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId') || ''

    const services = await prisma.service.findMany({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
        ...(categoryId && { categoryId }),
      },
      select: {
        id: true, name: true, nameAr: true, description: true,
        basePrice: true, currency: true, pricingType: true, isActive: true, order: true,
        category: { select: { id: true, name: true, nameAr: true } },
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    })

    return ok(serializeDecimals(services))
  } catch (err) {
    return serverError(err)
  }
}
