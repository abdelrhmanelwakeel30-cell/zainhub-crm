import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { parseJson } from '@/lib/api-helpers'
import { OpportunityUpdateSchema, pruneUndefined } from '@/lib/validators'
import { createAuditLog } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const opp = await prisma.opportunity.findFirst({
      where: { id, tenantId: session.user.tenantId, archivedAt: null },
      include: {
        company: { select: { id: true, displayName: true, industry: true } },
        primaryContact: { select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true } },
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        stage: { select: { id: true, name: true, color: true, probability: true } },
        pipeline: { select: { id: true, name: true } },
        lostReason: { select: { id: true, name: true } },
        lead: { select: { id: true, leadNumber: true, fullName: true } },
        opportunityServices: { include: { service: { select: { id: true, name: true } } } },
        quotations: { select: { id: true, quotationNumber: true, totalAmount: true, status: true }, orderBy: { createdAt: 'desc' }, take: 5 },
        projects: { select: { id: true, projectNumber: true, name: true, status: true }, orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    if (!opp) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: opp })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.opportunity.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const parsed = await parseJson(req, OpportunityUpdateSchema)
    if (parsed instanceof NextResponse) return parsed
    const data = pruneUndefined({ ...parsed.data }) as Record<string, unknown>

    // Recompute weighted value whenever either factor changes
    const nextExpected =
      (data.expectedValue as number | undefined) ?? Number(existing.expectedValue)
    const nextProbability =
      (data.probability as number | undefined) ?? existing.probability
    if (data.expectedValue !== undefined || data.probability !== undefined) {
      data.weightedValue = (nextExpected * nextProbability) / 100
    }

    const opp = await prisma.opportunity.update({ where: { id }, data })
    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'opportunity',
      entityId: id,
      entityName: opp.title,
      beforeValue: existing as unknown as Record<string, unknown>,
      afterValue: opp as unknown as Record<string, unknown>,
      sourceModule: 'opportunities',
      req,
    })
    return NextResponse.json({ success: true, data: opp })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const opp = await prisma.opportunity.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!opp) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.opportunity.update({ where: { id }, data: { archivedAt: new Date() } })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'ARCHIVE', entityType: 'opportunity', entityId: id, entityName: opp.title } })
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
