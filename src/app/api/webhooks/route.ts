import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { withApi } from '@/lib/api-route'
import { newWebhookSecret, WEBHOOK_EVENTS } from '@/lib/webhooks'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
})
type CreateBody = z.infer<typeof createSchema>

export async function GET() {
  const guard = await requireApiPermission('settings:view')
  if (!guard.ok) return guard.response
  try {
    const data = await prisma.webhookEndpoint.findMany({
      where: { tenantId: guard.session.user.tenantId },
      select: { id: true, url: true, events: true, isActive: true, lastStatus: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data, availableEvents: WEBHOOK_EVENTS })
  } catch (err) {
    log.error('GET /api/webhooks', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// F-4: refactored to the shared route factory.
export const POST = withApi<CreateBody>(
  async ({ tenantId, userId, body }) => {
    const secret = newWebhookSecret()
    const created = await prisma.webhookEndpoint.create({
      data: { tenantId, url: body.url, events: body.events, secret },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true },
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'webhook', entityId: created.id, entityName: body.url },
    })
    // secret shown once so the receiver can verify signatures
    return NextResponse.json({ success: true, data: { ...created, secret } }, { status: 201 })
  },
  { permission: 'settings:edit', schema: createSchema, label: 'POST /api/webhooks' },
)
