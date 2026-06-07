import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({
  ...paginationQuery,
  search: z.string().optional().default(''),
  department: z.string().optional().default(''),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  archived: z.enum(['true', 'false']).optional(),
})

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).default('FULL_TIME'),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']).default('ACTIVE'),
  hireDate: z.string().optional(),
  managerId: z.string().optional(),
  userId: z.string().optional(),
  salary: z.number().nonnegative().optional(),
  currency: z.enum(['AED', 'USD', 'EUR', 'GBP', 'SAR']).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { page, pageSize, search, department, status, archived } = q.data

  const where: Record<string, unknown> = {
    tenantId: session.user.tenantId,
    archivedAt: archived === 'true' ? { not: null } : null,
  }
  if (search)
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' as const } },
      { lastName: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { employeeNumber: { contains: search, mode: 'insensitive' as const } },
    ]
  if (department) where.department = department
  if (status) where.status = status

  try {
    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: { manager: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.employee.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/employees', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('employees:create')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data

    if (d.managerId) {
      const mgr = await prisma.employee.findFirst({ where: { id: d.managerId, tenantId }, select: { id: true } })
      if (!mgr) return NextResponse.json({ success: false, error: 'Invalid manager' }, { status: 422 })
    }

    const employeeNumber = await nextNumber(tenantId, 'employee', { prefix: 'EMP' })
    const employee = await prisma.employee.create({
      data: {
        tenantId,
        employeeNumber,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email || null,
        phone: d.phone || null,
        jobTitle: d.jobTitle || null,
        department: d.department || null,
        employmentType: d.employmentType,
        status: d.status,
        hireDate: d.hireDate ? new Date(d.hireDate) : null,
        managerId: d.managerId || null,
        userId: d.userId || null,
        salary: d.salary ?? null,
        currency: d.currency ?? 'AED',
      },
    })

    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'employee', entityId: employee.id, entityName: `${employee.firstName} ${employee.lastName}` },
    })

    return NextResponse.json({ success: true, data: employee }, { status: 201 })
  } catch (err) {
    log.error('POST /api/employees', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
