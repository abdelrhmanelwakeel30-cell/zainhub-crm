import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiPermission } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { billingConfigured, createCheckoutSession } from '@/lib/billing'
import { log } from '@/lib/logger'

const schema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('PROFESSIONAL'),
})

/**
 * Start a subscription checkout. When Stripe is unconfigured, returns a safe
 * stub {configured:false} so the UI can render a "billing not configured" state
 * without erroring.
 */
export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('settings:edit')
  if (!guard.ok) return guard.response
  const { tenantId, email } = guard.session.user

  const parsed = await parseJson(req, schema)
  if (parsed instanceof NextResponse) return parsed

  if (!billingConfigured()) {
    return NextResponse.json({ success: true, data: { configured: false } })
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { stripeCustomerId: true },
    })
    const origin = req.nextUrl.origin
    const session = await createCheckoutSession({
      tenantId,
      plan: parsed.data.plan,
      email: email ?? undefined,
      stripeCustomerId: tenant?.stripeCustomerId,
      successUrl: `${origin}/admin/settings?billing=success`,
      cancelUrl: `${origin}/admin/settings?billing=cancelled`,
    })
    if (!session) {
      return NextResponse.json({ success: true, data: { configured: false } })
    }
    return NextResponse.json({ success: true, data: { configured: true, url: session.url } })
  } catch (err) {
    log.error('POST /api/billing/checkout', { err })
    return NextResponse.json({ success: false, error: 'Could not start checkout' }, { status: 500 })
  }
}
