import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({
  ...paginationQuery,
  payrollRunId: z.string().optional().default(''),
  employeeId: z.string().optional().default(''),
  status: z.enum(['PENDING', 'PAID']).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { page, pageSize, payrollRunId, employeeId, status } = q.data

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (payrollRunId) where.payrollRunId = payrollRunId
  if (employeeId) where.employeeId = employeeId
  if (status) where.status = status

  try {
    const [data, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
          payrollRun: { select: { id: true, runNumber: true, periodStart: true, periodEnd: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payslip.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/payslips', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
