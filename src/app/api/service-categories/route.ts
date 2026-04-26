import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, ok, parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { cached } from '@/lib/cache'

const getServiceCategories = cached(
  async (tenantId: string, includeInactive: boolean, withCounts: boolean) => {
    return prisma.serviceCategory.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        description: true,
        icon: true,
        order: true,
        isActive: true,
        ...(withCounts && { _count: { select: { services: true } } }),
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      take: 200, // P-001
    })
  },
  ['service-categories'],
  { revalidate: 300, tags: ['lookup-service-categories'] },
)

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const withCounts = searchParams.get('withCounts') === 'true'

    const categories = await getServiceCategories(session.user.tenantId, includeInactive, withCounts)

    return ok(categories)
  } catch (err) {
    return serverError(err)
  }
}

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(255),
  nameAr: z.string().max(255).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const parsed = await parseJson(req, CreateCategorySchema)
    if (parsed instanceof NextResponse) return parsed

    const tenantId = session.user.tenantId

    const category = await prisma.serviceCategory.create({
      data: { tenantId, ...parsed.data },
    })

    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'serviceCategory',
      entityId: category.id,
      entityName: category.name,
      sourceModule: 'services',
      req,
    })

    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
