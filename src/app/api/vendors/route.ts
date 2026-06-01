import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({ ...paginationQuery, search: z.string().optional().default('') })

const createSchema = z.object({
  name: z.string().min(1).max(160),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { page, pageSize, search } = q.data

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }]

  try {
    const [data, total] = await Promise.all([
      prisma.vendor.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.vendor.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/vendors', { err })
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

    const vendor = await prisma.vendor.create({
      data: { tenantId, name: d.name, email: d.email || null, phone: d.phone || null, isActive: d.isActive },
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'vendor', entityId: vendor.id, entityName: vendor.name },
    })
    return NextResponse.json({ success: true, data: vendor }, { status: 201 })
  } catch (err) {
    log.error('POST /api/vendors', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
