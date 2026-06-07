import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({
  ...paginationQuery,
  itemId: z.string().optional().default(''),
  type: z.enum(['IN', 'OUT', 'ADJUST']).optional(),
})

const createSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  quantity: z.number().nonnegative(),
  note: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { page, pageSize, itemId, type } = q.data

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (itemId) where.itemId = itemId
  if (type) where.type = type

  try {
    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { item: { select: { id: true, sku: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.stockMovement.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/stock-movements', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('inventory:edit')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data

    const item = await prisma.item.findFirst({ where: { id: d.itemId, tenantId }, select: { id: true, quantity: true, sku: true } })
    if (!item) return NextResponse.json({ success: false, error: 'Invalid item' }, { status: 422 })

    const current = Number(item.quantity)
    const qty = d.quantity
    const newQty = d.type === 'IN' ? current + qty : d.type === 'OUT' ? current - qty : qty
    if (newQty < 0) {
      return NextResponse.json({ success: false, error: `Insufficient stock: ${item.sku} has ${current}, cannot remove ${qty}` }, { status: 409 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: { tenantId, itemId: d.itemId, type: d.type, quantity: qty, note: d.note || null },
      })
      const updated = await tx.item.update({ where: { id: d.itemId }, data: { quantity: newQty } })
      return { movement, quantity: Number(updated.quantity) }
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'UPDATE', entityType: 'stock_movement', entityId: result.movement.id, entityName: `${item.sku} ${d.type} ${qty} → ${result.quantity}` },
    })
    return NextResponse.json({ success: true, data: result.movement, quantity: result.quantity }, { status: 201 })
  } catch (err) {
    log.error('POST /api/stock-movements', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
