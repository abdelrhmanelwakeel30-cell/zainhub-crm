import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { sanitizeUpdateBody } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  unitCost: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const item = await prisma.item.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: { movements: { orderBy: { createdAt: 'desc' }, take: 30 } },
    })
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: item })
  } catch (err) {
    log.error('GET /api/items/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission('inventory:edit')
  if (!guard.ok) return guard.response
  const { id } = await params
  const { tenantId, id: userId } = guard.session.user

  try {
    const existing = await prisma.item.findFirst({ where: { id, tenantId }, select: { id: true } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const item = await prisma.item.update({ where: { id }, data: sanitizeUpdateBody(parsed.data) })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'UPDATE', entityType: 'item', entityId: id, entityName: `${item.sku} ${item.name}` },
    })
    return NextResponse.json({ success: true, data: item })
  } catch (err) {
    log.error('PATCH /api/items/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
