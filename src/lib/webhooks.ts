import 'server-only'
import { createHmac, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

/**
 * Outbound webhooks (S-6). Tenants register endpoints subscribed to events
 * (e.g. lead.created, invoice.paid). On an event we POST a signed JSON body;
 * the HMAC-SHA256 signature (hex) goes in X-Signature so receivers can verify.
 */

export const WEBHOOK_EVENTS = ['lead.created', 'invoice.paid', 'purchase_order.approved', 'employee.created'] as const
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

/** Pure, unit-testable: HMAC-SHA256 hex of the exact body string. */
export function signPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

export function newWebhookSecret(): string {
  return 'whsec_' + randomBytes(24).toString('hex')
}

/**
 * Fire-and-forget delivery to all active endpoints subscribed to `event`.
 * Never throws into the caller — failures are logged and recorded as lastStatus.
 */
export async function dispatchWebhook(tenantId: string, event: WebhookEvent, payload: unknown): Promise<void> {
  let endpoints: { id: string; url: string; secret: string }[] = []
  try {
    endpoints = await prisma.webhookEndpoint.findMany({
      where: { tenantId, isActive: true, events: { has: event } },
      select: { id: true, url: true, secret: true },
    })
  } catch (err) {
    log.warn('[webhooks] failed to load endpoints', { err, event })
    return
  }
  if (endpoints.length === 0) return

  const body = JSON.stringify({ event, tenantId, data: payload, sentAt: new Date().toISOString() })

  await Promise.all(
    endpoints.map(async (ep) => {
      try {
        const res = await fetch(ep.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-signature': signPayload(ep.secret, body), 'x-event': event },
          body,
          signal: AbortSignal.timeout(5000),
        })
        await prisma.webhookEndpoint.update({ where: { id: ep.id }, data: { lastStatus: res.status } }).catch(() => {})
      } catch (err) {
        log.warn('[webhooks] delivery failed', { err, url: ep.url, event })
        await prisma.webhookEndpoint.update({ where: { id: ep.id }, data: { lastStatus: 0 } }).catch(() => {})
      }
    }),
  )
}
