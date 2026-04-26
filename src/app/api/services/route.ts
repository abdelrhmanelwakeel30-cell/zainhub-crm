import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { z } from 'zod'
import { getSession, unauthorized, serverError, ok, serializeDecimals, parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId') || ''
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const services = await prisma.service.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(includeInactive ? {} : { isActive: true }),
        ...(categoryId && { categoryId }),
      },
      select: {
        id: true, name: true, nameAr: true, description: true,
        basePrice: true, currency: true, pricingType: true, isActive: true, order: true,
        category: { select: { id: true, name: true, nameAr: true } },
      },
      orderBy: [{ category: { name: 'asc' } }, { order: 'asc' }, { name: 'asc' }],
    })

    return ok(serializeDecimals(services))
  } catch (err) {
    return serverError(err)
  }
}

const CreateServiceSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(255),
  nameAr: z.string().max(255).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  basePrice: z.number().nonnegative().optional().nullable(),
  currency: z.enum(['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR']).optional(),
  pricingType: z.enum(['FIXED', 'HOURLY', 'MONTHLY', 'PROJECT_BASED', 'CUSTOM']).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
})

export async function POST(req: NextRequest) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('settings:create')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const parsed = await parseJson(req, CreateServiceSchema)
    if (parsed instanceof NextResponse) return parsed

    const tenantId = session.user.tenantId
    // verify the category belongs to this tenant
    const category = await prisma.serviceCategory.findFirst({
      where: { id: parsed.data.categoryId, tenantId },
      select: { id: true },
    })
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 },
      )
    }

    const service = await prisma.service.create({
      data: {
        tenantId,
        ...parsed.data,
      },
      include: { category: { select: { id: true, name: true, nameAr: true } } },
    })

    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'service',
      entityId: service.id,
      entityName: service.name,
      sourceModule: 'services',
      req,
    })

    return NextResponse.json(
      { success: true, data: serializeDecimals(service) },
      { status: 201 },
    )
  } catch (err) {
    return serverError(err)
  }
}
