import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params

  const website = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId }, select: { id: true } })
  if (!website) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  const logs = await prisma.websiteSyncLog.findMany({
    where: { websiteId: id },
    orderBy: { startedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ success: true, data: logs })
}
