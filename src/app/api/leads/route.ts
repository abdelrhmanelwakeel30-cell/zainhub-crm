import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { logCreate } from '@/lib/activity'
import { invalidate } from '@/lib/cache'
import { log } from '@/lib/logger'
import { z } from 'zod'

const createLeadSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  companyName: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  sourceId: z.string().optional(),
  budgetRange: z.string().optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  interestedServiceId: z.string().optional(),
  assignedToId: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  score: z.number().int().min(0).max(100).default(0),
  notesSummary: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'))
  const search = searchParams.get('search') || ''
  const stageId = searchParams.get('stageId') || ''
  const assignedToId = searchParams.get('assignedToId') || ''
  const urgency = searchParams.get('urgency') || ''

  const where: Record<string, unknown> = { tenantId: session.user.tenantId, archivedAt: null }
  if (search) where.OR = [{ fullName: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }, { companyName: { contains: search, mode: 'insensitive' as const } }]
  if (stageId) where.stageId = stageId
  if (assignedToId) where.assignedToId = assignedToId
  if (urgency) where.urgency = urgency

  try {
    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          stage: { select: { id: true, name: true, color: true } },
          source: { select: { id: true, name: true } },
          interestedService: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
          company: { select: { id: true, displayName: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ])

    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/leads', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('leads:create')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createLeadSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const { tenantId, id: userId } = session.user
    const leadNumber = await nextNumber(tenantId, 'lead')

    let { pipelineId, stageId } = parsed.data
    if (!pipelineId) {
      const defaultPipeline = await prisma.pipeline.findFirst({
        where: { tenantId, entityType: 'LEAD', isDefault: true },
        include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
      })
      if (defaultPipeline) {
        pipelineId = defaultPipeline.id
        if (!stageId && defaultPipeline.stages[0]) stageId = defaultPipeline.stages[0].id
      }
    }

    const lead = await prisma.lead.create({
      data: {
        tenantId, leadNumber,
        fullName: parsed.data.fullName,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        whatsapp: parsed.data.whatsapp || null,
        companyName: parsed.data.companyName || null,
        country: parsed.data.country || null,
        city: parsed.data.city || null,
        sourceId: parsed.data.sourceId || null,
        budgetRange: parsed.data.budgetRange || null,
        urgency: parsed.data.urgency,
        interestedServiceId: parsed.data.interestedServiceId || null,
        assignedToId: parsed.data.assignedToId || null,
        pipelineId: pipelineId || null,
        stageId: stageId || null,
        score: parsed.data.score,
        notesSummary: parsed.data.notesSummary || null,
        nextFollowUpAt: parsed.data.nextFollowUpAt ? new Date(parsed.data.nextFollowUpAt) : null,
        createdById: userId,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        stage: { select: { id: true, name: true, color: true } },
        source: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'lead', entityId: lead.id, entityName: lead.fullName },
    })

    logCreate(tenantId, 'lead', lead.id, lead.fullName, userId)

    return NextResponse.json({ success: true, data: lead }, { status: 201 })
  } catch (err) {
    log.error('POST /api/leads', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
