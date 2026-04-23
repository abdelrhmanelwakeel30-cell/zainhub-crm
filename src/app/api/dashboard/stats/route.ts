import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const tenantId = session.user.tenantId
    const now = new Date()

    // Current month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const [
      totalLeads,
      activeOpportunities,
      allOpportunities,
      wonOpportunities,
      monthlyPaidInvoices,
      overdueInvoices,
      activeProjects,
      pendingTasks,
      pipelineAgg,
    ] = await Promise.all([
      // Total active leads
      prisma.lead.count({ where: { tenantId, archivedAt: null, convertedAt: null } }),

      // Active opportunities (not closed)
      prisma.opportunity.count({
        where: {
          tenantId,
          archivedAt: null,
          wonAt: null,
          lostAt: null,
        },
      }),

      // All closed opportunities for conversion rate
      prisma.opportunity.count({
        where: { tenantId, OR: [{ wonAt: { not: null } }, { lostAt: { not: null } }] },
      }),

      // Won opportunities
      prisma.opportunity.count({ where: { tenantId, wonAt: { not: null } } }),

      // Monthly revenue: sum of payments this month
      prisma.payment.aggregate({
        where: {
          tenantId,
          paymentDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),

      // Overdue invoices
      prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),

      // Active projects
      prisma.project.count({
        where: { tenantId, archivedAt: null, status: { in: ['IN_PROGRESS', 'REVIEW'] } },
      }),

      // Pending tasks
      prisma.task.count({
        where: { tenantId, status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'] } },
      }),

      // Pipeline value
      prisma.opportunity.aggregate({
        where: { tenantId, archivedAt: null, wonAt: null, lostAt: null },
        _sum: { expectedValue: true },
      }),
    ])

    const conversionRate = allOpportunities > 0 ? (wonOpportunities / allOpportunities) * 100 : 0
    const monthlyRevenue = Number(monthlyPaidInvoices._sum.amount || 0)
    const pipelineValue = Number(pipelineAgg._sum.expectedValue || 0)

    // Revenue by month (last 6 months) — single grouped query instead of 6 sequential aggregates.
    // Saves ~300-600ms TTFB on the dashboard.
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const monthlyAggs = await prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
      SELECT
        to_char("paymentDate", 'YYYY-MM') AS month,
        COALESCE(SUM(amount), 0)::float AS revenue
      FROM "Payment"
      WHERE "tenantId" = ${tenantId}
        AND "paymentDate" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `
    const revenueMap = Object.fromEntries(monthlyAggs.map((r) => [r.month, Number(r.revenue)]))
    const revenueByMonth: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth.push({ month: key, revenue: revenueMap[key] ?? 0 })
    }

    // Leads by source
    const leadsBySourceRaw = await prisma.lead.groupBy({
      by: ['sourceId'],
      where: { tenantId, archivedAt: null },
      _count: { _all: true },
    })

    const sourceIds = leadsBySourceRaw
      .map((r) => r.sourceId)
      .filter((id): id is string => !!id)

    const sources = sourceIds.length > 0
      ? await prisma.leadSource.findMany({ where: { id: { in: sourceIds } }, select: { id: true, name: true } })
      : []
    const sourceMap = Object.fromEntries(sources.map((s) => [s.id, s.name]))

    const leadsBySource = leadsBySourceRaw.map((r) => ({
      source: r.sourceId ? sourceMap[r.sourceId] || 'Unknown' : 'Direct',
      count: r._count._all,
    }))

    // Pipeline by stage
    const pipelineByStageRaw = await prisma.opportunity.groupBy({
      by: ['stageId'],
      where: { tenantId, archivedAt: null, wonAt: null, lostAt: null },
      _count: { _all: true },
      _sum: { expectedValue: true },
    })

    const stageIds = pipelineByStageRaw
      .map((r) => r.stageId)
      .filter((id): id is string => !!id)

    const stages = stageIds.length > 0
      ? await prisma.pipelineStage.findMany({ where: { id: { in: stageIds } }, select: { id: true, name: true, color: true } })
      : []
    const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]))

    const pipelineByStage = pipelineByStageRaw.map((r) => ({
      stage: r.stageId ? stageMap[r.stageId]?.name || 'Unknown' : 'No Stage',
      color: r.stageId ? stageMap[r.stageId]?.color || '#3B82F6' : '#3B82F6',
      count: r._count._all,
      value: Number(r._sum.expectedValue || 0),
    }))

    return ok(serializeDecimals({
      totalLeads,
      activeOpportunities,
      pipelineValue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      monthlyRevenue,
      overdueInvoices,
      activeProjects,
      pendingTasks,
      revenueByMonth,
      leadsBySource,
      pipelineByStage,
    }))
  } catch (err) {
    return serverError(err)
  }
}
