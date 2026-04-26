import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { z } from 'zod'
import { getSession, unauthorized, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const records = await prisma.accountHealth.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        company: {
          select: { id: true, displayName: true },
        },
      },
      orderBy: { healthScore: 'asc' },
    })

    return ok(records)
  } catch (err) {
    return serverError(err)
  }
}

const RecalcSchema = z.object({
  companyId: z.string().min(1),
})

export async function POST(req: NextRequest) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('account_health:create')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = RecalcSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { companyId } = parsed.data
    const tenantId = session.user.tenantId

    // Verify company belongs to this tenant
    const company = await prisma.company.findFirst({
      where: { id: companyId, tenantId },
    })
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
    }

    // Q-001 fix: Invoice/Ticket/Project use `clientId` (FK → Company), not
    // `companyId`. The previous `_prisma as any` cast hid this mismatch.
    // ClientService does use companyId.
    const [activeServices, overdueInvoices, openTickets, delayedProjects] = await Promise.all([
      prisma.clientService.count({
        where: { tenantId, companyId, status: 'ACTIVE' },
      }),
      prisma.invoice.count({
        where: { tenantId, clientId: companyId, status: 'OVERDUE' },
      }),
      prisma.ticket.count({
        where: { tenantId, clientId: companyId, status: { in: ['NEW', 'OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.project.count({
        where: { tenantId, clientId: companyId, healthStatus: { in: ['DELAYED', 'BLOCKED'] } },
      }),
    ])

    // Calculate health score (floor at 0)
    const rawScore =
      100 -
      overdueInvoices * 5 -
      openTickets * 3 -
      delayedProjects * 10
    const healthScore = Math.max(0, rawScore)

    // Determine upsell readiness
    let upsellReadiness: 'HIGH' | 'MEDIUM' | 'LOW'
    if (activeServices > 3 && overdueInvoices === 0) {
      upsellReadiness = 'HIGH'
    } else if (activeServices > 1) {
      upsellReadiness = 'MEDIUM'
    } else {
      upsellReadiness = 'LOW'
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    if (healthScore >= 80) {
      riskLevel = 'LOW'
    } else if (healthScore >= 50) {
      riskLevel = 'MEDIUM'
    } else {
      riskLevel = 'HIGH'
    }

    const record = await prisma.accountHealth.upsert({
      where: { companyId },
      create: {
        tenantId,
        companyId,
        healthScore,
        activeServicesCount: activeServices,
        overdueInvoicesCount: overdueInvoices,
        openTicketsCount: openTickets,
        delayedProjectsCount: delayedProjects,
        upsellReadiness,
        riskLevel,
        lastCalculatedAt: new Date(),
      },
      update: {
        healthScore,
        activeServicesCount: activeServices,
        overdueInvoicesCount: overdueInvoices,
        openTicketsCount: openTickets,
        delayedProjectsCount: delayedProjects,
        upsellReadiness,
        riskLevel,
        lastCalculatedAt: new Date(),
      },
      include: {
        company: { select: { id: true, displayName: true } },
      },
    })

    return ok(record)
  } catch (err) {
    return serverError(err)
  }
}
