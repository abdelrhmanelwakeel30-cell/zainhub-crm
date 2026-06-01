import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { computeLeadScore } from '@/lib/lead-score'
import { log } from '@/lib/logger'

/** Recalculate and persist a lead's heuristic score (AI-2). */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission('leads:edit')
  if (!guard.ok) return guard.response
  const { id } = await params
  const { tenantId, id: userId } = guard.session.user

  try {
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      select: { id: true, fullName: true, email: true, phone: true, whatsapp: true, companyName: true, budgetRange: true, urgency: true, nextFollowUpAt: true, createdAt: true, interestedServiceId: true },
    })
    if (!lead) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const { score, factors } = computeLeadScore(lead)
    await prisma.lead.update({ where: { id }, data: { score } })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'UPDATE', entityType: 'lead', entityId: id, entityName: `${lead.fullName} scored ${score}` },
    })
    return NextResponse.json({ success: true, data: { score, factors } })
  } catch (err) {
    log.error('POST /api/leads/[id]/score', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
