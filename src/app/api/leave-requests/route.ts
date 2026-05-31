import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({
  ...paginationQuery,
  employeeId: z.string().optional().default(''),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
})

const createSchema = z
  .object({
    employeeId: z.string().min(1),
    type: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER']).default('ANNUAL'),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    days: z.number().positive().max(366),
    reason: z.string().optional(),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), { message: 'endDate must be on/after startDate', path: ['endDate'] })

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { page, pageSize, employeeId, status } = q.data

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (employeeId) where.employeeId = employeeId
  if (status) where.status = status

  try {
    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.leaveRequest.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/leave-requests', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('leave:create')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data

    const employee = await prisma.employee.findFirst({ where: { id: d.employeeId, tenantId }, select: { id: true } })
    if (!employee) return NextResponse.json({ success: false, error: 'Invalid employee' }, { status: 422 })

    const leave = await prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: d.employeeId,
        type: d.type,
        startDate: new Date(d.startDate),
        endDate: new Date(d.endDate),
        days: d.days,
        reason: d.reason || null,
        status: 'PENDING',
      },
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'leave', entityId: leave.id, entityName: `${d.type} leave (${d.days}d)` },
    })
    return NextResponse.json({ success: true, data: leave }, { status: 201 })
  } catch (err) {
    log.error('POST /api/leave-requests', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
