import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { logCreate } from '@/lib/activity'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  companyId: z.string().optional(),
  primaryContactId: z.string().optional(),
  ownerId: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  expectedValue: z.number().default(0),
  currency: z.string().default('AED'),
  probability: z.number().int().min(0).max(100).default(20),
  expectedCloseDate: z.string().optional(),
  forecastMonth: z.string().optional(),
  riskLevel: z.enum(['LOW','MEDIUM','HIGH']).default('LOW'),
  competitorNotes: z.string().optional(),
  nextSteps: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'))
  const search = searchParams.get('search') || ''
  const stageId = searchParams.get('stageId') || ''
  const ownerId = searchParams.get('ownerId') || ''
  const where: Record<string, unknown> = { tenantId: session.user.tenantId, archivedAt: null }
  if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' as const } }, { company: { displayName: { contains: search, mode: 'insensitive' as const } } }]
  if (stageId) where.stageId = stageId
  if (ownerId) where.ownerId = ownerId
  try {
    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: {
          company: { select: { id: true, displayName: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
          stage: { select: { id: true, name: true, color: true, probability: true } },
          primaryContact: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page-1)*pageSize, take: pageSize,
      }),
      prisma.opportunity.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const { tenantId, id: userId } = session.user
    const opportunityNumber = await nextNumber(tenantId, 'opportunity')

    let { pipelineId, stageId } = parsed.data
    if (!pipelineId) {
      const dp = await prisma.pipeline.findFirst({ where: { tenantId, entityType: 'OPPORTUNITY', isDefault: true }, include: { stages: { orderBy: { order: 'asc' }, take: 1 } } })
      if (dp) { pipelineId = dp.id; if (!stageId && dp.stages[0]) stageId = dp.stages[0].id }
    }

    const probability = parsed.data.probability
    const expectedValue = parsed.data.expectedValue
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId, opportunityNumber,
        title: parsed.data.title, description: parsed.data.description || null,
        companyId: parsed.data.companyId || null, primaryContactId: parsed.data.primaryContactId || null,
        ownerId: parsed.data.ownerId || userId,
        pipelineId: pipelineId || null, stageId: stageId || null,
        expectedValue, currency: parsed.data.currency as 'AED',
        probability, weightedValue: (expectedValue * probability) / 100,
        expectedCloseDate: parsed.data.expectedCloseDate ? new Date(parsed.data.expectedCloseDate) : null,
        forecastMonth: parsed.data.forecastMonth || null,
        riskLevel: parsed.data.riskLevel, competitorNotes: parsed.data.competitorNotes || null,
        nextSteps: parsed.data.nextSteps || null, createdById: userId,
      },
      include: { company: { select: { id: true, displayName: true } }, owner: { select: { id: true, firstName: true, lastName: true } }, stage: { select: { id: true, name: true, color: true } } },
    })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'opportunity', entityId: opportunity.id, entityName: opportunity.title } })
    logCreate(tenantId, 'opportunity', opportunity.id, opportunity.title, userId)
    return NextResponse.json({ success: true, data: opportunity }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
