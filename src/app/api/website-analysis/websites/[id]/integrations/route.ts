import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { PROVIDER_ORDER, PROVIDER_META } from '@/lib/website-analysis/providers'

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params

  const website = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId }, select: { id: true } })
  if (!website) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  const existing = await prisma.websiteIntegration.findMany({ where: { websiteId: id } })
  const byProvider = new Map(existing.map((i) => [i.provider, i]))

  // Return one row per provider — DB row if present, otherwise synthetic NOT_CONNECTED
  const data = PROVIDER_ORDER.map((provider) => {
    const row = byProvider.get(provider)
    return {
      provider,
      meta: PROVIDER_META[provider],
      integration: row ?? {
        id: null,
        status: 'NOT_CONNECTED' as const,
        lastSyncAt: null,
        lastSyncStatus: null,
        lastErrorMsg: null,
        connectedAt: null,
        externalAccountLabel: null,
      },
    }
  })

  return NextResponse.json({ success: true, data })
}
