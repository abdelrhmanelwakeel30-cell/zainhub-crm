import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { createWebsiteSchema } from '@/lib/validators/website-analysis'
import { paginatedOk, parsePagination } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''
  // P-001 (CRM-V3-FULL-AUDIT-2026-04-25.md): cap result size; helper enforces max 100.
  const { page, pageSize, skip } = parsePagination(searchParams)

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (status) where.status = status
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' as const } },
    { domain: { contains: search, mode: 'insensitive' as const } },
    { brand: { contains: search, mode: 'insensitive' as const } },
  ]

  try {
    const [websites, total] = await Promise.all([
      prisma.website.findMany({
        where,
        include: {
          ownerUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          integrations: { select: { id: true, provider: true, status: true, lastSyncAt: true } },
          _count: { select: { integrations: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.website.count({ where }),
    ])
    return paginatedOk(websites, total, page, pageSize)
  } catch (err) {
    console.error('GET /api/website-analysis/websites', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('website_analysis:create')
  if (!guard.ok) return guard.response
  const { session } = guard

  try {
    const body = await req.json()
    const parsed = createWebsiteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const data = parsed.data

    const existing = await prisma.website.findUnique({
      where: { tenantId_domain: { tenantId: session.user.tenantId, domain: data.domain } },
    })
    if (existing) return NextResponse.json({ success: false, error: 'Domain already registered for this tenant' }, { status: 409 })

    const website = await prisma.website.create({
      data: {
        tenantId: session.user.tenantId,
        name: data.name,
        domain: data.domain,
        brand: data.brand || null,
        type: data.type,
        primaryMarket: data.primaryMarket || null,
        primaryLanguage: data.primaryLanguage || null,
        notes: data.notes || null,
        ownerUserId: data.ownerUserId || null,
        createdById: session.user.id,
      },
    })

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Website',
      entityId: website.id,
      entityName: website.name,
      afterValue: website as unknown as Record<string, unknown>,
      sourceModule: 'website-analysis',
      req,
    })

    return NextResponse.json({ success: true, data: website }, { status: 201 })
  } catch (err) {
    console.error('POST /api/website-analysis/websites', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
