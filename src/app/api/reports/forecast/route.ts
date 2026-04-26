import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

import { log } from '@/lib/logger'
function toMonthlyAmount(amount: number, interval: string): number {
  switch (interval) {
    case 'WEEKLY':      return amount * 4.33
    case 'BIWEEKLY':    return amount * 2.17
    case 'MONTHLY':     return amount
    case 'QUARTERLY':   return amount / 3
    case 'SEMI_ANNUAL': return amount / 6
    case 'ANNUAL':      return amount / 12
    default:            return amount
  }
}

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { tenantId } = session.user
    const now = new Date()

    // Build next 3 months
    const months: Array<{
      month: string
      expectedRevenue: number
      subscriptionRevenue: number
      pipelineRevenue: number
    }> = []

    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

      // Subscription revenue: normalize active subs to monthly
      const activeSubs = await prisma.subscription.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { amount: true, interval: true },
      })
      const subscriptionRevenue = activeSubs.reduce((sum, sub) => {
        return sum + toMonthlyAmount(Number(sub.amount), sub.interval)
      }, 0)

      // Pipeline revenue: opportunities closing this month × probability
      const opps = await prisma.opportunity.findMany({
        where: {
          tenantId,
          expectedCloseDate: { gte: monthStart, lte: monthEnd },
          lostAt: null,
          archivedAt: null,
        },
        select: { expectedValue: true, probability: true },
      })
      const pipelineRevenue = opps.reduce((sum, opp) => {
        return sum + (Number(opp.expectedValue || 0) * ((opp.probability || 0) / 100))
      }, 0)

      months.push({
        month: monthStr,
        subscriptionRevenue: Math.round(subscriptionRevenue),
        pipelineRevenue: Math.round(pipelineRevenue),
        expectedRevenue: Math.round(subscriptionRevenue + pipelineRevenue),
      })
    }

    return NextResponse.json({ success: true, data: { months } })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
