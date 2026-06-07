import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// billing.ts is pure config/gating logic but is server-only; no prisma import.
vi.mock('server-only', () => ({}))

describe('billing gating', () => {
  const original = process.env.STRIPE_SECRET_KEY
  beforeEach(() => { delete process.env.STRIPE_SECRET_KEY })
  afterEach(() => { if (original) process.env.STRIPE_SECRET_KEY = original; else delete process.env.STRIPE_SECRET_KEY })

  it('reports unconfigured + null stripe when no key is set', async () => {
    const { billingConfigured, getStripe, createCheckoutSession, constructWebhookEvent } = await import('@/lib/billing')
    expect(billingConfigured()).toBe(false)
    expect(await getStripe()).toBeNull()
    expect(await createCheckoutSession({ tenantId: 't', plan: 'PROFESSIONAL', successUrl: 'a', cancelUrl: 'b' })).toBeNull()
    expect(await constructWebhookEvent('{}', 'sig')).toBeNull()
  })

  it('reports configured when a key is present', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
    vi.resetModules()
    const { billingConfigured } = await import('@/lib/billing')
    expect(billingConfigured()).toBe(true)
  })
})
