import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().default('AED'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const isActive = searchParams.get('isActive')
  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (isActive !== null) where.isActive = isActive === 'true'

  try {
    const [data, total] = await Promise.all([
      prisma.serviceBundle.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              service: { select: { id: true, name: true, category: true } },
              package: { select: { id: true, name: true, price: true } },
            },
          },
        },
      }),
      prisma.serviceBundle.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const { tenantId, id: userId } = session.user
    const bundle = await prisma.serviceBundle.create({
      data: {
        tenantId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        category: parsed.data.category || null,
        price: parsed.data.price ?? null,
        currency: parsed.data.currency as 'AED',
        isActive: parsed.data.isActive,
        sortOrder: parsed.data.sortOrder,
      },
      include: { items: true },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'CREATE',
        entityType: 'serviceBundle',
        entityId: bundle.id,
        entityName: bundle.name,
      },
    })

    return NextResponse.json({ success: true, data: bundle }, { status: 201 })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
