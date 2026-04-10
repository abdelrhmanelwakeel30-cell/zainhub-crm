import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const clientId = searchParams.get('clientId') || ''
    const method = searchParams.get('method') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(clientId && { clientId }),
    }

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: { id: true, invoiceNumber: true, client: { select: { id: true, displayName: true } } },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ])

    return paginatedOk(serializeDecimals(data), total, page, pageSize)
  } catch (err) {
    return serverError(err)
  }
}
