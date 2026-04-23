import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { integrationProviderSchema } from '@/lib/validators/website-analysis'

interface Ctx { params: Promise<{ id: string; provider: string }> }

// Phase 1 stub — returns NOT_IMPLEMENTED_PHASE_1 and audit-logs the attempt.
// Phase 2 replaces this body with the real OAuth authorization URL builder.
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

  await createAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'WebsiteIntegration',
    entityId: `${id}:${provider}`,
    entityName: `${website.name} / ${provider}`,
    afterValue: { attempted: true, provider, reason: 'NOT_IMPLEMENTED_PHASE_1' },
    sourceModule: 'website-analysis',
    req,
  })

  return NextResponse.json(
    { success: false, reason: 'NOT_IMPLEMENTED_PHASE_1', message: 'Connecting this provider goes live in the next release.' },
    { status: 501 },
  )
}
