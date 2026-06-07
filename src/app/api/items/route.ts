import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({ ...paginationQuery, search: z.string().optional().default('') })

const createSchema = z.object({
  sku: z.string().min(1).max(40),
  name: z.string().min(1).max(160),
  quantity: z.number().nonnegative().default(0),
  unitCost: z.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { page, pageSize, search } = q.data

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (search) where.OR = [{ sku: { contains: search, mode: 'insensitive' as const } }, { name: { contains: search, mode: 'insensitive' as const } }]

  try {
    const [data, total] = await Promise.all([
      prisma.item.findMany({ where, orderBy: { sku: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.item.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/items', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('inventory:create')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data

    const dup = await prisma.item.findFirst({ where: { tenantId, sku: d.sku }, select: { id: true } })
    if (dup) return NextResponse.json({ success: false, error: `SKU ${d.sku} already exists` }, { status: 409 })

    const item = await prisma.item.create({
      data: { tenantId, sku: d.sku, name: d.name, quantity: d.quantity, unitCost: d.unitCost, isActive: d.isActive },
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'item', entityId: item.id, entityName: `${item.sku} ${item.name}` },
    })
    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (err) {
    log.error('POST /api/items', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
