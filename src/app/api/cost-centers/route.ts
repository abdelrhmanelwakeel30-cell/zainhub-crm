import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({ ...paginationQuery, search: z.string().optional().default('') })
const createSchema = z.object({ code: z.string().min(1).max(30), name: z.string().min(1).max(120), isActive: z.boolean().default(true) })

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (q.data.search) where.OR = [{ code: { contains: q.data.search, mode: 'insensitive' as const } }, { name: { contains: q.data.search, mode: 'insensitive' as const } }]
  try {
    const [data, total] = await Promise.all([
      prisma.costCenter.findMany({ where, orderBy: { code: 'asc' }, skip: (q.data.page - 1) * q.data.pageSize, take: q.data.pageSize }),
      prisma.costCenter.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page: q.data.page, pageSize: q.data.pageSize, totalPages: Math.ceil(total / q.data.pageSize) })
  } catch (err) {
    log.error('GET /api/cost-centers', { err })
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
    const dup = await prisma.costCenter.findFirst({ where: { tenantId, code: parsed.data.code }, select: { id: true } })
    if (dup) return NextResponse.json({ success: false, error: `Cost center ${parsed.data.code} already exists` }, { status: 409 })
    const cc = await prisma.costCenter.create({ data: { tenantId, ...parsed.data } })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'cost_center', entityId: cc.id, entityName: `${cc.code} ${cc.name}` } })
    return NextResponse.json({ success: true, data: cc }, { status: 201 })
  } catch (err) {
    log.error('POST /api/cost-centers', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
