import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { cached } from '@/lib/cache'

const getLeadSources = cached(
  async (tenantId: string) => {
    return prisma.leadSource.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, nameAr: true, type: true, icon: true },
      orderBy: { name: 'asc' },
      take: 200, // P-001: defensive cap on lookup table
    })
  },
  ['lead-sources'],
  { revalidate: 300, tags: ['lookup-lead-sources'] },
)

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const sources = await getLeadSources(session.user.tenantId)
    return ok(sources)
  } catch (err) {
    return serverError(err)
  }
}
