import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const

const listQuery = z.object({
  ...paginationQuery,
  search: z.string().optional().default(''),
  type: z.enum(ACCOUNT_TYPES).optional(),
})

const createSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  type: z.enum(ACCOUNT_TYPES),
  isActive: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { page, pageSize, search, type } = q.data

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (type) where.type = type
  if (search)
    where.OR = [
      { code: { contains: search, mode: 'insensitive' as const } },
      { name: { contains: search, mode: 'insensitive' as const } },
    ]

  try {
    const [data, total] = await Promise.all([
      prisma.account.findMany({ where, orderBy: { code: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.account.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/accounts', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('accounting:create')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data

    const dup = await prisma.account.findFirst({ where: { tenantId, code: d.code }, select: { id: true } })
    if (dup) return NextResponse.json({ success: false, error: `Account code ${d.code} already exists` }, { status: 409 })

    const account = await prisma.account.create({
      data: { tenantId, code: d.code, name: d.name, type: d.type, isActive: d.isActive },
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'account', entityId: account.id, entityName: `${account.code} ${account.name}` },
    })
    return NextResponse.json({ success: true, data: account }, { status: 201 })
  } catch (err) {
    log.error('POST /api/accounts', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
