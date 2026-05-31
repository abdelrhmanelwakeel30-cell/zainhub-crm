import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({
  ...paginationQuery,
  status: z.enum(['DRAFT', 'PROCESSED', 'PAID']).optional(),
})

const createSchema = z
  .object({
    periodStart: z.string().min(1),
    periodEnd: z.string().min(1),
    currency: z.enum(['AED', 'USD', 'EUR', 'GBP', 'SAR']).optional(),
  })
  .refine((d) => new Date(d.periodEnd) >= new Date(d.periodStart), { message: 'periodEnd must be on/after periodStart', path: ['periodEnd'] })

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { page, pageSize, status } = q.data

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (status) where.status = status

  try {
    const [data, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        include: { _count: { select: { payslips: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payrollRun.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/payroll-runs', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('payroll:create')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data

    const runNumber = await nextNumber(tenantId, 'payroll', { prefix: 'PRN' })
    const run = await prisma.payrollRun.create({
      data: {
        tenantId,
        runNumber,
        periodStart: new Date(d.periodStart),
        periodEnd: new Date(d.periodEnd),
        status: 'DRAFT',
        currency: d.currency ?? 'AED',
      },
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'payroll', entityId: run.id, entityName: run.runNumber },
    })
    return NextResponse.json({ success: true, data: run }, { status: 201 })
  } catch (err) {
    log.error('POST /api/payroll-runs', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
