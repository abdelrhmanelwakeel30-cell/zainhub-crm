import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { logCreate } from '@/lib/activity'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).default('MEDIUM'),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  parentTaskId: z.string().optional(),
  relatedType: z.string().optional(),
  relatedId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'))
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const assignedToId = searchParams.get('assignedToId') || ''
  const projectId = searchParams.get('projectId') || ''
  const where: Record<string, unknown> = { tenantId: session.user.tenantId, parentTaskId: null }
  if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' as const } }]
  if (status) where.status = status
  if (assignedToId) where.assignedToId = assignedToId
  if (projectId) where.projectId = projectId
  try {
    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where, orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }], skip: (page-1)*pageSize, take: pageSize,
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          project: { select: { id: true, name: true } },
          subtasks: { select: { id: true, status: true } },
        },
      }),
      prisma.task.count({ where }),
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
    const taskNumber = await nextNumber(tenantId, 'task')
    const task = await prisma.task.create({
      data: {
        tenantId, taskNumber,
        title: parsed.data.title, description: parsed.data.description || null,
        assignedToId: parsed.data.assignedToId || null, priority: parsed.data.priority,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        projectId: parsed.data.projectId || null, milestoneId: parsed.data.milestoneId || null,
        parentTaskId: parsed.data.parentTaskId || null,
        relatedType: parsed.data.relatedType || null, relatedId: parsed.data.relatedId || null,
        isRecurring: parsed.data.isRecurring,
        recurringInterval: parsed.data.recurringInterval as 'MONTHLY' || null,
        createdById: userId, status: 'TODO',
      },
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true } }, project: { select: { id: true, name: true } } },
    })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'task', entityId: task.id, entityName: task.title } })
    logCreate(tenantId, 'task', task.id, task.title, userId)
    return NextResponse.json({ success: true, data: task }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
