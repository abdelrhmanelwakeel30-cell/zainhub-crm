import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { logCreate } from '@/lib/activity'
import { assertTenantOwnsAll } from '@/lib/api-helpers'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  clientId: z.string().optional(),
  opportunityId: z.string().optional(),
  serviceId: z.string().optional(),
  ownerId: z.string().optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  status: z.string().default('NOT_STARTED'),
  budgetValue: z.number().optional(),
  currency: z.string().default('AED'),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'))
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const ownerId = searchParams.get('ownerId') || ''
  const where: Record<string, unknown> = { tenantId: session.user.tenantId, archivedAt: null }
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' as const } }, { client: { displayName: { contains: search, mode: 'insensitive' as const } } }]
  if (status) where.status = status
  if (ownerId) where.ownerId = ownerId
  try {
    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize,
        include: {
          client: { select: { id: true, displayName: true } },
          owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
        },
      }),
      prisma.project.count({ where }),
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
    const projectNumber = await nextNumber(tenantId, 'project')

    // T-002: tenant-scope every FK from input.
    await assertTenantOwnsAll(prisma, tenantId, [
      { model: 'company', id: parsed.data.clientId },
      { model: 'opportunity', id: parsed.data.opportunityId },
      { model: 'service', id: parsed.data.serviceId },
    ])

    const project = await prisma.project.create({
      data: {
        tenantId, projectNumber,
        name: parsed.data.name, description: parsed.data.description || null,
        clientId: parsed.data.clientId || null, opportunityId: parsed.data.opportunityId || null,
        serviceId: parsed.data.serviceId || null, ownerId: parsed.data.ownerId || userId,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        targetEndDate: parsed.data.targetEndDate ? new Date(parsed.data.targetEndDate) : null,
        status: parsed.data.status as 'NOT_STARTED',
        budgetValue: parsed.data.budgetValue ?? null,
        currency: parsed.data.currency as 'AED',
        notes: parsed.data.notes || null,
      },
      include: { client: { select: { id: true, displayName: true } }, owner: { select: { id: true, firstName: true, lastName: true } } },
    })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'project', entityId: project.id, entityName: project.name } })
    logCreate(tenantId, 'project', project.id, project.name, userId)
    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
