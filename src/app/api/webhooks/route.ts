import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { newWebhookSecret, WEBHOOK_EVENTS } from '@/lib/webhooks'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
})

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

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('settings:edit')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user

  const parsed = await parseJson(req, createSchema)
  if (parsed instanceof NextResponse) return parsed

  try {
    const secret = newWebhookSecret()
    const created = await prisma.webhookEndpoint.create({
      data: { tenantId, url: parsed.data.url, events: parsed.data.events, secret },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true },
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'webhook', entityId: created.id, entityName: parsed.data.url },
    })
    // secret shown once so the receiver can verify signatures
    return NextResponse.json({ success: true, data: { ...created, secret } }, { status: 201 })
  } catch (err) {
    log.error('POST /api/webhooks', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
