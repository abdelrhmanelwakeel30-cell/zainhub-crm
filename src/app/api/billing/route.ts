import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { billingConfigured } from '@/lib/billing'
import { log } from '@/lib/logger'

/** Current billing status for the tenant + whether Stripe is configured. */
export async function GET() {
  const guard = await requireApiPermission('settings:view')
  if (!guard.ok) return guard.response
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: guard.session.user.tenantId },
      select: { plan: true, subscriptionStatus: true, stripeCustomerId: true },
    })
    return NextResponse.json({
      success: true,
      data: {
        plan: tenant?.plan ?? 'PROFESSIONAL',
        subscriptionStatus: tenant?.subscriptionStatus ?? null,
        hasCustomer: !!tenant?.stripeCustomerId,
        configured: billingConfigured(),
      },
    })
  } catch (err) {
    log.error('GET /api/billing', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
