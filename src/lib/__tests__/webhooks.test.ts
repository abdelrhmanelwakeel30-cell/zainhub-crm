import { describe, it, expect, vi } from 'vitest'
import { createHmac } from 'node:crypto'

// webhooks.ts imports prisma (which needs DATABASE_URL); we only test pure helpers.
vi.mock('@/lib/prisma', () => ({ prisma: {} }))

const { signPayload, newWebhookSecret, WEBHOOK_EVENTS } = await import('@/lib/webhooks')

describe('webhooks signPayload', () => {
  it('produces a stable HMAC-SHA256 hex matching node crypto', () => {
    const secret = 'whsec_test'
    const body = JSON.stringify({ event: 'lead.created', data: { id: 'x' } })
    const expected = createHmac('sha256', secret).update(body).digest('hex')
    expect(signPayload(secret, body)).toBe(expected)
  })

  it('changes when the body changes', () => {
    const s = 'k'
    expect(signPayload(s, 'a')).not.toBe(signPayload(s, 'b'))
  })

  it('mints prefixed secrets and exposes known events', () => {
    expect(newWebhookSecret().startsWith('whsec_')).toBe(true)
    expect(WEBHOOK_EVENTS).toContain('lead.created')
  })
})
