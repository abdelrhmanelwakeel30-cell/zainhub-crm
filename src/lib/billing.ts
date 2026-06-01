import 'server-only'

/**
 * Stripe billing helpers (S-1), fully gated.
 *
 * `stripe` is loaded lazily via dynamic import and every entry point checks
 * STRIPE_SECRET_KEY first, so the build and runtime never hard-require the
 * package or the key. When unconfigured, `billingConfigured()` is false and the
 * checkout/webhook endpoints degrade to safe no-op stubs.
 */

// Minimal structural type for the slice of the Stripe SDK we use — avoids a
// hard type dependency on the package at compile time.
type StripeLike = {
  checkout: { sessions: { create: (args: Record<string, unknown>) => Promise<{ id: string; url: string | null }> } }
  customers: { create: (args: Record<string, unknown>) => Promise<{ id: string }> }
  webhooks: { constructEvent: (body: string, sig: string, secret: string) => { type: string; data: { object: Record<string, unknown> } } }
}

const PLAN_PRICES: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_PRICE_STARTER,
  PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
}

export function billingConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

let cached: StripeLike | null | undefined

export async function getStripe(): Promise<StripeLike | null> {
  if (!billingConfigured()) return null
  if (cached !== undefined) return cached
  try {
    const mod = await import('stripe')
    const Stripe = (mod.default ?? mod) as unknown as new (key: string, opts?: Record<string, unknown>) => StripeLike
    cached = new Stripe(process.env.STRIPE_SECRET_KEY as string)
  } catch {
    cached = null
  }
  return cached
}

export function priceIdForPlan(plan: string): string | undefined {
  return PLAN_PRICES[plan?.toUpperCase()]
}

/**
 * Create a Stripe Checkout Session for a tenant+plan. Returns null when billing
 * is not configured (caller returns a {configured:false} stub).
 */
export async function createCheckoutSession(opts: {
  tenantId: string
  plan: string
  email?: string
  successUrl: string
  cancelUrl: string
  stripeCustomerId?: string | null
}): Promise<{ url: string | null; id: string } | null> {
  const stripe = await getStripe()
  if (!stripe) return null

  const price = priceIdForPlan(opts.plan)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: price ? [{ price, quantity: 1 }] : undefined,
    customer: opts.stripeCustomerId ?? undefined,
    customer_email: opts.stripeCustomerId ? undefined : opts.email,
    client_reference_id: opts.tenantId,
    metadata: { tenantId: opts.tenantId, plan: opts.plan },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  })
  return { url: session.url, id: session.id }
}

/** Verify a Stripe webhook signature. Returns the parsed event or null. */
export async function constructWebhookEvent(
  body: string,
  signature: string | null,
): Promise<{ type: string; data: { object: Record<string, unknown> } } | null> {
  const stripe = await getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret || !signature) return null
  try {
    return stripe.webhooks.constructEvent(body, signature, secret)
  } catch {
    return null
  }
}
