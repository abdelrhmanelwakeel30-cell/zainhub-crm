import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  companyId: z.string().min(1),
  projectId: z.string().optional(),
  templateId: z.string().optional(),
  items: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    isRequired: z.boolean().optional().default(true),
    order: z.number().optional().default(0),
  })).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const companyId = searchParams.get('companyId') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = { tenantId: session.user.tenantId }
    if (companyId) where.companyId = companyId
    if (status) where.status = status

    const [data, total] = await Promise.all([
      prisma.clientOnboarding.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, displayName: true } },
          project: { select: { id: true, name: true } },
          template: { select: { id: true, name: true } },
          items: {
            orderBy: { order: 'asc' },
            include: {
              completedBy: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.clientOnboarding.count({ where }),
    ])

    return paginatedOk(data, total, page, pageSize)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('onboarding:create')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    }

    const { tenantId } = session.user
    const { companyId, projectId, templateId, items } = parsed.data

    // Verify company belongs to tenant
    const company = await prisma.company.findFirst({ where: { id: companyId, tenantId } })
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
    }

    // If templateId provided, load template items
    let resolvedItems = items ?? []
    if (templateId && resolvedItems.length === 0) {
      const template = await prisma.onboardingTemplate.findFirst({
        where: { id: templateId, tenantId },
      })
      if (template?.items) {
        const templateItems = template.items as Array<{ title: string; description?: string; order?: number }>
        resolvedItems = templateItems.map((ti, idx) => ({
          title: ti.title,
          description: ti.description,
          isRequired: true,
          order: ti.order ?? idx,
        }))
      }
    }

    const onboarding = await prisma.clientOnboarding.create({
      data: {
        tenantId,
        companyId,
        projectId: projectId || null,
        templateId: templateId || null,
        status: 'IN_PROGRESS',
        items: {
          create: resolvedItems.map(item => ({
            title: item.title,
            description: item.description || null,
            isRequired: item.isRequired ?? true,
            order: item.order ?? 0,
          })),
        },
      },
      include: {
        company: { select: { id: true, displayName: true } },
        project: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
        items: { orderBy: { order: 'asc' } },
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'clientOnboarding',
        entityId: onboarding.id,
        entityName: `Onboarding - ${company.displayName}`,
      },
    })

    return NextResponse.json({ success: true, data: onboarding }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
