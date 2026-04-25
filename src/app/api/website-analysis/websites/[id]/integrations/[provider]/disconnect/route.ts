import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { integrationProviderSchema } from '@/lib/validators/website-analysis'

interface Ctx { params: Promise<{ id: string; provider: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const guard = await requireApiPermission('website_analysis:edit')
  if (!guard.ok) return guard.response
  const { session } = guard

  const { id, provider: providerRaw } = await ctx.params
  const parsedProvider = integrationProviderSchema.safeParse(providerRaw)
  if (!parsedProvider.success) return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 })
  const provider = parsedProvider.data

  const website = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId }, select: { id: true, name: true } })
  if (!website) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  const existing = await prisma.websiteIntegration.findUnique({ where: { websiteId_provider: { websiteId: id, provider } } })
  if (!existing) return NextResponse.json({ success: true, data: { alreadyDisconnected: true } })

  const updated = await prisma.websiteIntegration.update({
    where: { id: existing.id },
    data: {
      status: 'NOT_CONNECTED',
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
      scopes: [],
      disconnectedAt: new Date(),
      lastErrorMsg: null,
    },
  })

  await createAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'WebsiteIntegration',
    entityId: updated.id,
    entityName: `${website.name} / ${provider}`,
    beforeValue: existing as unknown as Record<string, unknown>,
    afterValue: updated as unknown as Record<string, unknown>,
    sourceModule: 'website-analysis',
    req,
  })

  return NextResponse.json({ success: true, data: updated })
}
