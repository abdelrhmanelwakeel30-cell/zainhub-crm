import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { billingConfigured, constructWebhookEvent } from '@/lib/billing'
import { log } from '@/lib/logger'

/**
 * Stripe webhook receiver (public — added to middleware allowlist). Verifies the
 * signature when STRIPE_WEBHOOK_SECRET is set and syncs tenant subscription
 * state. When billing is not configured it returns a 200 no-op.
 */
export async function POST(req: NextRequest) {
  if (!billingConfigured()) {
    return NextResponse.json({ received: true, configured: false })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  const event = await constructWebhookEvent(body, signature)
  if (!event) {
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 })
  }

  try {
    const obj = event.data.object as Record<string, unknown>
    const metadata = (obj.metadata as Record<string, string> | undefined) ?? {}
    const tenantId = metadata.tenantId || (obj.client_reference_id as string | undefined)
    const customerId = obj.customer as string | undefined
    const subscriptionId = obj.subscription as string | undefined

    switch (event.type) {
      case 'checkout.session.completed': {
        if (tenantId) {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              stripeCustomerId: customerId ?? undefined,
              stripeSubscriptionId: subscriptionId ?? undefined,
              subscriptionStatus: 'active',
              plan: metadata.plan || undefined,
            },
          })
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const status = (obj.status as string | undefined) ?? (event.type.endsWith('deleted') ? 'canceled' : undefined)
        // Resolve tenant by customer id (subscription events lack our metadata).
        if (customerId) {
          await prisma.tenant.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: status, stripeSubscriptionId: (obj.id as string) ?? undefined },
          })
        }
        break
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    log.error('POST /api/billing/webhook', { err, type: event.type })
    return NextResponse.json({ success: false, error: 'Webhook handler error' }, { status: 500 })
  }
}
