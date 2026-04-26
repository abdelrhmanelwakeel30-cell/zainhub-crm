import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { logUpdate } from '@/lib/activity'
import { log } from '@/lib/logger'
import { z } from 'zod'

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  sourceId: z.string().optional().nullable(),
  budgetRange: z.string().optional().nullable(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  interestedServiceId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  stageId: z.string().optional().nullable(),
  score: z.number().int().min(0).max(100).optional(),
  notesSummary: z.string().optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
  lostReasonId: z.string().optional().nullable(),
  lostNotes: z.string().optional().nullable(),
  lostAt: z.string().optional().nullable(),
  lastContactedAt: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId: session.user.tenantId, archivedAt: null },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true, jobTitle: true } },
        stage: { select: { id: true, name: true, color: true } },
        pipeline: { select: { id: true, name: true } },
        source: { select: { id: true, name: true } },
        interestedService: { select: { id: true, name: true } },
        lostReason: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        campaign: { select: { id: true, name: true } },
        company: { select: { id: true, displayName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    if (!lead) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: lead })
  } catch (err) {
    log.error('GET /api/leads/[id]', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.lead.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const d = parsed.data
    const updateData: Record<string, unknown> = {}
    Object.entries(d).forEach(([k, v]) => { if (v !== undefined) updateData[k] = v === '' ? null : v })
    if (d.nextFollowUpAt) updateData.nextFollowUpAt = new Date(d.nextFollowUpAt)
    if (d.lostAt) updateData.lostAt = new Date(d.lostAt)
    if (d.lastContactedAt) updateData.lastContactedAt = new Date(d.lastContactedAt)

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        stage: { select: { id: true, name: true, color: true } },
        source: { select: { id: true, name: true } },
      },
    })
    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'lead', entityId: id, entityName: lead.fullName },
    })
    logUpdate(session.user.tenantId, 'lead', lead.id, lead.fullName, session.user.id)
    return NextResponse.json({ success: true, data: lead })
  } catch (err) {
    log.error('PATCH /api/leads/[id]', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const lead = await prisma.lead.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!lead) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.lead.update({ where: { id }, data: { archivedAt: new Date() } })
    await prisma.auditLog.create({
      data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'ARCHIVE', entityType: 'lead', entityId: id, entityName: lead.fullName },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('DELETE /api/leads/[id]', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
