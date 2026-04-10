import { NextRequest } from 'next/server'
import { getSession, unauthorized, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const tenantId = session.user.tenantId
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const [
      totalLeads,
      newLeadsThisMonth,
      totalCompanies,
      totalContacts,
      openOpportunities,
      totalOpportunityValue,
      activeProjects,
      overdueTasks,
      openTickets,
      monthlyRevenue,
      lastMonthRevenue,
      paidInvoicesThisMonth,
      overdueInvoices,
      recentActivities,
      pipelineData,
      leadsBySource,
      revenueByMonth,
      unreadNotifications,
    ] = await Promise.all([
      prisma.lead.count({ where: { tenantId, archivedAt: null } }),
      prisma.lead.count({ where: { tenantId, createdAt: { gte: startOfMonth }, archivedAt: null } }),
      prisma.company.count({ where: { tenantId, archivedAt: null } }),
      prisma.contact.count({ where: { tenantId, archivedAt: null } }),
      prisma.opportunity.count({ where: { tenantId, wonAt: null, lostAt: null, archivedAt: null } }),
      prisma.opportunity.aggregate({ where: { tenantId, wonAt: null, lostAt: null, archivedAt: null }, _sum: { weightedValue: true } }),
      prisma.project.count({ where: { tenantId, status: { in: ['IN_PROGRESS', 'NOT_STARTED'] }, archivedAt: null } }),
      prisma.task.count({ where: { tenantId, status: { in: ['TODO', 'IN_PROGRESS'] }, dueDate: { lt: now } } }),
      prisma.ticket.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] } } }),
      // This month's paid invoices total
      prisma.invoice.aggregate({
        where: { tenantId, status: 'PAID', updatedAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      // Last month's paid invoices
      prisma.invoice.aggregate({
        where: { tenantId, status: 'PAID', updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.count({ where: { tenantId, status: 'PAID', updatedAt: { gte: startOfMonth } } }),
      prisma.invoice.count({ where: { tenantId, status: { in: ['SENT', 'PARTIALLY_PAID'] }, dueDate: { lt: now } } }),
      prisma.activity.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { performedBy: { select: { firstName: true, lastName: true, avatar: true } } },
      }),
      // Pipeline stage distribution
      prisma.pipelineStage.findMany({
        where: { pipeline: { tenantId, entityType: 'OPPORTUNITY' } },
        include: {
          _count: { select: { opportunities: { where: { archivedAt: null } } } },
        },
        orderBy: { order: 'asc' },
      }),
      // Leads by source
      prisma.lead.groupBy({
        by: ['sourceId'],
        where: { tenantId, archivedAt: null },
        _count: { id: true },
      }),
      // Monthly revenue for last 6 months (from payments)
      prisma.$queryRaw<Array<{ month: string; total: number }>>`
        SELECT strftime('%Y-%m', createdAt) as month, SUM(CAST(amount as REAL)) as total
        FROM Payment
        WHERE tenantId = ${tenantId}
          AND createdAt >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', createdAt)
        ORDER BY month ASC
      `,
      prisma.notification.count({ where: { tenantId, userId: session.user.id, isRead: false } }),
    ])

    const revenueGrowth = lastMonthRevenue._sum.totalAmount
      ? (((Number(monthlyRevenue._sum.totalAmount ?? 0) - Number(lastMonthRevenue._sum.totalAmount)) / Number(lastMonthRevenue._sum.totalAmount)) * 100).toFixed(1)
      : null

    return ok({
      kpis: {
        totalLeads,
        newLeadsThisMonth,
        totalCompanies,
        totalContacts,
        openOpportunities,
        pipelineValue: Number(totalOpportunityValue._sum?.weightedValue ?? 0),
        activeProjects,
        overdueTasks,
        openTickets,
        monthlyRevenue: Number(monthlyRevenue._sum.totalAmount ?? 0),
        revenueGrowth,
        paidInvoicesThisMonth,
        overdueInvoices,
        unreadNotifications,
      },
      charts: {
        pipeline: pipelineData.map((s) => ({
          id: s.id,
          name: s.name,
          count: (s._count as Record<string, number>).opportunities ?? 0,
          color: s.color,
        })),
        leadsBySource,
        revenueByMonth,
      },
      recentActivities,
    })
  } catch (err) {
    return serverError(err)
  }
}
