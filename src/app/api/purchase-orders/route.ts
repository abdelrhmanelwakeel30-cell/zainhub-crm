import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({
  ...paginationQuery,
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'RECEIVED']).optional(),
  vendorId: z.string().optional().default(''),
})

const lineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
})

const createSchema = z.object({
  vendorId: z.string().min(1),
  currency: z.enum(['AED', 'USD', 'EUR', 'GBP', 'SAR']).optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1),
})

const round2 = (n: number) => Math.round(n * 100) / 100

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { page, pageSize, status, vendorId } = q.data

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (status) where.status = status
  if (vendorId) where.vendorId = vendorId

  try {
    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { vendor: { select: { id: true, name: true } }, _count: { select: { lines: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.purchaseOrder.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/purchase-orders', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('procurement:create')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data

    const vendor = await prisma.vendor.findFirst({ where: { id: d.vendorId, tenantId }, select: { id: true } })
    if (!vendor) return NextResponse.json({ success: false, error: 'Invalid vendor' }, { status: 422 })

    const lines = d.lines.map((l) => ({ ...l, lineTotal: round2(l.quantity * l.unitPrice) }))
    const totalAmount = round2(lines.reduce((s, l) => s + l.lineTotal, 0))

    const poNumber = await nextNumber(tenantId, 'purchase_order', { prefix: 'PO' })
    const po = await prisma.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: { tenantId, poNumber, vendorId: d.vendorId, status: 'DRAFT', currency: d.currency ?? 'AED', totalAmount, notes: d.notes || null },
      })
      await tx.pOLine.createMany({
        data: lines.map((l) => ({ tenantId, purchaseOrderId: created.id, description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.lineTotal })),
      })
      return created
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'purchase_order', entityId: po.id, entityName: `${po.poNumber} (${totalAmount})` },
    })
    return NextResponse.json({ success: true, data: po, totalAmount }, { status: 201 })
  } catch (err) {
    log.error('POST /api/purchase-orders', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
