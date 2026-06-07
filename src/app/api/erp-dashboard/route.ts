import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

/**
 * Executive ERP dashboard (E-7). Aggregates cross-module CRM + ERP metrics for
 * one tenant. Gated by reports:view.
 */
export async function GET() {
  const guard = await requireApiPermission('reports:view')
  if (!guard.ok) return guard.response
  const { tenantId } = guard.session.user

  try {
    const [
      headcount,
      payrollAgg,
      unpaidInvoices,
      apAgg,
      items,
      budgetAgg,
      leads,
      openOpps,
      journalEntries,
      vendors,
    ] = await Promise.all([
      prisma.employee.count({ where: { tenantId, status: 'ACTIVE', archivedAt: null } }),
      prisma.payrollRun.aggregate({ where: { tenantId, status: { in: ['PROCESSED', 'PAID'] } }, _sum: { totalNet: true } }),
      prisma.invoice.findMany({ where: { tenantId, status: { in: ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE'] } }, select: { totalAmount: true, amountPaid: true } }),
      prisma.purchaseOrder.aggregate({ where: { tenantId, status: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] } }, _sum: { totalAmount: true } }),
      prisma.item.findMany({ where: { tenantId }, select: { quantity: true, unitCost: true } }),
      prisma.budget.aggregate({ where: { tenantId }, _sum: { amount: true, spent: true } }),
      prisma.lead.count({ where: { tenantId, archivedAt: null } }),
      prisma.opportunity.count({ where: { tenantId, OR: [{ stage: { isClosed: false } }, { stageId: null }] } }),
      prisma.journalEntry.count({ where: { tenantId } }),
      prisma.vendor.count({ where: { tenantId } }),
    ])

    const accountsReceivable = unpaidInvoices.reduce((s, i) => s + (Number(i.totalAmount) - Number(i.amountPaid)), 0)
    const inventoryValue = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitCost), 0)
    const budgetTotal = Number(budgetAgg._sum.amount ?? 0)
    const budgetSpent = Number(budgetAgg._sum.spent ?? 0)

    return NextResponse.json({
      success: true,
      data: {
        headcount,
        payrollTotal: Number(payrollAgg._sum.totalNet ?? 0),
        accountsReceivable: Math.round(accountsReceivable * 100) / 100,
        accountsPayable: Number(apAgg._sum.totalAmount ?? 0),
        inventoryValue: Math.round(inventoryValue * 100) / 100,
        budget: {
          total: budgetTotal,
          spent: budgetSpent,
          utilizationPct: budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : 0,
        },
        counts: { leads, openOpportunities: openOpps, journalEntries, vendors },
      },
    })
  } catch (err) {
    log.error('GET /api/erp-dashboard', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
