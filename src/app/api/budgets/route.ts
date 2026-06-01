import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({ ...paginationQuery, costCenterId: z.string().optional().default('') })
const createSchema = z.object({
  costCenterId: z.string().min(1),
  periodLabel: z.string().min(1).max(20),
  amount: z.number().positive(),
  currency: z.enum(['AED', 'USD', 'EUR', 'GBP', 'SAR']).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (q.data.costCenterId) where.costCenterId = q.data.costCenterId
  try {
    const [data, total] = await Promise.all([
      prisma.budget.findMany({ where, include: { costCenter: { select: { id: true, code: true, name: true } } }, orderBy: { periodLabel: 'desc' }, skip: (q.data.page - 1) * q.data.pageSize, take: q.data.pageSize }),
      prisma.budget.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page: q.data.page, pageSize: q.data.pageSize, totalPages: Math.ceil(total / q.data.pageSize) })
  } catch (err) {
    log.error('GET /api/budgets', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('budgeting:create')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data
    const cc = await prisma.costCenter.findFirst({ where: { id: d.costCenterId, tenantId }, select: { id: true } })
    if (!cc) return NextResponse.json({ success: false, error: 'Invalid cost center' }, { status: 422 })
    const dup = await prisma.budget.findFirst({ where: { tenantId, costCenterId: d.costCenterId, periodLabel: d.periodLabel }, select: { id: true } })
    if (dup) return NextResponse.json({ success: false, error: `Budget for ${d.periodLabel} already exists for this cost center` }, { status: 409 })
    const budget = await prisma.budget.create({ data: { tenantId, costCenterId: d.costCenterId, periodLabel: d.periodLabel, amount: d.amount, currency: d.currency ?? 'AED' } })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'budget', entityId: budget.id, entityName: `${d.periodLabel} (${d.amount})` } })
    return NextResponse.json({ success: true, data: budget }, { status: 201 })
  } catch (err) {
    log.error('POST /api/budgets', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

const spendSchema = z.object({ id: z.string().min(1), spend: z.number() })

/** Record spend against a budget (delta added to `spent`). */
export async function PATCH(req: NextRequest) {
  const guard = await requireApiPermission('budgeting:edit')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user
  try {
    const body = await req.json()
    const parsed = spendSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const budget = await prisma.budget.findFirst({ where: { id: parsed.data.id, tenantId } })
    if (!budget) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const newSpent = Number(budget.spent) + parsed.data.spend
    if (newSpent < 0) return NextResponse.json({ success: false, error: 'Spend cannot make total negative' }, { status: 422 })
    const updated = await prisma.budget.update({ where: { id: budget.id }, data: { spent: newSpent } })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'UPDATE', entityType: 'budget', entityId: budget.id, entityName: `spend ${parsed.data.spend} → ${newSpent}` } })
    return NextResponse.json({ success: true, data: updated, remaining: Number(updated.amount) - newSpent })
  } catch (err) {
    log.error('PATCH /api/budgets', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
